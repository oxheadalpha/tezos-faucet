import { NetworkType } from "@airgap/beacon-sdk";
import configData from './config.json';
import { ConfigType } from "./lib/Types";

let Config: ConfigType = configData;

switch (Config.network.name.toLowerCase()) {
    case "Mainnet".toLowerCase():
        Config.network.networkType = NetworkType.MAINNET;
        break;
    case "Ithacanet".toLowerCase():
        Config.network.networkType = NetworkType.ITHACANET;
        break;
    case "Jakartanet".toLowerCase():
        Config.network.networkType = NetworkType.JAKARTANET;
        break;
    case "Ghostnet".toLowerCase():
        Config.network.networkType = NetworkType.GHOSTNET;
        break;
    default:
        Config.network.networkType = undefined;
}

Config.application.isBeaconWallet = (Config.network.networkType !== undefined);

console.log(Config);

export default Config;