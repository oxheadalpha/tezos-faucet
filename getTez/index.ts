import crypto from "crypto"

/*
We use instantiate a "Console" to stderr for logging so that logs are not
written to stdout when the script is run from the CLI. We want the transaction
hash to be the only stdout once the Tez is sent to the user.
*/
import { Console } from "console"
const console = new Console(process.stderr)
const { log } = console

let VERBOSE: boolean, TIME: boolean

const verboseLog = (message: any) => VERBOSE && log(message)

const [time, timeLog, timeEnd] = [
  console.time,
  console.timeLog,
  console.timeEnd,
].map(
  (f: Function) =>
    (...a: any[]) =>
      TIME && f(...a)
)

const displayHelp = () => {
  log(`CLI Usage: getTez.js [options] <address>
Options:
  -h, --help                Display help information.
  -a, --amount     <value>  The amount of tez to request.
  -n, --network    <value>  Set the faucet's network name. See available networks at https://teztnets.xyz.
                            Ignored if --faucet-url is set.
  -f, --faucet-url <value>  Set the custom faucet URL. Ignores --network.
  -t, --time                Enable PoW challenges timer.
  -v, --verbose             Enable verbose logging.`)
}

const isMainModule = require.main === module

const DISPLAY_HELP = true
const handleError = (message: string, help?: boolean) => {
  if (isMainModule) {
    log(message, "\n")
    help && displayHelp()
    process.exit(1)
  } else {
    help && displayHelp()
    throw new Error(message)
  }
}

let address: string,
  amount: number,
  network: string,
  faucetUrl: string = ""

type GetTezArgs = {
  address: string
  amount: number
  network?: string
  faucetUrl?: string
  verbose?: boolean
  time?: boolean
}

const parseArgs = async (args: string[] | string | GetTezArgs) => {
  if (typeof args === "object" && !Array.isArray(args)) {
    address = args.address || ""
    amount = Number(args.amount)
    network = args.network?.toLowerCase() || ""
    faucetUrl = args.faucetUrl || ""
    VERBOSE = args.verbose || false
    TIME = args.time || false
    return
  }

  // If the file is executed directly by node and not via import then argv will
  // include the file name.
  // args = args || process.argv.slice(isMainModule ? 2 : 1)
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
      case "-a":
      case "--amount":
        amount = Number(args.shift())
        break
      case "-n":
      case "--network":
        network = args.shift()?.toLowerCase() || ""
        break
      case "-f":
      case "--faucet-url":
        faucetUrl = args.shift() || ""
        break
      case "-v":
      case "--verbose":
        VERBOSE = true
        break
      case "-t":
      case "--time":
        TIME = true
        break
      default:
        address = arg || ""
        break
    }
  }

  if (!address) {
    handleError("Tezos address is required.", DISPLAY_HELP)
  }

  if (!amount) {
    handleError("Amount is required.", DISPLAY_HELP)
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

    for (const net of Object.values(await response.json()) as any[]) {
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

const getInfo = async () => {
  verboseLog("Requesting faucet info...")

  const response = await fetch(`${faucetUrl}/info`, {
    headers: requestHeaders,
  })

  const body = await response.json()

  if (!response.ok) {
    handleError(`ERROR: ${body.message}`)
  }

  return body
}

const getChallenge = async () => {
  verboseLog("Requesting PoW challenge...")

  const response = await fetch(`${faucetUrl}/challenge`, {
    method: "POST",
    headers: requestHeaders,
    body: `address=${address}&amount=${amount}`,
  })

  const body = await response.json()

  if (!response.ok) {
    handleError(`ERROR: ${body.message}`)
  }

  return body
}

const solvePow = (
  challenge: string,
  difficulty: number,
  challengeCounter: number
) => {
  if (isMainModule && process.stdout.isTTY) {
    process.stderr.clearLine(0)
    process.stderr.cursorTo(0)
    process.stderr.write(`Solving challenge #${challengeCounter}... `)
  } else {
    verboseLog(`Solving challenge #${challengeCounter}...`)
  }

  let nonce = 0
  time("solved")
  while (true) {
    const input = `${challenge}:${nonce}`
    const hash = crypto.createHash("sha256").update(input).digest("hex")
    if (hash.startsWith("0".repeat(difficulty))) {
      timeEnd("solved")
      timeLog("getTez time")
      verboseLog(`Solution found`)
      return { solution: hash, nonce }
    }
    nonce++
  }
}

const verifySolution = async (
  solution: string,
  nonce: number
): Promise<{
  challenge?: string
  challengeCounter?: number
  difficulty?: number
  txHash?: string
}> => {
  verboseLog("Verifying solution...")

  const response = await fetch(`${faucetUrl}/verify`, {
    method: "POST",
    headers: requestHeaders,
    body: `address=${address}&amount=${amount}&nonce=${nonce}&solution=${solution}`,
  })

  const { txHash, challenge, challengeCounter, difficulty, message } =
    await response.json()

  if (!response.ok) {
    handleError(`ERROR: ${message}`)
  }

  if (txHash) {
    verboseLog(`Solution is valid`)
    verboseLog(`Tez sent! Check transaction: ${txHash}\n`)
    return { txHash }
  } else if (challenge && difficulty && challengeCounter) {
    verboseLog(`Solution is valid\n`)
    return { challenge, difficulty, challengeCounter }
  } else {
    handleError(`Error verifying solution: ${message}`)
  }
  return {}
}

const getTez = async (args: string[] | string | GetTezArgs) => {
  await parseArgs(args)

  const faucetInfo = await getInfo()

  if (!faucetInfo.challengesEnabled) {
    const txHash = (await verifySolution("", 0))?.txHash
    return txHash
  }

  let { challenge, difficulty, challengeCounter } = await getChallenge()
  time("getTez time")

  while (challenge && difficulty && challengeCounter) {
    verboseLog({ challenge, difficulty, challengeCounter })

    const { solution, nonce } = solvePow(
      challenge,
      difficulty,
      challengeCounter
    )

    verboseLog({ nonce, solution })

    let txHash
    ;({ challenge, difficulty, challengeCounter, txHash } =
      await verifySolution(solution, nonce))

    if (txHash) {
      timeEnd("getTez time")
      return txHash
    }
  }
}

if (isMainModule) {
  log("getTez.js by Oxhead Alpha - Get Free Tez\n")
  // If the file is executed directly by node and not via import then argv will
  // include the file name.
  const args = process.argv.slice(isMainModule ? 2 : 1)
  getTez(args).then((txHash) => txHash && process.stdout.write(txHash))
}

export = getTez
