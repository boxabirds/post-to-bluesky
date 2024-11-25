// components/Post.tsx
import { type FormEvent, useState, useCallback, useRef, useEffect } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { PostState, type DraftPost } from "~types";
import { sendToContentScript, sendToBackground } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";
import { STORAGE_KEYS, MESSAGE_NAMES } from "~types";

 

export function Post() {
  const [postState, setPostState] = useState<PostState>(PostState.DRAFT_INPUT);
  const [draftPost, setDraftPost] = useState<DraftPost>({
    title: "",
    quote: "",
    url: "",
    comments: "",
  });
  
  const storage = useRef<Storage>(new Storage());
  const isLoading = PostState.POST_SUBMITTED === postState;

  const loadDraftPost = useCallback(async () => {
    const storedDraft:DraftPost = await storage.current.get(STORAGE_KEYS.DRAFT_POST);
    if (storedDraft) {
      setDraftPost(storedDraft);

    // make draft post from the current page
    } else  {
      console.log("Popup: Sending get-page-text message to content script");
      const response = await sendToContentScript({
        name: "get-page-data",
      });

      // TODO is there no way to do this in a structured, typed way? 
      const { text: selectedText, title: pageTitle, url: pageUrl } = JSON.parse(response);
      setDraftPost((prev) => ({
        ...prev,
        quote: selectedText || "",
        title: pageTitle || prev.title,
        url: pageUrl || prev.url
      }));
    }
  }, []);

  useEffect(() => {
    loadDraftPost();
  }, [loadDraftPost]);


  const handlePost = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    try {
        setPostState(PostState.POST_SUBMITTED);
       // Format the post text
       const parts = [];
       if (draftPost.title) parts.push(`"${draftPost.title}"`);
       if (draftPost.quote) parts.push(`"${draftPost.quote}"`);
       if (draftPost.comments) parts.push(draftPost.comments);
       if (draftPost.url) parts.push(draftPost.url);
 
       const text = parts.join("\n\n");
 
       const response = await sendToBackground({
         name: MESSAGE_NAMES.POST,
         body: { text },
       });
 
       if (response.error) {
         throw new Error(response.error.message);
       }
 
       // Clear draft and close popup
       await storage.current.remove(STORAGE_KEYS.DRAFT_POST);
       window.close();   
    } catch (error) {
      setPostState(PostState.DRAFT_INPUT);
    }
  }, [draftPost, sendToBackground, storage, setPostState]);

  return (
    <form onSubmit={handlePost} className="mt-4">
    <div className="mb-4">
      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        Title
      </label>
      <input
        type="text"
        id="title"
        value={draftPost.title}
        onChange={(e) => setDraftPost((prev) => ({ ...prev, title: e.target.value }))}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="quote" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        Quote
      </label>
      <textarea
        id="quote"
        value={draftPost.quote}
        onChange={(e) => setDraftPost((prev) => ({ ...prev, quote: e.target.value }))}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        rows={3}
      />
    </div>

    <div className="mb-4">
      <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        URL
      </label>
      <input
        type="url"
        id="url"
        value={draftPost.url}
        onChange={(e) => setDraftPost((prev) => ({ ...prev, url: e.target.value }))}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        Other comments
      </label>
      <textarea
        id="comments"
        value={draftPost.comments}
        autoFocus
        onChange={(e) => setDraftPost((prev) => ({ ...prev, comments: e.target.value }))}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        rows={2}
      />
    </div>
        <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >

            {isLoading ? (
            <LoadingSpinner />
            ) : (   
            "Skeet"
            )}
        </button>
    </form>
);
}
