import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { text, title, url } = req.body

  // Open popup with the selected text
  chrome.windows.create({
    url: chrome.runtime.getURL("tabs/post.html"),
    type: "popup",
    width: 450,
    height: 600
  })

  // Store the post data temporarily
  await chrome.storage.local.set({
    draft_post: {
      text,
      title,
      url,
      timestamp: Date.now()
    }
  })

  res.send({
    success: true
  })
}

export default handler
