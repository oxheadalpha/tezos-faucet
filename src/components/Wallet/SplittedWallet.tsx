import { BeaconEvent, defaultEventCallbacks } from "@airgap/beacon-sdk";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { TezosToolkit } from "@taquito/taquito";
import Config from "../../Config";
import { useEffect } from "react";
import { Button, Card } from "react-bootstrap";
import UserInfo from "../Faucet/UserInfo";
import { Network, TestnetContext, UserContext } from "../../lib/Types";

function SplittedWallet({ user, testnetContext, network }: { user: UserContext, testnetContext: TestnetContext, network: Network }) {

    /**
     * Set user address and balances on wallet connection
     */
    const setup = async (userAddress: string): Promise<void> => {

        user.setUserAddress(userAddress);

        const balance = await testnetContext.Tezos.tz.getBalance(userAddress);
        user.setUserBalance(balance.toNumber());
    };

    const connectWallet = async (): Promise<void> => {

        if (!network.networkType) {
            console.error("No network defined.");
            return;
        }

        try {
            await testnetContext.wallet.requestPermissions({
                network: {
                    type: network.networkType,
                    rpcUrl: network.rpcUrl
                }
            });
            // gets user's address
            const userAddress = await testnetContext.wallet.getPKH();
            await setup(userAddress);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        (async () => {
            // creates a wallet instance
            const wallet = new BeaconWallet({
                name: Config.application.name,
                preferredNetwork: network.networkType,
                disableDefaultEvents: true, // Disable all events / UI. This also disables the pairing alert.
                eventHandlers: {
                    // To keep the pairing alert, we have to add the following default event handlers back
                    [BeaconEvent.PAIR_INIT]: {
                        handler: defaultEventCallbacks.PAIR_INIT
                    },
                    [BeaconEvent.PAIR_SUCCESS]: {
                        handler: data => console.log(data.publicKey)
                    }
                }
            });
            testnetContext.Tezos.setWalletProvider(wallet);
            testnetContext.setWallet(wallet);
            // checks if wallet was connected before
            const activeAccount = await wallet.client.getActiveAccount();
            if (activeAccount) {
                const userAddress = await wallet.getPKH();
                await setup(userAddress);
            }

        })();
    }, []);

    const disconnectWallet = async (): Promise<void> => {
        user.setUserAddress("");
        user.setUserBalance(0);
        const tezosTK = new TezosToolkit(network.rpcUrl);
        testnetContext.setTezos(tezosTK);
        if (testnetContext.wallet) {
            await testnetContext.wallet.clearActiveAccount();
        }
        window.location.reload();
    };

    return (
        <Card>
            <Card.Header>My wallet</Card.Header>
            <Card.Body>
                {(user.userAddress != null && user.userAddress !== "") &&
                    <>
                        <Card.Text>
                            <UserInfo user={user} displayBalance={false} />
                        </Card.Text>
                        <Card.Text>
                            <Button variant="outline-danger" onClick={disconnectWallet}>Disconnect</Button>
                        </Card.Text>
                    </>
                }

                {(user.userAddress == null || user.userAddress === "") &&
                    <Card.Text>
                        <Button variant="outline-primary" onClick={connectWallet}>Connect wallet</Button>
                    </Card.Text>
                }
            </Card.Body>
        </Card>
    )
}

export default SplittedWallet;