# get-tez

This zero dependency package provides a programmatic interface to interact with the [Tezos faucet](https://github.com/oxheadalpha/tezos-faucet-backend). It is a script that can be run from a JavaScript/Typescript program or directly from a shell.

## Installation

You can install the package from npm:

```bash
npm install @oxheadalpha/get-tez
```

## Usage

### JS / TS
After installing the package, you can import it in your Node.js JavaScript or TypeScript project:

```javascript
const getTez = require("@oxheadalpha/get-tez")

// OR

import getTez from "@oxheadalpha/get-tez"
```

You can then use the `getTez` function to interact with the Tezos faucet. The function takes an object as an argument, with the following properties:

- `address`: The address to send Tez to.
- `amount`: The amount of Tez to request.
- `network`: The faucet's network name. Must match a network name with a faucet listed at https://teztnets.xyz. Ignored if `faucetUrl` is set.
- `faucetUrl`: The custom faucet URL. Ignores `network`.

Here is an example of how to use the `getTez` function:

```javascript
const txHash = await getTez({
  address: "tz1...",
  amount: 10,
  network: "ghostnet",
})
```

Example using the `faucetUrl` parameter:
```js
const txHash = await getTez({
  address: "tz1...",
  amount: 10,
  faucetUrl: "https://my-custom-faucet-url.com",
})
```

### CLI

You can also run the script directly from the command line with Node.js. When you install the package via npm, the JavaScript file will be located at `node_modules/@oxheadalpha/get-tez/dist/getTez.js`. You can run it with the following command:

```bash
node node_modules/@oxheadalpha/get-tez/dist/getTez.js tz1... --amount 10 --network ghostnet
```

Run the script with the `--help` flag for more information.
