import { useState, useEffect } from "react"
import { TezosToolkit } from "@taquito/taquito"
import { Alert, Card, Col, Row, Button, Spinner, Form } from "react-bootstrap"
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
  const [showPowProgress, setShowPowProgress] = useState(false)
  const [powWorker, setPowWorker] = useState<Worker | null>(null)
  const [showAlert, setShowAlert] = useState(
    localStorage.getItem("showAlert") === "true"
  )

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
    if (statusType && statusType !== "") setShowPowProgress(true)
    if (!showAlert) setShowAlert(false)
  }, [statusType, showAlert])

  return (
    <Card className="mb-3">
      <Card.Header>
        <Card.Title>{network.name} faucet</Card.Title>
      </Card.Header>

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
            {showPowProgress && status && (
              <Alert
                variant={statusType}
                onClose={() => setShowPowProgress(false)}
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
                            setShowPowProgress(false)
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
        <hr />

        <div className="d-flex justify-content-end">
          {!showAlert && (
            <Button
              variant="info"
              onClick={() => {
                setShowAlert(true)
                localStorage.setItem("showAlert", "true")
              }}
            >
              Show Info
            </Button>
          )}
        </div>

        <Alert show={showAlert} variant="info" className="mt-3">
          <p>
            To ensure fair distribution of Tez, we've introduced proof of work
            challenges. Before you receive your Tez, your browser will need to
            solve these challenges. This is an automatic process that helps us
            prevent abuse and ensure everyone gets their fair share.
          </p>
          <p>
            The number and difficulty of these challenges depend on the amount
            of Tez you request. The more Tez you ask for, the more challenges
            your browser will need to solve. This means it might take a bit
            longer to receive your Tez if you request a larger amount.
          </p>
          <p>
            Don't worry, your browser will automatically solve these challenges.
            All you need to do is wait a little while for the process to
            complete before you receive your Tez.
          </p>

          <hr />
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-info"
              onClick={() => {
                setShowAlert(false)
                localStorage.setItem("showAlert", "false")
              }}
            >
              Hide
            </Button>
          </div>
        </Alert>
      </Card.Body>
    </Card>
  )
}
