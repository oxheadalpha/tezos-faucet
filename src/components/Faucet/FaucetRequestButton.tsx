import React, { useRef, RefObject, useState, useEffect } from "react"
import { Button, Spinner, Modal, Popover } from "react-bootstrap"
import { DropletFill } from "react-bootstrap-icons"
import ReCAPTCHA from "react-google-recaptcha"
import Config from "../../Config"
import { minifyTezosAddress } from "../../lib/Utils"
import axios from "axios"
import { BackendResponse, Network } from "../../lib/Types"

// import crypto from "crypto"
// const crypto = window.crypto

// import * as w from "../../../pyodide/subspace/output-vdf.wasm?init"
// console.log(w);

import createVdf from "@subspace/vdf"
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
  const [worker, setWorker] = useState<Worker | null>(null)
  const [showModal, setShowModal] = useState(false)
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

  const solvePow = async (challenge: string, difficulty: number) => {
    const powWorker = new Worker("powWorker.js")
    setWorker(powWorker)
    powWorker.postMessage({ challenge, difficulty })
    const powSolution = await new Promise((resolve) =>
      powWorker.addEventListener("message", (event) => resolve(event.data))
    )
    // powWorker.onerror = (event) => {
    //   console.log(event)
    // }
    powWorker.terminate()
    setWorker(null)
    console.log({ powSolution })
    return powSolution
  }

  const closeModal = () => {
    if (worker) {
      worker.terminate()
      setWorker(null)
    }
    setShowModal(false)
    status.setLoading(false)
    setLocalLoading(false)
  }

  const getChallenge = async () => {
    startLoading()

    const captchaToken: any = await recaptchaRef.current?.executeAsync()
    recaptchaRef.current?.reset()
    if (!captchaToken) {
      stopLoadingError("Captcha error, please try again in a few minutes.")
      return
    }


    const data: any = {
      address,
      captchaToken,
      profile,
    }

    try {
      const response = await axios.post(
        `${Config.application.backendUrl}/challenge`,
        data
      )

      if (response.status === 200) {
        const { challenge, difficulty }: any = response.data
        console.log({ challenge, difficulty })
        setShowModal(true)
        const powSolution = await solvePow(challenge, difficulty)
        return verifySolution(powSolution)
      } else {
        stopLoadingError("Backend error")
      }
    } catch (err) {
      console.log(err)
      stopLoadingError("Forbidden")
    }
    closeModal()
  }

  const verifySolution = async ({ nonce, solution }: any) => {
    const captchaToken = await recaptchaRef.current?.executeAsync()
    recaptchaRef.current?.reset()
    if (!captchaToken) {
      stopLoadingError("Captcha error, please try again in a few minutes.")
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
    closeModal()
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

      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Proof of Work Challenge</Modal.Title>
        </Modal.Header>
        <Modal.Body>Solving the PoW challenge...</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
