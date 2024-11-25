import type { PlasmoCSConfig } from "plasmo"
import { useMessage } from "@plasmohq/messaging/hook"

export const config: PlasmoCSConfig = {
  all_frames: true,
  matches: ["<all_urls>"]
}

const GetPageData = () => {
  const { data } = useMessage<{ text: string, title: string, url: string }, string>(async (req, res) => {
    if (req.name !== "get-page-data") {
      return
    }
    const selectedText = window.getSelection()?.toString() || "No text selected"
    const pageTitle = document.title
    const pageUrl = window.location.href

    res.send(JSON.stringify({ text: selectedText, title: pageTitle, url: pageUrl }))
  })

  // return nothing as we don't use this  
  return (<></>)
}

export default GetPageData
