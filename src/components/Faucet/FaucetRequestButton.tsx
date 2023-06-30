import axios from "axios"
import React, { RefObject, useEffect, useRef, useState } from "react"
import { Button, Spinner } from "react-bootstrap"
import { DropletFill } from "react-bootstrap-icons"
import ReCAPTCHA from "react-google-recaptcha"

import Config from "../../Config"
import {
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

  const solvePow = async (challenge: string, difficulty: number) => {
    status.setStatusType("info")
    status.setStatus("Solving PoW challenge...")

    // There shouldn't be another worker running
    if (status.powWorker) status.powWorker.terminate()
    const powWorker = new Worker("powWorker.js")
    status.setPowWorker(powWorker)

    powWorker.postMessage({ challenge, difficulty })
    const powSolution = await new Promise((resolve, reject) => {
      powWorker.addEventListener("message", (event) => resolve(event.data))
      powWorker.addEventListener("error", () => {
        reject("Worker has been terminated")
        console.log("DSFSDFSDF")
      })
    })

    powWorker.onerror = (event) => {
      console.log("ON ERROR", event)
    }

    powWorker.terminate()
    status.setPowWorker(null)
    console.log({ powSolution })
    return powSolution
  }

  const getTez = async () => {
    try {
      let { challenge, difficulty } = await getChallenge()
      while (challenge && difficulty) {
        console.log({ challenge, difficulty })
        const powSolution: any = await solvePow(challenge, difficulty)
        const response = await verifySolution({ challenge, ...powSolution })
        console.log({ response })

        challenge = response.challenge
        difficulty = response.difficulty
      }
    } catch (err) {
      console.log(err)
      stopLoadingError("Error getting Tez")
    }
  }

  const getChallenge = async (): Promise<{
    challenge?: string
    difficulty?: number
  }> => {
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
        input
      )

      if (data.challenge && data.difficulty) {
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
    nonce,
    solution,
  }: {
    nonce: number
    solution: string
  }): Promise<{ challenge?: string; difficulty?: number }> => {
    const captchaToken = await execCaptcha()
    const input = {
      address,
      captchaToken,
      profile,
      nonce,
      solution,
    }

    try {
      const { data }: { data: VerifyResponse } = await axios.post(
        `${Config.application.backendUrl}/verify`,
        input
      )

      // If there is another challenge
      if (data.challenge && data.difficulty) {
        return data
      } else if (data.txHash) {
        // All challenges were solved
        const viewerUrl = `${network.viewer}/${data.txHash}`
        stopLoadingSuccess(
          `Your ꜩ is on the way! <a target="_blank" href="${viewerUrl}" class="alert-link">Check it.</a>`
        )
      } else {
        stopLoadingError(data?.message || "Error verifying solution")
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
