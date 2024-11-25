import { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"
import { BskyAgent } from "@atproto/api"

import "../style.css"

const storage = new Storage()

export default function PostDialog() {
  const [text, setText] = useState("")
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState("")
  const [agent, setAgent] = useState<BskyAgent | null>(null)

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await storage.get("draft_post")
      if (draft) {
        setText(draft.text)
        setTitle(draft.title)
        setUrl(draft.url)
      }
    }

    const loadSession = async () => {
      const session = await storage.get("session")
      if (session) {
        const agent = new BskyAgent({ service: "https://bsky.social" })
        await agent.resumeSession(session)
        setAgent(agent)
      } else {
        setError("Please log in first")
      }
    }

    loadDraft()
    loadSession()
  }, [])

  const handlePost = async () => {
    if (!agent) {
      setError("Not logged in")
      return
    }

    try {
      setIsPosting(true)
      setError("")

      let postText = text
      if (title && url) {
        postText += `\n\nvia ${title}\n${url}`
      }

      await agent.post({
        text: postText
      })

      await storage.remove("draft_post")
      window.close()
    } catch (e) {
      setError(e.message || "Failed to post")
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div style={{ width: "300px" }} className="p-4">
      <h1 className="text-2xl font-bold mb-4">Post to Bluesky</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Your Post
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            rows={5}
            className="mt-1 block w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          onClick={handlePost}
          disabled={!text || isPosting}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPosting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  )
}
