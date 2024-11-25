import type { PlasmoMessaging } from "@plasmohq/messaging"
import { BskyAgent } from "@atproto/api"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { identifier, password, authFactorToken } = req.body

  try {
    const agent = new BskyAgent({ service: "https://bsky.social" })
    const response = await agent.login({
      identifier,
      password,
      ...(authFactorToken && { authFactorToken }),
    })

    res.send({
      session: response.data,
    })
  } catch (error: any) {
    // Extract the error message from the error object
    const errorMessage = error?.message || error?.error?.message || "Unknown error occurred"
    res.send({
      error: {
        message: errorMessage
      }
    })
  }
}

export default handler
