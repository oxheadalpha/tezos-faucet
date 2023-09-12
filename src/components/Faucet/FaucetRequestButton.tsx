import axios from "axios"
import { RefObject, useEffect, useRef, useState } from "react"
import { Button, Spinner, Form, Row, Col } from "react-bootstrap"
import { DropletFill } from "react-bootstrap-icons"
import ReCAPTCHA from "react-google-recaptcha"

import PowWorker from "../../powWorker?worker"
import Config from "../../Config"
import {
  Challenge,
  ChallengeResponse,
  Network,
  StatusContext,
  VerifyResponse,
} from "../../lib/Types"

const { minTez, maxTez } = Config.application

export default function FaucetRequestButton({
  address,
  disabled,
  network,
  status,
}: {
  address: string
  disabled: boolean
  network: Network
  status: StatusContext
}) {
  const [amount, setAmount] = useState<number>(minTez)
  const [isLocalLoading, setLocalLoading] = useState<boolean>(false)
  const recaptchaRef: RefObject<ReCAPTCHA> = useRef(null)

  const startLoading = () => {
    status.setLoading(true)
    setLocalLoading(true)
    status.setStatus("")
    status.setStatusType("")
  }

  const stopLoadingSuccess = (message: string) => {
    status.setStatus(message)
    status.setStatusType("success")
    status.setLoading(false)
    setLocalLoading(false)
  }

  const stopLoadingError = (message: string) => {
    status.setStatus(message)
    status.setStatusType("danger")
    status.setLoading(false)
    setLocalLoading(false)
  }

  const updateAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (value >= minTez && value <= maxTez) {
      setAmount(value)
    }
  }

  // Ensure that `isLocalLoading` is false if user canceled pow worker.
  // `status.isLoading` will be false.
  useEffect(() => {
    !status.isLoading && setLocalLoading(false)
  }, [status.isLoading])

  const execCaptcha = async () => {
    const captchaToken: any = await recaptchaRef.current?.executeAsync()
    recaptchaRef.current?.reset()
    if (!captchaToken) {
      stopLoadingError("Captcha error, please try again in a few minutes.")
      return
    }
    return captchaToken
  }

  const solvePow = async (
    challenge: string,
    difficulty: number,
    challengeCounter: number
  ) => {
    status.setStatusType("info")
    status.setStatus(`Solving PoW challenge #${challengeCounter}...`)

    // There shouldn't be another worker running
    if (status.powWorker) status.powWorker.terminate()

    const powWorker = new PowWorker()
    status.setPowWorker(powWorker)
    powWorker.postMessage({ challenge, difficulty })

    const powSolution: { solution: string; nonce: number } = await new Promise(
      (resolve, reject) => {
        powWorker.addEventListener("message", ({ data }) =>
          data.message ? reject(data) : resolve(data)
        )
        powWorker.addEventListener("error", reject)
      }
    )

    powWorker.terminate()
    status.setPowWorker(null)
    return powSolution
  }

  const getTez = async () => {
    try {
      if (Config.application.disableChallenges) {
        startLoading()
        return verifySolution({ solution: "", nonce: 0 })
      }

      let { challenge, difficulty, challengeCounter } = await getChallenge()
      while (challenge && difficulty && challengeCounter) {
        const powSolution = await solvePow(
          challenge,
          difficulty,
          challengeCounter
        )
        const response = await verifySolution(powSolution)

        challenge = response.challenge
        difficulty = response.difficulty
        challengeCounter = response.challengeCounter
      }
    } catch (err: any) {
      stopLoadingError(err.message || "Error getting Tez")
    }
  }

  const getChallenge = async (): Promise<Partial<Challenge>> => {
    try {
      const captchaToken = await execCaptcha()

      startLoading()

      const input = {
        address,
        amount,
        captchaToken,
      }

      const { data }: { data: ChallengeResponse } = await axios.post(
        `${Config.application.backendUrl}/challenge`,
        input,
        { timeout: 5000 }
      )

      if (data.challenge && data.difficulty && data.challengeCounter) {
        return data
      } else {
        stopLoadingError(data?.message || "Error getting challenge")
      }
    } catch (err: any) {
      stopLoadingError(err?.response?.data.message || "Error getting challenge")
    }
    return {}
  }

  const verifySolution = async ({
    solution,
    nonce,
  }: {
    solution: string
    nonce: number
  }): Promise<Partial<Challenge>> => {
    const input = {
      address,
      amount,
      nonce,
      solution,
    }

    try {
      const { data }: { data: VerifyResponse } = await axios.post(
        `${Config.application.backendUrl}/verify`,
        input,
        { timeout: 5000 }
      )

      // If there is another challenge
      if (data.challenge && data.difficulty && data.challengeCounter) {
        return data
      } else if (data.txHash) {
        // All challenges were solved
        const viewerUrl = `${network.viewer}/${data.txHash}`
        stopLoadingSuccess(
          `Your ꜩ is on the way! <a target="_blank" href="${viewerUrl}" class="alert-link">Check it.</a>`
        )
      } else {
        stopLoadingError("Error verifying solution")
      }
    } catch (err: any) {
      stopLoadingError(
        err?.response?.data.message || "Error verifying solution"
      )
    }
    return {}
  }

  return (
    <>
      <ReCAPTCHA
        ref={recaptchaRef}
        size="invisible"
        badge="bottomleft"
        sitekey={Config.application.googleCaptchaSiteKey}
      />

      <Form.Group controlId="tezosRange" className="mt-5">
        <Row className="d-flex align-items-end">
          <Col md={8}>
            <Form.Label>Select Tez Amount</Form.Label>
            <Row>
              <Col xs="auto" className="pe-0">
                <Form.Label className="fw-bold">{minTez}</Form.Label>
              </Col>

              <Col>
                <Form.Range
                  min={minTez}
                  max={maxTez}
                  value={amount}
                  disabled={disabled}
                  onChange={updateAmount}
                />
              </Col>

              <Col xs="auto" className="ps-0">
                <Form.Label className="fw-bold">{maxTez}</Form.Label>
              </Col>
            </Row>
          </Col>

          <Col xs={6} md={4}>
            <Form.Control
              type="number"
              min={minTez}
              max={maxTez}
              value={amount}
              disabled={disabled}
              onChange={updateAmount}
            />
          </Col>

          <Col xs={6}>
            <Button variant="primary" disabled={disabled} onClick={getTez}>
              <DropletFill />
              &nbsp;
              {isLocalLoading ? `Requested ${amount} ꜩ` : `Request ${amount} ꜩ`}
              &nbsp;{" "}
              {isLocalLoading ? (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              ) : (
                ""
              )}
            </Button>
          </Col>
        </Row>
      </Form.Group>
    </>
  )
}
