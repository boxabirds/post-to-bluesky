import { type FormEvent, useCallback, useEffect, useState } from "react";
import "./style.css";
import { sendToContentScript, sendToBackground } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";
import icon from "data-base64:~assets/icon.png"

import {
  AUTH_FACTOR_TOKEN_REQUIRED_ERROR_MESSAGE,
  BSKY_DOMAIN,
  MESSAGE_TYPE,
  RATE_LIMIT_ERROR_MESSAGE,
  MESSAGE_NAMES,
  STORAGE_KEYS,
  type DraftPost,
} from "~lib/constants";

function IndexPopup() {
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [authFactorToken, setAuthFactorToken] = useState("");
  const [showAuthFactorTokenInput, setShowAuthFactorTokenInput] = useState(false);
  const [draftPost, setDraftPost] = useState<DraftPost>({
    title: "",
    quote: "",
    url: "",
    comments: "",
  });
  const [message, setMessage] = useState<null | {
    type: (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];
    message: string;
  }>(null);
  const showErrorMessage = message?.type === MESSAGE_TYPE.ERROR;
  const showSuccessMessage = message?.type === MESSAGE_TYPE.SUCCESS;
  const setErrorMessage = (message: string) => {
    setMessage({ type: MESSAGE_TYPE.ERROR, message });
  };

  const storage = new Storage();

  const saveShowAuthFactorTokenInputToStorage = async (value: boolean) => {
    await storage.set(STORAGE_KEYS.BSKY_SHOW_AUTH_FACTOR_TOKEN_INPUT, value);
  };

  const loadShowAuthFactorTokenFromStorage = useCallback(async () => {
    setShowAuthFactorTokenInput(
      await storage.get(STORAGE_KEYS.BSKY_SHOW_AUTH_FACTOR_TOKEN_INPUT) || false,
    );
  }, []);

  const loadDraftPost = useCallback(async () => {
    const storedDraft:DraftPost = await storage.get(STORAGE_KEYS.DRAFT_POST);
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

  const validateForm = async () => {
    if (!password && !identifier) {
      setErrorMessage("Please enter your password and identifier.");
      return false;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return false;
    }
    if (!identifier) {
      setErrorMessage("Please enter your identifier.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e?: FormEvent) => {
    const existingToken = await storage.get(STORAGE_KEYS.BSKY_CLIENT_SESSION);
    if (existingToken) {
      setMessage(null);
      setIsAuthenticated(true);
      return;
    }

    if (e) {
      e.preventDefault();
    }
    if (!validateForm()) {
      return;
    }

    setMessage(null);
    setIsLoading(true);

    const formattedIdentifier = (
      identifier.includes(".") ? identifier : `${identifier}.${BSKY_DOMAIN}`
    ).replace(/^@/, "");
    try {
      // only sign in if we don't have a valid toke   
      // we don't have a valid token, so we need to sign in
      const { session, error } = await sendToBackground({
        name: "login",
        body: {
          identifier: formattedIdentifier,
          password,
          ...(authFactorToken && { authFactorToken: authFactorToken }),
        },
      });
      if (error) {
        if (error.message.includes(AUTH_FACTOR_TOKEN_REQUIRED_ERROR_MESSAGE)) {
          setShowAuthFactorTokenInput(true);
          await saveShowAuthFactorTokenInputToStorage(true);
        } else if (error.message.includes(RATE_LIMIT_ERROR_MESSAGE)) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(error.message);
        }
      } else {
        await storage.set(
          STORAGE_KEYS.BSKY_CLIENT_SESSION,
          session
        );
        await saveShowAuthFactorTokenInputToStorage(false);
        setMessage({ type: MESSAGE_TYPE.SUCCESS, message: "Login successful!" });
        setIsAuthenticated(true);

        // Load draft post data after successful login
        const result = await storage.getMany([STORAGE_KEYS.DRAFT_POST]);
        const draftData = result[STORAGE_KEYS.DRAFT_POST] as DraftPost;
        setDraftPost(draftData);
      }
    } catch (e) {
        setErrorMessage("Error: Something went wrong. Please reload the web page and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePost = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setIsPosting(true);

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
      await storage.remove(STORAGE_KEYS.DRAFT_POST);
      window.close();
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to post");
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadShowAuthFactorTokenFromStorage();
      if (await storage.get(STORAGE_KEYS.BSKY_CLIENT_SESSION)) {
        setIsAuthenticated(true);
      }
    };
    init();
  }, [loadShowAuthFactorTokenFromStorage]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDraftPost();
    }
  }, [isAuthenticated, loadDraftPost]);

  if (isAuthenticated) {
    return (
      <div className="px-5 pt-3 pb-4 w-[380px]">
        <h1 className="text-primary dark:text-white text-2xl font-thin flex gap-2 items-center">
            <img src={icon} alt="Bluesky icon" className="h-[1em]" />
          Post to Bluesky
        </h1>
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
              onChange={(e) => setDraftPost((prev) => ({ ...prev, comments: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={2}
            />
          </div>

          {showErrorMessage && (
            <div className="text-red-600 dark:text-red-400 text-sm mb-4">
              {message.message}
              )}
            </div>
          )}

          {showSuccessMessage && (
            <div className="text-green-600 dark:text-green-400 text-sm mb-4">
              {message.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isPosting}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isPosting ? "Posting..." : "Post"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="px-5 pt-3 pb-4 w-[380px]">
      <h1 className="text-primary dark:text-white text-2xl font-thin flex gap-2 items-center">
        Post to Bluesky
      </h1>
      <form onSubmit={handleLogin} className="mt-4">
        {!showAuthFactorTokenInput ? (
          <>
            <div className="mb-4">
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Handle or Email
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="your-username.bsky.social"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={isLoading}
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={isLoading}
              />
            </div>
          </>
        ) : (
          <div className="mb-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Code sent to {identifier}
            </div>
            <label
              htmlFor="authFactorToken"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Email Code
            </label>
            <input
              type="text"
              id="authFactorToken"
              value={authFactorToken}
              onChange={(e) => setAuthFactorToken(e.target.value)}
              placeholder="Enter code from email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              autoFocus
            />
          </div>
        )}

        {showErrorMessage && (
          <div className="text-red-600 dark:text-red-400 text-sm mb-4">
            {message.message}
            )}
          </div>
        )}

        {showSuccessMessage && (
          <div className="text-green-600 dark:text-green-400 text-sm mb-4">
            {message.message}
          </div>
        )}

        <div className="flex justify-between items-center">
          {showAuthFactorTokenInput && (
            <button
              type="button"
              onClick={() => {
                setShowAuthFactorTokenInput(false);
                saveShowAuthFactorTokenInputToStorage(false);
                setAuthFactorToken("");
                setMessage(null);
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Loading..."
              : showAuthFactorTokenInput
              ? "Verify Code"
              : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default IndexPopup;
