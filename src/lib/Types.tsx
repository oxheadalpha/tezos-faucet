import { Dispatch, SetStateAction } from "react"
import { TezosToolkit } from "@taquito/taquito"
import { BeaconWallet } from "@taquito/beacon-wallet"
import { NetworkType } from "@airgap/beacon-sdk"

type BackendProfile = {
  amount: number
}

type Profiles = {
  user: BackendProfile
  baker: BackendProfile
}

type ApplicationConfig = {
  name: string
  googleCaptchaSiteKey: string
  isBeaconWallet?: boolean
  backendUrl: string
  githubRepo: string
  profiles: Profiles
  disableChallenges?: boolean
}

export type ConfigType = {
  application: ApplicationConfig
  network: Network
}

export type Challenge = {
  challenge: string
  difficulty: number
  challengeCounter: number
}

export type ChallengeResponse = Partial<Challenge> & {
  status?: string
  message?: string
}

export type VerifyResponse = Partial<Challenge> & {
  status?: string
  message?: string
  txHash?: string
}

// Must match Config.tsx "network" item
export type Network = {
  name: string
  rpcUrl: string
  faucetAddress: string
  viewer: string
  networkType?: NetworkType
}

export type UserContext = {
  userAddress: string
  setUserAddress: Dispatch<SetStateAction<string>>
  userBalance: number
  setUserBalance: Dispatch<SetStateAction<number>>
}

export type TestnetContext = {
  network: Network
  wallet: BeaconWallet
  setWallet: Dispatch<SetStateAction<any>>
  Tezos: TezosToolkit
  setTezos: Dispatch<SetStateAction<any>>
}

export type StatusContext = {
  isLoading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  status: string
  setStatus: Dispatch<SetStateAction<string>>
  statusType: string
  setStatusType: Dispatch<SetStateAction<string>>
  powWorker: Worker | null
  setPowWorker: Dispatch<SetStateAction<Worker | null>>
}
