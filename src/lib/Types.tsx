import { Dispatch, SetStateAction } from "react"
import { TezosToolkit } from "@taquito/taquito"
import { BeaconWallet } from "@taquito/beacon-wallet"
import { NetworkType } from "@airgap/beacon-sdk"

type ApplicationConfig = {
  name: string
  googleCaptchaSiteKey: string
  isBeaconWallet?: boolean
  backendUrl: string
  githubRepo: string
  profiles: Profiles
}

type BackendProfile = {
  profile: string
  amount: number
}

type Profiles = {
  user: BackendProfile
  baker: BackendProfile
}

type ConfigType = {
  application: ApplicationConfig
  network: Network
}

// Must match Config.tsx "network" item
type Network = {
  name: string
  rpcUrl: string
  faucetAddress: string
  viewer: string
  networkType?: NetworkType
}

type UserContext = {
  userAddress: string
  setUserAddress: Dispatch<SetStateAction<string>>
  userBalance: number
  setUserBalance: Dispatch<SetStateAction<number>>
}

type TestnetContext = {
  network: Network
  wallet: BeaconWallet
  setWallet: Dispatch<SetStateAction<any>>
  Tezos: TezosToolkit
  setTezos: Dispatch<SetStateAction<any>>
}

type ChallengeResponse = {
  status?: string
  message?: string
  challenge?: string
  difficulty?: number
}

type VerifyResponse = {
  status?: string
  message?: string
  challenge?: string
  difficulty?: number
  txHash?: string
}

type StatusContext = {
  isLoading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  status: string
  setStatus: Dispatch<SetStateAction<string>>
  statusType: string
  setStatusType: Dispatch<SetStateAction<string>>
  powWorker: Worker | null
  setPowWorker: Dispatch<SetStateAction<Worker | null>>
}

export type {
  ConfigType,
  Network,
  UserContext,
  StatusContext,
  TestnetContext,
  ChallengeResponse,
  VerifyResponse,
  BackendProfile,
}
