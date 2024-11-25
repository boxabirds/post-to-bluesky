import type { PlasmoMessaging } from "@plasmohq/messaging"
import { BskyAgent } from "@atproto/api"
import { STORAGE_KEYS } from "~types"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { text } = req.body

  try {
    // Get session from storage
    const storage = await chrome.storage.local.get([STORAGE_KEYS.BSKY_CLIENT_SESSION])
    const session = storage[STORAGE_KEYS.BSKY_CLIENT_SESSION]

    if (!session) {
      throw new Error("Not logged in")
    }

    const agent = new BskyAgent({ service: "https://bsky.social" })
    await agent.resumeSession(session)

    await agent.post({
      text,
      createdAt: new Date().toISOString()
    })

    res.send({ success: true })
  } catch (error: any) {
    res.send({
      error: {
        message: error?.message || "Failed to post"
      }
    })
  }
}

export default handler
