const crypto = require("crypto")

const displayHelp = () => {
  console.log(`Usage: getTez.js [options] <address>
Options:
  -h, --help             Display help information.
  -p, --profile <value>  Set the profile ('user' for 1 Tez or 'baker' for 6000 Tez).
  -n, --network <value>  Set the network name. See available networks at https://teztnets.xyz.
                         Ignored if --faucet-url is set.
  -f, --faucet-url <value> Set the custom faucet URL. Ignores --network.`)
}

const helpAndExit = (exitCode) => {
  displayHelp()
  process.exit(exitCode)
}

const args = process.argv.slice(2)
let address = ""
let profile = ""
let network = ""
let faucetUrl = ""

const parseArgs = async () => {
  while (args.length > 0) {
    const arg = args.shift()
    switch (arg) {
      case "-h":
      case "--help":
        helpAndExit(0)
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
    console.error("Tezos address is required.")
    helpAndExit(1)
  }

  if (!profile) {
    console.error("Profile is required.")
    helpAndExit(1)
  } else if (!["user", "baker"].includes(profile)) {
    console.error("Invalid profile. Allowed values are 'user' or 'baker'.")
    process.exit(1)
  }

  if (!faucetUrl && !network) {
    console.error("Either a network or faucet URL is required.")
    helpAndExit(1)
  }

  if (!faucetUrl) {
    const teztnetsUrl = "https://teztnets.xyz/teztnets.json"
    const response = await fetch(teztnetsUrl)

    if (!response.ok) {
      console.error(`Error fetching networks from ${teztnetsUrl}`)
      process.exit(1)
    }

    for (const net of Object.values(await response.json())) {
      if (net.human_name.toLowerCase() === network) {
        faucetUrl = net.faucet_url
      }
    }

    if (!faucetUrl) {
      console.error("Network not found or not supported.")
      process.exit(1)
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
  console.log("Requesting PoW challenge...")

  const response = await fetch(`${faucetUrl}/challenge`, {
    method: "POST",
    headers: requestHeaders,
    body: `address=${address}&profile=${profile}`,
  })

  const body = await response.json()

  if (!response.ok) {
    console.error(`ERROR: ${body.message}`)
    process.exit(1)
  }

  return body
}

const solvePow = (challenge, difficulty, counter) => {
  console.log(`\nSolving challenge #${counter}...`)

  let nonce = 0
  while (true) {
    const input = `${challenge}:${nonce}`
    const hash = crypto.createHash("sha256").update(input).digest("hex")
    if (hash.startsWith("0".repeat(difficulty) + "8")) {
      console.log(`Solution found`)
      return { solution: hash, nonce }
    }
    nonce++
  }
}

const verifySolution = async (solution, nonce) => {
  console.log("Verifying solution...")

  const response = await fetch(`${faucetUrl}/verify`, {
    method: "POST",
    headers: requestHeaders,
    body: `address=${address}&profile=${profile}&nonce=${nonce}&solution=${solution}`,
  })

  const { txHash, challenge, counter, difficulty, message } =
    await response.json()

  if (!response.ok) {
    console.error(`ERROR: ${message}`)
    process.exit(1)
  }

  if (txHash) {
    console.log(`Tez sent! Check transaction: ${txHash}`)
    return {}
  } else if (challenge && difficulty && counter) {
    console.log(`Solution is valid`)
    return { challenge, difficulty, counter }
  } else {
    console.error(`Error verifying solution: ${message}`)
    process.exit(1)
  }
}

;(async () => {
  await parseArgs()

  let { challenge, difficulty, counter } = await getChallenge()

  while (challenge && difficulty && counter) {
    const { solution, nonce } = solvePow(challenge, difficulty, counter)

    ;({ challenge, difficulty, counter } = await verifySolution(
      solution,
      nonce
    ))

    console.log({ challenge, difficulty, nonce, counter })
  }
})()
