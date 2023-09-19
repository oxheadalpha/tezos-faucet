import FaucetRequestButton from "./FaucetRequestButton"
import UserInfo from "./UserInfo"

import { Network, StatusContext, UserContext } from "../../lib/Types"

function FaucetToWalletRequest({
  user,
  network,
  status,
}: {
  user: UserContext
  network: Network
  status: StatusContext
}) {
  return (
    <>
      <UserInfo user={user} displayBalance={true} />

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
