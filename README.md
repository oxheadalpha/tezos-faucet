# Tezos faucet

## Presentation

One-click faucet for Tezos.

## Setup

To setup the faucet for a new network:

1. Update Beacon Wallet lib to make sure it will handle the new network.
2. Deploy a new instance of backend
3. Configure faucet to use backend
4. Deploy faucet


### 1. Update Beacon Wallet configuration for new network

Currently supported networks: 

- Mainnet
- Ghostnet
- Ithacanet
- Jakartanet
- Kathmandunet

To add a new network, first check that `@airgap/beacon-sdk` handles it ([check their config](https://github.com/airgap-it/beacon-sdk/blob/312226a3588eddd804044b52dfcf1d0512f1a9df/packages/beacon-types/src/types/beacon/NetworkType.ts)), then update:

```npm i @airgap/beacon-sdk```

And in `Config.tsx`, add the `case` for the new network using `NetworkType`.

### 2. Deploy backend

See https://github.com/avysel/tezos-faucet-backend

### 3. Update configuration file: `config.json`

**Application configuration:**

`name`: application name, displayed in header

`googleCaptchaSiteKey`: Google ReCAPTCHA public site key

`backendUrl`: Base URL of backend to connect to.

`githubRepo`: URL of Github repository (displayed in header with Github icon).

`profiles`: backend profiles, must match backend configuration.

-- `user`: user profile, to get a single XTZ

-- `baker`: baker profile, to get 6000 XTZ

-- -- `profile`: backend profile ID

-- -- `amount`: amount given for the profile, for display only.


**Network configuration:**

`name`: network name. Must match one of `@airgap/beacon-sdk` `NetworkType` value (case insensitive). Also used to be displayed.

`rpcUrl`: Tezos network RPC endpoint to be used by faucet

`faucetAddress`: public Tezos address of faucet

```viewer```: URL of a viewer that displays operation detail like `http://viewer-url.com/{tx_hash}` (eg. https://jakarta.tzstats.com)

`allowSendButton`: true to display 'Send 1 xtz to faucet'. False otherwise.

### 4. Deploy

Deploy with Docker using Dockerfile.

Build Docker image:

```
docker build . -t tezos-faucet
```

Run Docker image:
```
docker run -p 80:80 tezos-faucet
```

## Deep inside

### Made with

- React
- Craco
- Typescript
- Taquito
- Beacon Wallet
- ReactBootstrap