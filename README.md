# Tezos Faucet Frontend

## Presentation

A one-click faucet for Tezos, now enhanced with a PoW (Proof of Work) challenge to ensure secure and fair Tez distribution.

### Made with

- Typescript
- Vite
- React
- Bootstrap
- Taquito
- Beacon Wallet

## Overview

The faucet's backend code can be located at [tezos-faucet-backend](https://github.com/oxheadalpha/tezos-faucet-backend). The backend handles the faucet's private key, CAPTCHA secret, PoW challenge creation and solution verification, and the amounts of Tez sent.

Sent amounts and challenge details are configured via `profiles`. This enforces security, avoiding a user trying to change amounts in frontend javascript code and drying out the faucet. Two profiles are created by default: **user**, to get 1 xtz and **baker** to get 6000 xtz.

### Proof of Work (PoW) Challenge

To mitigate potential abuse and ensure a fair distribution of Tez, users are now required to solve computational challenges before receiving their Tez. This PoW mechanism discourages bots and other malicious actors from exploiting the faucet.

### Application Flow

1. **Initiating the Process**: Upon a Tez request, the frontend communicates with the `/challenge` endpoint of the backend, providing essential details such as the user's address and the profile type.
2. **Receiving and Solving the Challenge**: The backend then sends a challenge. The difficulty and amount of challenges to be solved depends on factors such as if a CAPTCHA token was submitted and how much Tez was requested. The browser will create a webworker which will begin the process of finding a solution.
3. **Submitting and Verifying the Solution**: After solving, the frontend sends the solution to the `/verify` endpoint. The backend then checks its validity. Assuming it is valid, if more challenges are pending, the user proceeds to solve them. Once all challenges are cleared, Tez is sent to the user's account.

## Programmatic Faucet Usage

We provide a [`getTez.js`](./scripts/getTez.js) script for programmatic faucet usage. This script can be run from a JavaScript program or directly from a shell.

Please note that the `getTez.js` script does not use CAPTCHA. Therefore, challenges can be configured to make them more difficult and require more of them to be solved when using the programmatic faucet.

## Setup

To setup the faucet for a new network:

1. Update Beacon Wallet lib to make sure it will handle the new network
2. Deploy a new instance of backend
3. Configure faucet to use backend
4. Deploy faucet

### 1. Update Beacon Wallet configuration for new network

Currently supported networks include:

- Mainnet
- Ghostnet
- Mondaynet
- Dailynet
- Nairobinet

To add a new network, first check that `@airgap/beacon-sdk` handles it ([check their config on the latest release](https://github.com/airgap-it/beacon-sdk/blob/v4.0.6/packages/beacon-types/src/types/beacon/NetworkType.ts)), then update:

```
npm i @airgap/beacon-sdk
```

And in `Config.tsx`, add the `case` for the new network using `NetworkType`.

### 2. Deploy backend

See https://github.com/oxheadalpha/tezos-faucet-backend

### 3. Update configuration file: `config.json`

**Application configuration:**

- `name`: application name, displayed in header

- `googleCaptchaSiteKey`: Google ReCAPTCHA public site key

- `backendUrl`: Base URL of faucet backend to connect to.

- `githubRepo`: URL of Github repository (displayed in header with Github icon).

- `disableChallenges`: If PoW challenges need to be solved before receiving Tez. The backend must also disable challenges. Defaults to `false`.

- `profiles`: backend profiles, must match backend configuration.

- - `user`: user profile, to get 1 XTZ

- - `baker`: baker profile, to get 6000 XTZ

- - - `amount`: amount given for the profile, for display only.

**Network configuration:**

- `name`: network name. Must match one of [@airgap/beacon-sdk NetworkType](https://github.com/airgap-it/beacon-sdk/blob/v4.0.6/packages/beacon-types/src/types/beacon/NetworkType.ts) value (case insensitive). Also used to be displayed.

- `rpcUrl`: Tezos network RPC endpoint to be used by faucet

- `faucetAddress`: public Tezos address of faucet

- `viewer`: URL of a block explorer that displays operation detail like `http://viewer-url.com/{tx_hash}` (eg. https://ghost.tzstats.com)

### 4. Deploy

Deploy with Docker using Dockerfile.

Build Docker image:

```
docker build . -t tezos-faucet
```

Run Docker image:

```
docker run -p 8080:8080 tezos-faucet
```
