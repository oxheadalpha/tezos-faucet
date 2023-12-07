import FaucetRequestButton from "./FaucetRequestButton"
import UserInfo from "./UserInfo"

import { Network, StatusContext, UserContext } from "../../lib/Types"

function FaucetToWalletRequest({
  user,
  network,
  status,
  amount,
  setAmount,
  inputToAddr,
  setInputToAddr
}: {
  user: UserContext
  network: Network
  status: StatusContext
  amount: number
  setAmount: (amount: number) => void
  inputToAddr: any
  setInputToAddr: any
}) {
  return (
    <>
      <UserInfo user={user} displayBalance={true} />

      <FaucetRequestButton
        address={user.userAddress}
        disabled={!user.userAddress || status.isLoading}
        network={network}
        status={status}
        amount={amount}
        setAmount={setAmount}
      />
    </>
  )
}

export default FaucetToWalletRequest
