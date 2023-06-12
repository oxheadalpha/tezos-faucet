import React, { RefObject, useState, useEffect } from "react"
import { Button, Spinner } from "react-bootstrap"
import { DropletFill } from "react-bootstrap-icons"
import ReCAPTCHA from "react-google-recaptcha"
import Config from "../../Config"
import { minifyTezosAddress } from "../../lib/Utils"
import axios from "axios"
import { BackendResponse, Network } from "../../lib/Types"

// import * as w from "../../../pyodide/subspace/output-vdf.wasm?init"
// console.log(w);

import createVdf from "@subspace/vdf"
import { log } from "console"
// import {_default as vdf} from "@subspace/vdf"

// import {default as vdf } from "@subspace/vdf"

// const vdf = require("../../../pyodide/subspace/src/vdf")
// import vdf from "../../../pyodide/subspace/src/vdf"
// @ts-ignoreXXX
// console.log(vdf())
// vdf().then((v) => {
// const c = v.generate(100000, "aa", 512)
//   console.log(c)
//   const s = Buffer.from(c).toString("hex")
//   console.log(s)
//   console.log(v.verify(100000, "aa", c, 512))
// })

// import * as vdf from "../../../pyodide/subspace/output-vdf.mjs"
// WebAssembly.instantiateStreaming(fetch("../../vdf.wasm")).then(x => x.instance)

function FaucetRequestButton({
  to,
  network,
  status,
  profile,
  amount,
}: {
  to: string
  network: Network
  status: any
  profile: string
  amount: number
}) {
  const [isLocalLoading, setLocalLoading] = useState<boolean>(false)

  const recaptchaRef: RefObject<ReCAPTCHA> = React.createRef()

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

  const txBody: any = {
    address: to,
    // captchaToken: captchaToken,
    profile: profile,
  }

  const send = async () => {
    startLoading()

    try {
      const captchaToken: any = await recaptchaRef.current?.executeAsync()

      if (!captchaToken) {
        stopLoadingError("Captcha error, please try again in a few time.")
        return
      }

      console.log(txBody)
      txBody.captchaToken = captchaToken

      axios
        .post(`${Config.application.backendUrl}/send`, txBody)
        .then((response) => {
          if (response.status === 200) {
            console.log(response)
            console.log(response.data)
            const responseData: BackendResponse = response.data
            const viewerUrl = `${network.viewer}/${responseData.txHash}`
            stopLoadingSuccess(
              `Your ꜩ is on the way! <a target="_blank" href="${viewerUrl}" class="alert-link">Check it.</a>`
            )
          } else {
            stopLoadingError(`Backend error`)
          }
        })
        .catch((error) => {
          if (
            error.response &&
            (error.response.status === 500 || error.response.status === 400)
          ) {
            console.log(error?.response?.data)
            const responseData: BackendResponse = error.response.data
            stopLoadingError(`${responseData?.message}`)
          } else {
            console.log(error)
            stopLoadingError(`Backend error`)
          }
        })
    } catch (err) {
      console.log(err)
      stopLoadingError("Forbidden")
    }
  }

  const getChallenge = async () => {
    startLoading()
    const vdf = await createVdf()

    try {
      const response = await axios.post(
        `${Config.application.backendUrl}/send`,
        txBody
      )

      if (response.status === 200) {
        const responseData: any = response.data
        const { challenge, iterations, size }: any = responseData.vdfChallenge

        const solution = vdf.generate(iterations, challenge, size, false)
        console.log({ challenge, size, iterations })
        // console.log({ solution, challenge, size, iterations })

        // Send the solution to the backend
        return verifySolution(challenge, iterations, size, solution)
      } else {
        stopLoadingError(`Backend error`)
      }
    } catch (err) {
      console.log(err)
      stopLoadingError("Forbidden")
    }
  }

  const verifySolution = async (
    challenge: Uint8Array,
    iterations: number,
    size: number,
    solution: Uint8Array
  ) => {
    // Assuming uint8Array is your Uint8Array
    // let encoder = new TextEncoder()
    // let uint8ArrayBase64String = btoa(String.fromCharCode.apply(null, solution))
    const decoder = new TextDecoder("utf8")
    // @ts-ignore
    const b64encoded = btoa(String.fromCharCode.apply(null, solution))
    const verifyBody: any = {
      address: to,
      // captchaToken: captchaToken,
      profile: profile,
      challenge: challenge,
      // iterations: 100,
      iterations: iterations,
      // size: size,
      size: 512,
      // solution: solution,
      solution: b64encoded,
    }
    console.log( Buffer.from(b64encoded, "base64").toString("hex"));

    return axios
      .post(`${Config.application.backendUrl}/verify`, verifyBody)
      .then((response) => {
        if (response.status === 200) {
          const responseData: BackendResponse = response.data
          const viewerUrl = `${network.viewer}/${responseData.txHash}`
          stopLoadingSuccess(
            `Your ꜩ is on the way! <a target="_blank" href="${viewerUrl}" class="alert-link">Check it.</a>`
          )
        } else {
          stopLoadingError(`Backend error`)
        }
      })
      .catch((error) => {
        if (
          error.response &&
          (error.response.status === 500 || error.response.status === 400)
        ) {
          const responseData: BackendResponse = error.response.data
          stopLoadingError(`${responseData?.message}`)
        } else {
          console.log(error)
          stopLoadingError(`Backend error`)
        }
      })
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
        disabled={status.isLoading || !to}
        onClick={getChallenge}
        // onClick={send}
      >
        <DropletFill />
        &nbsp;
        {isLocalLoading
          ? `Sending ${amount} ꜩ to ${minifyTezosAddress(to)}`
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

export default FaucetRequestButton
