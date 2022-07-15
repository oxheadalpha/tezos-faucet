import { Badge } from "react-bootstrap";
import { PersonFill } from "react-bootstrap-icons";
import { toBalance } from "../../lib/Utils";

function UserInfo({ user, displayBalance }: { user: any, displayBalance: boolean }) {
    return (
        <>
            <Badge bg="light" text="dark" className="balance-badge">
                <PersonFill /> &nbsp; {user.userAddress || "Not connected"} &nbsp;
                {
                    displayBalance &&
                    <Badge bg="secondary" as="span" className="balance-badge">{toBalance(user.userBalance)} ꜩ</Badge>
                }
            </Badge>
        </>
    )
}

export default UserInfo;