import { useState, useEffect} from "react"
import { TezosToolkit } from "@taquito/taquito"
import { Alert, Card, Col, Row, Button, Spinner } from "react-bootstrap"
import Parser from "html-react-parser"
import FaucetToWalletRequest from "./FaucetToWalletRequest"
import FaucetToInputRequest from "./FaucetToInputRequest"
import { Network, UserContext, StatusContext } from "../../lib/Types"

export default function SplittedFaucet({
  network,
  user,
  Tezos,
}: {
  network: Network
  user: UserContext
  Tezos: TezosToolkit
}) {
  const faucetAddress = network.faucetAddress
  const [faucetBalance, setFaucetBalance] = useState<number>(0)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [status, setStatus] = useState<string>("")
  const [statusType, setStatusType] = useState<string>("")
  const [showAlert, setShowAlert] = useState(false)
  const [powWorker, setPowWorker] = useState<Worker | null>(null)

  const statusContext: StatusContext = {
    isLoading,
    setLoading,
    status,
    setStatus,
    statusType,
    setStatusType,
    powWorker,
    setPowWorker,
  }

  const readBalances = async (): Promise<void> => {
    try {
      const faucetBalance = await Tezos.tz.getBalance(faucetAddress)
      setFaucetBalance(faucetBalance.toNumber())

      const userBalance = await Tezos.tz.getBalance(user.userAddress)
      user.setUserBalance(userBalance.toNumber())
    } catch (error) {
      //console.log(error);
    }
  }

  useEffect(() => {
    readBalances()
  }, [isLoading])

  useEffect(() => {
    if (statusType && statusType !== "") setShowAlert(true)
  }, [statusType])

  return (
    <Card>
      <Card.Header>{network.name} faucet</Card.Header>
      <Card.Body>
        <Row>
          <Col className="faucet-part-title">Fund your web wallet</Col>
          <Col className="faucet-part-title">Or fund any address</Col>
        </Row>
        <Row>
          <Col className="faucet-part">
            <FaucetToWalletRequest
              network={network}
              user={user}
              status={statusContext}
            />
          </Col>
          <Col className="faucet-part">
            <FaucetToInputRequest network={network} status={statusContext} />
          </Col>
        </Row>
        <Row>
          <Col>
            <br />
            {showAlert && status && (
              <Alert
                variant={statusType}
                onClose={() => setShowAlert(false)}
                dismissible={!isLoading}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-inline-block">
                    {Parser(status)}
                    {isLoading && <Spinner size="sm" className="ms-1" />}
                  </div>
                  {isLoading && (
                    <div>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          if (powWorker) {
                            powWorker.terminate()
                            setPowWorker(null)
                            setLoading(false)
                            setShowAlert(false)
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </Alert>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}
