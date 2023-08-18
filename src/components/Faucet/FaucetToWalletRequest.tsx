import { Col, Row } from "react-bootstrap"
import { sortedProfiles } from "../../Config"
import { Network, StatusContext } from "../../lib/Types"
import FaucetRequestButton from "./FaucetRequestButton"
import UserInfo from "./UserInfo"

function FaucetToWalletRequest({
  user,
  network,
  status,
}: {
  user: any
  network: Network
  status: StatusContext
}) {
  return (
    <>
      <div className="faucet-part-user">
        <UserInfo user={user} displayBalance={true} />
      </div>
      <Row>
        {sortedProfiles.map(([profile, { amount }]) => (
          <Col key={profile} lg={6}>
            <FaucetRequestButton
              address={user.userAddress}
              amount={amount}
              disabled={!user.userAddress || status.isLoading}
              network={network}
              profile={profile}
              status={status}
            />
          </Col>
        ))}
      </Row>
    </>
  )
}

export default FaucetToWalletRequest
