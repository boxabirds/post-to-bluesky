// components/Login.tsx
import { FormEvent, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { useAuthState, AuthState } from "~hooks/useAuthState";
import {  sendToBackground } from "@plasmohq/messaging";

export const BSKY_DOMAIN = process.env.PLASMO_PUBLIC_BSKY_DOMAIN || "bsky.social";
export const AUTH_FACTOR_TOKEN_REQUIRED_ERROR_MESSAGE = "A sign in code has been sent to your email address";
export const MESSAGE_TYPE = {
  ERROR: "error",
  SUCCESS: "success",
} as const;
  

export function Login() {
  const auth = useAuthState();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<null | {
    type: (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];
    message: string;
  }>(null);
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [authFactorToken, setAuthFactorToken] = useState("");
  const showAuthFactorTokenInput = auth.authState === AuthState.AWAITING_VALID_AUTH_TOKEN;
  const showErrorMessage = message?.type === MESSAGE_TYPE.ERROR;
  const showSuccessMessage = message?.type === MESSAGE_TYPE.SUCCESS;
  const setErrorMessage = (message: string) => {
    setMessage({ type: MESSAGE_TYPE.ERROR, message });
  };

  const handleLogin = async (e?: FormEvent) => {
    e?.preventDefault()

    // Format identifier (handle/email)
    const formattedIdentifier = auth.identifier
      .replace(/^@/, "") // Remove leading @
      .includes(".") 
        ? auth.identifier.replace(/^@/, "").replace(/@/g, ".")
        : `${auth.identifier}.${BSKY_DOMAIN}`;

    try {
      setIsLoading(true);
      setMessage(null);
      auth.setPassword(password);
      auth.setIdentifier(formattedIdentifier);
      const { session, error } = await sendToBackground({
        name: "login",
        body: {
          identifier: formattedIdentifier,
          password: password,
          ...(authFactorToken && { authFactorToken: authFactorToken }),
        },
      });
      
      if (error) {
        // 2FA ENABLED and requested
        // the Bluesky API returns an error if the user has 2FA enabled
        // not really an error but that's how it is. 
        if (error.message.includes(AUTH_FACTOR_TOKEN_REQUIRED_ERROR_MESSAGE)) {
          auth.setAuthState(AuthState.AWAITING_VALID_AUTH_TOKEN);
        
        // some other error
        } else {
          setErrorMessage(error.message);
        }

      // SUCCESSFUL login
      } else {
        setMessage({ type: MESSAGE_TYPE.SUCCESS, message: "Login successful!" });
        auth.setAuthState(AuthState.AUTHENTICATED);
        await auth.setClientSession(session);
      }
    } catch (error) {
      auth.setAuthState(AuthState.UNAUTHENTICATED);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="mt-4" role="form" aria-label="Login Form">
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
          placeholder="Enter latest code from email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
          autoFocus
        />
      </div>
    )}

    {showErrorMessage && (
      <div className="text-red-600 dark:text-red-400 text-sm mb-4">
        {message.message}
      </div>
    )}

    {showSuccessMessage && (
      <div className="text-green-600 dark:text-green-400 text-sm mb-4">
        {message.message}
      </div>
    )}

    <div className="flex justify-between items-center">
      <button
        type="submit"
        disabled={isLoading}
        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading
          ?  <LoadingSpinner />
          : showAuthFactorTokenInput
          ? "Verify Code"
          : "Login"}
      </button>
    </div>
  </form>
  );
}
