const sha256 = async (input: string) => {
  const textAsBuffer = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest("SHA-256", textAsBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("")
  return hash
}

self.addEventListener("message", async ({ data }) => {
  try {
    const { challenge, difficulty } = data
    let nonce = 0
    let solution = ""

    import.meta.env.DEV && console.time("POW")
    while (true) {
      const input = `${challenge}:${nonce}`
      const hash = await sha256(input)
      if (hash.startsWith("0".repeat(difficulty))) {
        solution = hash
        self.postMessage({ solution: hash, nonce })
        break
      }
      nonce++
    }
    import.meta.env.DEV &&
      (console.timeEnd("POW"), console.log({ solution, nonce }))
  } catch (err: any) {
    console.error(err)
    self.postMessage({ message: "Error solving PoW challenge" })
    self.close()
  }
})

// TS1208: Make file a module
export {}
