import { Button, Spinner } from "react-bootstrap";
import { useState } from "react";
import { TezosToolkit } from "@taquito/taquito";
import { errorMapping } from "../../lib/Errors";


function FaucetSendButton({ user, network, Tezos, status }: { user: any, network: any, Tezos: TezosToolkit, status: any }) {

    const [isLocalLoading, setLocalLoading] = useState<boolean>(false);

    const send = async (): Promise<void> => {
        status.setStatusType(null);
        status.setLoading(true);
        setLocalLoading(true);
        status.setStatus(null);

        const op = await Tezos.wallet.transfer({ to: network.faucetAddress, amount: 1 }).send()
            .then((operation) => {
                status.setStatusType("primary");
                const viewerUrl = `${network.viewer}/${operation.opHash}`;
                status.setStatus(` ꜩ is on the way! <a target="_blank" href="${viewerUrl}" class="alert-link">Check it.</a>`);
                // Wait for 1 confirmation to continue
                return operation.confirmation(1).then(() => operation.opHash);
            })
            .then((opHash) => {
                const viewerUrl = `${network.viewer}/${opHash}`;
                status.setStatus(`The faucet thanks you! <a target="_blank" href="${viewerUrl}" class="alert-link">Check it.</a>`);
                status.setStatusType("success");
                status.setLoading(false);
                setLocalLoading(false);
            })
            .catch((error) => {
                //console.log(error);
                status.setStatus(error.description || errorMapping(error.name));
                status.setStatusType("danger");
                status.setLoading(false);
                setLocalLoading(false);
            })

            console.log(op);
    };

    return (
        <>
            <Button variant="outline-danger"
                disabled={status.isLoading || !user}
                onClick={send}>
                {isLocalLoading ? `Sending 1 ꜩ to faucet` : `Send 1 ꜩ to faucet`}
                &nbsp; {isLocalLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : ""}
            </Button>
        </>

    )
}

export default FaucetSendButton;