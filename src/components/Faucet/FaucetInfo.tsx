import { useState } from "react";
import { Badge, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { DropletFill, Files } from "react-bootstrap-icons";
import { toBalance } from "../../lib/Utils";

function FaucetInfo({ faucetAddress, faucetBalance }: { faucetAddress: string, faucetBalance: number }) {

    const [tooltipLabel, setTooltipLabel] = useState<string>("Click to copy faucet address");

    const copy = () => {
        navigator.clipboard.writeText(faucetAddress).then(() => {
            setTooltipLabel("Copied!");
        })
        setTimeout(() => {
            setTooltipLabel("Click to copy faucet address");
        }, 2000);
    }

    return (
        <>
            <Card.Text className="faucet-info">

                <Badge bg="light" text="dark" className="balance-badge">
                    <DropletFill /> &nbsp; {faucetAddress} &nbsp;
                    <Badge bg="secondary" as="span" className="balance-badge">{toBalance(faucetBalance)} ꜩ</Badge>
                    &nbsp;
                    <OverlayTrigger
                        key="right"
                        placement="right"
                        overlay={
                            <Tooltip id={`tooltip-right`}>
                                {tooltipLabel}
                            </Tooltip>
                        }
                    >
                        <Files onClick={copy} />
                    </OverlayTrigger>
                </Badge>

            </Card.Text>
        </>
    )
}

export default FaucetInfo;

/*

                <p><b>Address:</b> {faucetAddress}</p>
                <p><b>Balance:</b> {toBalance(faucetBalance)} ꜩ</p>

                */