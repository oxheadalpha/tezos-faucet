"use strict"
const crypto = require("crypto")

/*
We use console.error for logging so that logs are not written to stdout when the
script is run from the CLI. We want the transaction hash to be the only output
once the Tez is sent to the user.
*/
const { error: log } = require("console")

const displayHelp = () => {
  log(`Usage: getTez.js [options] <address>
Options:
  -h, --help             Display help information.
  -p, --profile <value>  Set the profile ('user' for 1 Tez or 'baker' for 6000 Tez).
  -n, --network <value>  Set the network name. See available networks at https://teztnets.xyz.
                         Ignored if --faucet-url is set.
  -f, --faucet-url <value> Set the custom faucet URL. Ignores --network.`)
}

const isMainModule = require.main === module

const DISPLAY_HELP = true
const handleError = (message, help) => {
  if (isMainModule) {
    log(message)
    help && displayHelp()
    process.exit(1)
  } else {
    help && displayHelp()
    throw new Error(message)
  }
}

let address = ""
let profile = ""
let network = ""
let faucetUrl = ""

const parseArgs = async (args) => {
  // If the file is executed directly by node and not via import then argv will
  // include the file name.
  args = args || process.argv.slice(isMainModule ? 2 : 1)
  if (typeof args === "string") args = args.split(" ")

  while (args.length > 0) {
    const arg = args.shift()
    switch (arg) {
      case "-h":
      case "--help":
        if (isMainModule) {
          displayHelp()
          process.exit(0)
        } else {
          throw new Error("'--help' passed")
        }
      case "-p":
      case "--profile":
        profile = args.shift().toLowerCase()
        break
      case "-n":
      case "--network":
        network = args.shift().toLowerCase()
        break
      case "-f":
      case "--faucet-url":
        faucetUrl = args.shift()
        break
      default:
        address = arg
        break
    }
  }

  if (!address) {
    handleError("Tezos address is required.", DISPLAY_HELP)
  }

  if (!profile) {
    handleError("Profile is required.", DISPLAY_HELP)
  } else if (!["user", "baker"].includes(profile)) {
    handleError("Invalid profile. Allowed values are 'user' or 'baker'.")
  }

  if (!faucetUrl && !network) {
    handleError("Either a network or faucet URL is required.", DISPLAY_HELP)
  }

  if (!faucetUrl) {
    const teztnetsUrl = "https://teztnets.xyz/teztnets.json"
    const response = await fetch(teztnetsUrl)

    if (!response.ok) {
      handleError(`Error fetching networks from ${teztnetsUrl}`)
    }

    for (const net of Object.values(await response.json())) {
      if (net.human_name.toLowerCase() === network) {
        faucetUrl = net.faucet_url
      }
    }

    if (!faucetUrl) {
      handleError("Network not found or not supported.")
    }
  }
}

const requestHeaders = {
  // `fetch` by default sets "Connection: keep-alive" header. Was causing
  // ECONNRESET errors with localhost.
  Connection: "close",
  "Content-Type": "application/x-www-form-urlencoded",
}

const getChallenge = async () => {
  log("Requesting PoW challenge...")

  const response = await fetch(`${faucetUrl}/challenge`, {
    method: "POST",
    headers: requestHeaders,
    body: `address=${address}&profile=${profile}`,
  })

  const body = await response.json()

  if (!response.ok) {
    handleError(`ERROR: ${body.message}`)
  }

  return body
}

const solvePow = (challenge, difficulty, counter) => {
  log(`\nSolving challenge #${counter}...`)

  let nonce = 0
  while (true) {
    const input = `${challenge}:${nonce}`
    const hash = crypto.createHash("sha256").update(input).digest("hex")
    if (hash.startsWith("0".repeat(difficulty))) {
      log(`Solution found`)
      return { solution: hash, nonce }
    }
    nonce++
  }
}

const verifySolution = async (solution, nonce) => {
  log("Verifying solution...")

  const response = await fetch(`${faucetUrl}/verify`, {
    method: "POST",
    headers: requestHeaders,
    body: `address=${address}&profile=${profile}&nonce=${nonce}&solution=${solution}`,
  })

  const { txHash, challenge, counter, difficulty, message } =
    await response.json()

  if (!response.ok) {
    handleError(`ERROR: ${message}`)
  }

  if (txHash) {
    log(`Solution is valid`)
    log(`Tez sent! Check transaction: ${txHash}`)
    return { txHash }
  } else if (challenge && difficulty && counter) {
    log(`Solution is valid`)
    return { challenge, difficulty, counter }
  } else {
    handleError(`Error verifying solution: ${message}`)
  }
}

const getTez = async (args) => {
  await parseArgs(args)

  let { challenge, difficulty, counter } = await getChallenge()

  while (challenge && difficulty && counter) {
    const { solution, nonce } = solvePow(challenge, difficulty, counter)

    let txHash
    ;({ challenge, difficulty, counter, txHash } = await verifySolution(
      solution,
      nonce
    ))

    // log({ challenge, difficulty, nonce, counter })
    if (txHash) return txHash
  }
}

if (isMainModule) {
  return getTez().then((txHash) => process.stdout.write(txHash))
}

module.exports = getTez