import axios from "axios"
import { RefObject, useEffect, useRef, useState } from "react"
import { Button, Spinner, Form, Row, Col } from "react-bootstrap"
import { DropletFill } from "react-bootstrap-icons"
import ReCAPTCHA from "react-google-recaptcha"

import PowWorker from "../../powWorker?worker&inline"
import Config from "../../Config"
import { autoSelectInputText } from "../../lib/Utils"
import {
  Challenge,
  ChallengeResponse,
  Network,
  StatusContext,
  VerifyResponse,
} from "../../lib/Types"

const { minTez, maxTez } = Config.application
// Compute the step for the Tezos amount range slider.
const tezRangeStep = (() => {
  const magnitude = Math.floor(Math.log10(maxTez))

  // When maxTez is greater than 1
  if (maxTez > 1) {
    return Math.max(0.5, Math.pow(10, magnitude - 2))
  }

  // When maxTez is less than or equal to 1 and minTez is fractional
  const minMagnitude = Math.abs(Math.floor(Math.log10(minTez)))
  return Math.max(0.001, 1 / Math.pow(10, minMagnitude))
})()

const formatAmount = (amount: number) =>
  amount.toLocaleString(undefined, {
    maximumFractionDigits: 5,
  })

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
  const formattedAmount = formatAmount(amount)

  const [isLocalLoading, setLocalLoading] = useState<boolean>(false)
  const recaptchaRef: RefObject<ReCAPTCHA> = useRef(null)

  // Ensure that `isLocalLoading` is false if user canceled pow worker.
  // `status.isLoading` will be false.
  useEffect(() => {
    !status.isLoading && setLocalLoading(false)
  }, [status.isLoading])

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

  const validateChallenge = (data: Partial<Challenge>): data is Challenge =>
    !!(
      data.challenge &&
      data.difficulty &&
      data.challengeCounter &&
      data.challengesNeeded
    )

  const getProgress = (challengeCounter: number, challengesNeeded: number) =>
    String(
      Math.min(99, Math.floor((challengeCounter / challengesNeeded) * 100))
    )

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
    { challenge, difficulty, challengeCounter, challengesNeeded }: Challenge,
    powWorker: Worker
  ) => {
    status.setStatusType("solving")
    status.setStatus(getProgress(challengeCounter - 1, challengesNeeded))

    const powSolution: Promise<{ solution: string; nonce: number }> =
      new Promise((resolve, reject) => {
        powWorker.onerror = (e) => reject(e)
        powWorker.onmessage = ({ data }) =>
          data.message ? reject(data) : resolve(data)
      })

    powWorker.postMessage({ challenge, difficulty })

    await powSolution

    status.setStatus(getProgress(challengeCounter, challengesNeeded))

    return powSolution
  }

  const getTez = async () => {
    try {
      if (Config.application.disableChallenges) {
        startLoading()
        return verifySolution({ solution: "", nonce: 0 })
      }

      let challengeRes = await getChallenge()

      const powWorker = new PowWorker()
      status.setPowWorker(powWorker)

      try {
        while (validateChallenge(challengeRes)) {
          const powSolution = await solvePow(challengeRes, powWorker)

          const newChallengeRes = await verifySolution(powSolution)
          challengeRes = newChallengeRes
        }
      } finally {
        powWorker.terminate()
        status.setPowWorker(null)
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

      if (validateChallenge(data)) {
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
      if (validateChallenge(data)) {
        return data
      } else if (data.txHash) {
        // All challenges were solved

        // Let the progress bar briefly show 100% before it goes away
        await new Promise((res) => setTimeout(res, 800))

        const viewerUrl = `${network.viewer}/${data.txHash}`

        stopLoadingSuccess(
          `Your ꜩ is on the way! <a target="_blank" href="${viewerUrl}" class="alert-link">Check it.</a>`
        )
      } else {
        stopLoadingError("Error verifying solution")
      }
    } catch (err: any) {
      stopLoadingError(err?.response?.data.message || err.message)
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

      <Form.Group controlId="tezosRange" className="mt-4">
        <Form.Label>Select Tez Amount</Form.Label>
        <Row className="mb-2">
          <Col xs="auto" className="pe-0">
            <Form.Label className="fw-bold">{formatAmount(minTez)}</Form.Label>
          </Col>

          <Col>
            <Form.Range
              min={tezRangeStep}
              max={maxTez}
              step={tezRangeStep}
              value={amount}
              disabled={disabled}
              onChange={updateAmount}
            />
          </Col>

          <Col xs="auto" className="ps-0">
            <Form.Label className="fw-bold">{formatAmount(maxTez)}</Form.Label>
          </Col>
        </Row>

        <Row className="d-flex align-items-end gy-3">
          <Col xs={12} sm={6}>
            <Form.Control
              type="number"
              min={minTez}
              max={maxTez}
              value={amount}
              disabled={disabled}
              onChange={updateAmount}
              onClick={autoSelectInputText}
            />
          </Col>

          <Col xs={12} sm={6} className="d-flex justify-content-sm-end">
            <Button variant="primary" disabled={disabled} onClick={getTez}>
              <DropletFill />
              &nbsp;
              {isLocalLoading
                ? `Requested ${formattedAmount} ꜩ`
                : `Request ${formattedAmount} ꜩ`}
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
