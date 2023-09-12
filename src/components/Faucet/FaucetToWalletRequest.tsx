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

      <FaucetRequestButton
        address={user.userAddress}
        disabled={!user.userAddress || status.isLoading}
        network={network}
        status={status}
      />
    </>
  )
}

export default FaucetToWalletRequest
