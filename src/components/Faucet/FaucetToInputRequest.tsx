import { ChangeEvent, useState } from "react"
import { Col, Form, Row } from "react-bootstrap"
import Config from "../../Config"
import { validateKeyHash } from "@taquito/utils"
import { Network, StatusContext } from "../../lib/Types"
import FaucetRequestButton from "./FaucetRequestButton"

export default function FaucetToInputRequest({
  network,
  status,
}: {
  network: Network
  status: StatusContext
}) {
  const [inputToAddr, setInputToAddr] = useState<string>("")
  const [inputClass, setInputClass] = useState<string>("")

  const inputId: string = network.name + "-to"

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value: string = event.target.value

    if (validateKeyHash(value) === 3 || value.length === 0) {
      setInputToAddr(value)

      if (value.length > 0) setInputClass("is-valid")
      else setInputClass("")
    } else {
      setInputClass("is-invalid")
    }
  }

  return (
    <>
      <Form.Group className="faucet-address-to">
        <Form.Control
          type="text"
          placeholder="Wallet address"
          id={inputId}
          onChange={handleInput}
          className={inputClass}
          disabled={status.isLoading}
        />
        <Form.Control.Feedback type="invalid">
          Invalid address
        </Form.Control.Feedback>
      </Form.Group>
      <Row>
        <Col>
          <FaucetRequestButton
            network={network}
            address={inputToAddr}
            status={status}
            profile={Config.application.profiles.user.profile}
            amount={Config.application.profiles.user.amount}
          />
        </Col>
        <Col>
          <FaucetRequestButton
            network={network}
            address={inputToAddr}
            status={status}
            profile={Config.application.profiles.baker.profile}
            amount={Config.application.profiles.baker.amount}
          />
        </Col>
      </Row>
    </>
  )
}
