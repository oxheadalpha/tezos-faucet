import { TezosToolkit } from "@taquito/taquito";
import { Col, Row } from "react-bootstrap";
import Config from "../../Config";
import FaucetRequestButton from "./FaucetRequestButton";
import UserInfo from "./UserInfo";

function FaucetToWalletRequest({ user, network, status, Tezos }: { user: any, network: any, status: any, Tezos: TezosToolkit }) {

    return (
        <>
            <div className="faucet-part-user">
                <UserInfo user={user} displayBalance={true} />
            </div>
            <Row>
                <Col>
                    <FaucetRequestButton network={network} to={user.userAddress} status={status} profile={Config.application.profiles.user.profile} amount={Config.application.profiles.user.amount} />
                </Col>
                <Col>
                    <FaucetRequestButton network={network} to={user.userAddress} status={status} profile={Config.application.profiles.baker.profile} amount={Config.application.profiles.baker.amount} />
                </Col>
            </Row>
        </>
    )
}

export default FaucetToWalletRequest;