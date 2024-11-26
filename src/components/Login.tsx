// components/Login.tsx
import { type FormEvent, useState, useRef, useEffect } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { 
    MESSAGE_TYPE,
    STORAGE_KEYS,
    AuthState,
    BSKY_DOMAIN
 } from "~types";

interface LoginProps {
  onAuthenticated: () => void;
}

export function Login(props: LoginProps) {


  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED);
  const [message, setMessage] = useState<null | {
    type: (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];
    message: string;
  }>(null);
  const storage = useRef<Storage>(new Storage());

  const isLoading = [AuthState.CREDENTIALS_SUBMITTED, AuthState.TOKEN_SUBMITTED].includes(authState);
  const showErrorMessage = message?.type === MESSAGE_TYPE.ERROR;


  // do we have a valid session already? 
  useEffect(() => {
    const init = async () => {
        if (await storage.current.get(STORAGE_KEYS.BSKY_AUTH_STATE) === AuthState.AUTHENTICATED) {
            props.onAuthenticated();
            setAuthState(AuthState.AUTHENTICATED);
        }
    };
    init();
    }, []);

  // We're authenticated, so we don't need to show the login form
  useEffect(() => {
      if (authState === AuthState.AUTHENTICATED) {
        props.onAuthenticated();
        return;
      }
  }, [authState]);
    

  const handleLogin = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    // alice => alice.bsky.social 
    // @alice => alice.bsky.social
    // alice@bsky.social => alice.bsky.social
    const formattedIdentifier = identifier
    .replace(/^@/, "") // Remove leading @
    .replace(/@/g, ".") // Replace @ with .
    .includes(".") 
      ? identifier.replace(/^@/, "").replace(/@/g, ".")
      : `${identifier}.${BSKY_DOMAIN}`;
    };

  return (
    <form onSubmit={handleLogin} className="mt-4">
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
                autoFocus
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
      <div className="flex justify-between items-center">
          <button type="submit" 
          disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? (
            <LoadingSpinner />
            ) : (   
            "Sign In"
            )}
          </button>
      </div>
    </form>
  );
}
