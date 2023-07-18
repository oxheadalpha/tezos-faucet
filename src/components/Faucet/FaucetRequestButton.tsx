import axios from "axios"
import React, { RefObject, useEffect, useRef, useState } from "react"
import { Button, Spinner } from "react-bootstrap"
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
import { minifyTezosAddress } from "../../lib/Utils"

export default function FaucetRequestButton({
  address,
  network,
  status,
  profile,
  amount,
}: {
  address: string
  network: Network
  status: StatusContext
  profile: string
  amount: number
}) {
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
      (resolve, reject) =>
        powWorker.addEventListener("message", ({ data }) =>
          data.message ? reject(data) : resolve(data)
        )
    )

    powWorker.terminate()
    status.setPowWorker(null)
    console.log({ powSolution })
    return powSolution
  }

  const getTez = async () => {
    try {
      let { challenge, difficulty, challengeCounter } = await getChallenge()
      while (challenge && difficulty && challengeCounter) {
        console.log({ challenge, difficulty, challengeCounter })
        const powSolution = await solvePow(
          challenge,
          difficulty,
          challengeCounter
        )
        const response = await verifySolution(powSolution)
        console.log({ response })

        challenge = response.challenge
        difficulty = response.difficulty
        challengeCounter = response.challengeCounter
      }
    } catch (err: any) {
      stopLoadingError(err.message || "Error getting Tez")
    }
  }

  const getChallenge = async (): Promise<Partial<Challenge>> => {
    const captchaToken = await execCaptcha()

    startLoading()

    try {
      const input = {
        address,
        captchaToken,
        profile,
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
      profile,
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
        sitekey={Config.application.googleCaptchaSiteKey}
      />

      <Button
        variant="primary"
        disabled={status.isLoading || !address}
        onClick={getTez}
      >
        <DropletFill />
        &nbsp;
        {isLocalLoading
          ? `Sending ${amount} ꜩ to ${minifyTezosAddress(address)}`
          : `Request ${amount} ꜩ`}
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
    </>
  )
}
