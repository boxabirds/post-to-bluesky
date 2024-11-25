import { BskyAgent } from "@atproto/api";
import type { PlasmoMessaging, sendToContentScript } from "@plasmohq/messaging";

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "post-to-bluesky",
    title: "Post to Bluesky",
    contexts: ["selection"]
  })
})

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "post-to-bluesky" && info.selectionText && tab?.title) {
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
        text: info.selectionText,
        title: tab.title,
        url: tab.url,
        timestamp: Date.now()
      }
    })
  }
})

// Handle login request from popup
export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { identifier, password, authFactorToken } = req.body;

  try {
    const agent = new BskyAgent({ service: "https://bsky.social" });
    const response = await agent.login({
      identifier,
      password,
      ...(authFactorToken && { authFactorToken }),
    });

    res.send({
      session: response.data,
    });
  } catch (e) {
    res.send({
      error: e,
    });
  }
};
