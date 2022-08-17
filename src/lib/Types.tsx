import { Dispatch, SetStateAction } from "react";
import { TezosToolkit } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { NetworkType } from "@airgap/beacon-sdk";

type ApplicationConfig = {
    name: string;
    googleCaptchaSiteKey: string;
    isBeaconWallet?: boolean;
    backendUrl: string;
    githubRepo: string;
    profiles: Profiles;
}

type Profiles = {
    user: BackendProfile;
    baker: BackendProfile;
}

type ConfigType = {
    application: ApplicationConfig;
    network: Network;
}

// Must match Config.tsx "network" item
type Network = {
    name: string;
    rpcUrl: string;
    faucetAddress: string;
    viewer: string;
    networkType?: NetworkType | undefined;
}

type UserContext = {
    userAddress: string;
    setUserAddress: Dispatch<SetStateAction<string>>;
    userBalance: number;
    setUserBalance: Dispatch<SetStateAction<number>>;
};

type TestnetContext = {
    network: Network;
    wallet: BeaconWallet;
    setWallet: Dispatch<SetStateAction<any>>;
    Tezos: TezosToolkit;
    setTezos: Dispatch<SetStateAction<any>>;
}

type BackendResponse = {
    status: string;
    message?: string;
    txHash?: string;
}

type BackendProfile = {
    profile: string;
    amount: number;
}

export type { ConfigType, Network, UserContext, TestnetContext, BackendResponse, BackendProfile };