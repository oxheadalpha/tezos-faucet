import React, { RefObject, useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap"
import { DropletFill } from "react-bootstrap-icons";
import ReCAPTCHA from "react-google-recaptcha";
import Config from "../../Config";
import { minifyTezosAddress } from "../../lib/Utils";
import axios from "axios";
import { BackendResponse, Network } from "../../lib/Types";
import * as pyodide from "pyodide"

console.log(pyodide);

function FaucetRequestButton({ to, network, status, profile, amount }: { to: string, network: Network, status: any, profile: string, amount: number }) {

    const [isLocalLoading, setLocalLoading] = useState<boolean>(false)

    const recaptchaRef: RefObject<ReCAPTCHA> = React.createRef();

    const startLoading = () => {
        status.setLoading(true);
        setLocalLoading(true);
        status.setStatus(null);
        status.setStatusType(null);
    }

    const stopLoadingSuccess = (message: string) => {
        status.setStatus(message);
        status.setStatusType("success");
        status.setLoading(false);
        setLocalLoading(false);
    }

    const stopLoadingError = (message: string) => {
        status.setStatus(message);
        status.setStatusType("danger");
        status.setLoading(false);
        setLocalLoading(false);
    }

    const send = async () => {

        startLoading();

        try {

            const captchaToken: any = await recaptchaRef.current?.executeAsync();

            if (!captchaToken) {
                stopLoadingError("Captcha error, please try again in a few time.");
                return;
            }

            const txBody: any = {
                address: to,
                captchaToken: captchaToken,
                profile: profile
            }

            console.log(txBody);

            axios.post(`${Config.application.backendUrl}/send`, txBody)
                .then((response) => {
                    if(response.status === 200) {
                        console.log(response.data);
                        const responseData: BackendResponse = response.data;
                        const viewerUrl = `${network.viewer}/${responseData.txHash}`;
                        stopLoadingSuccess(`Your ꜩ is on the way! <a target="_blank" href="${viewerUrl}" class="alert-link">Check it.</a>`)
                    }
                    else {
                        stopLoadingError(`Backend error`);
                    }

                })
                .catch((error) => {
                    if(error.response && (error.response.status === 500 || error.response.status === 400)) {
                        console.log(error?.response?.data);
                        const responseData: BackendResponse = error.response.data;
                        stopLoadingError(`${responseData?.message}`);
                    }
                    else {
                        console.log(error);
                        stopLoadingError(`Backend error`);
                    }
                });
        }
        catch (err) {
            console.log(err);
            stopLoadingError("Forbidden");
        }
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
                onClick={send}
            >
                <DropletFill />&nbsp;
                {isLocalLoading ? `Sending ${amount} ꜩ to ${minifyTezosAddress(to)}` : `Request ${amount} ꜩ`}

                &nbsp; {isLocalLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : ""}
            </Button>

        </>
    )
}

export default FaucetRequestButton;
