import React, { useRef, RefObject, useState, useEffect } from "react"
import { Button, Spinner } from "react-bootstrap"
import { DropletFill } from "react-bootstrap-icons"
import ReCAPTCHA from "react-google-recaptcha"
import Config from "../../Config"
import { minifyTezosAddress } from "../../lib/Utils"
import axios from "axios"
import { BackendResponse, Network } from "../../lib/Types"

export default function FaucetRequestButton({
  address,
  network,
  status,
  profile,
  amount,
}: {
  address: string
  network: Network
  status: any
  profile: string
  amount: number
}) {
  const [isLocalLoading, setLocalLoading] = useState<boolean>(false)
  const recaptchaRef: RefObject<ReCAPTCHA> = useRef(null)

  const startLoading = () => {
    status.setLoading(true)
    setLocalLoading(true)
    status.setStatus(null)
    status.setStatusType(null)
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

  // Ensure that isLocalLoading is false if worker was terminated
  useEffect(() => {
    !status.powWorker && setLocalLoading(false)
  }, [status.powWorker])

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

  const getChallenge = async () => {
    const captchaToken: any = await recaptchaRef.current?.executeAsync()

    recaptchaRef.current?.reset()
    if (!captchaToken) {
      stopLoadingError("Captcha error, please try again in a few minutes.")
      return
    }

    startLoading()

    try {
      const data: any = {
        address,
        captchaToken,
        profile,
      }
      const response = await axios.post(
        `${Config.application.backendUrl}/challenge`,
        data
      )

      if (response.status === 200) {
        const { challenge, difficulty }: any = response.data
        console.log({ challenge, difficulty })
        const powSolution = await solvePow(challenge, difficulty)
        return verifySolution(powSolution)
      } else {
        stopLoadingError("Backend error")
      }
    } catch (err) {
      console.log(err)
      stopLoadingError("Forbidden")
    }
  }

  const verifySolution = async ({ nonce, solution }: any) => {
    const captchaToken = await recaptchaRef.current?.executeAsync()
    recaptchaRef.current?.reset()
    if (!captchaToken) {
      stopLoadingError("Captcha error, please try again in a few minutes.")
      // closeModal()
      return
    }

    const data: any = {
      address,
      captchaToken,
      profile,
      nonce,
      solution,
    }

    try {
      const response = await axios.post(
        `${Config.application.backendUrl}/verify`,
        data
      )

      if (response.status === 200) {
        const responseData: BackendResponse = response.data
        const viewerUrl = `${network.viewer}/${responseData.txHash}`
        stopLoadingSuccess(
          `Your ꜩ is on the way! <a target="_blank" href="${viewerUrl}" class="alert-link">Check it.</a>`
        )
      } else {
        stopLoadingError("Backend error")
      }
    } catch (error: any) {
      if (
        error.response &&
        (error.response.status === 500 || error.response.status === 400)
      ) {
        const responseData: BackendResponse = error.response.data
        stopLoadingError(responseData?.message || "")
      } else {
        console.log(error)
        stopLoadingError("Backend error")
      }
    }
  }

  return (
    <>
      <ReCAPTCHA
        ref={recaptchaRef}
        size="invisible"
        sitekey={Config.application.googleCaptchaSiteKey}
        // onExpired={() => console.log("DFDSFDSFS")}
      />

      <Button
        variant="primary"
        disabled={status.isLoading || !address}
        onClick={getChallenge}
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
