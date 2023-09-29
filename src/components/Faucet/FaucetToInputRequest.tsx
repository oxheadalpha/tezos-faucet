import { validateKeyHash } from "@taquito/utils"
import { ChangeEvent, useState } from "react"
import { Form } from "react-bootstrap"
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
  const disableButton = status.isLoading || inputClass !== "is-valid"

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value: string = event.target.value

    if (value.length === 0 || validateKeyHash(value) === 3) {
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
          placeholder="tz1..."
          id={inputId}
          onChange={handleInput}
          className={inputClass}
          disabled={status.isLoading}
        />
        <Form.Control.Feedback type="invalid" className="position-absolute">
          Invalid address
        </Form.Control.Feedback>
      </Form.Group>

      <FaucetRequestButton
        address={inputToAddr}
        disabled={disableButton}
        network={network}
        status={status}
      />
    </>
  )
}
