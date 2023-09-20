import { Badge, Card } from "react-bootstrap"
import { Wallet2 } from "react-bootstrap-icons"
import { toBalance } from "../../lib/Utils"

import { UserContext } from "../../lib/Types"

function UserInfo({
  user,
  displayBalance,
}: {
  user: UserContext
  displayBalance: boolean
}) {
  return (
      <Card
        bg="light"
        text="dark"
        className="d-inline-block mw-100"
      >
        <Card.Body className="d-flex align-items-center p-1">
          <Wallet2 className="me-2" size={24} />
          <span className="text-truncate fw-bold">
            {user.userAddress || "Not connected"}
          </span>
          {displayBalance && (
            <Badge bg="secondary" className="ms-2 balance-badge">
              {toBalance(user.userBalance)} ꜩ
            </Badge>
          )}
        </Card.Body>
      </Card>
  )
}

export default UserInfo
