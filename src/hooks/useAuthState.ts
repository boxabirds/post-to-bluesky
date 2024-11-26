// hooks/useAuthState.ts
import { useState, useEffect } from 'react';
import { Storage } from "@plasmohq/storage";


export enum AuthState {
  UNAUTHENTICATED = "UNAUTHENTICATED",
  AWAITING_VALID_AUTH_TOKEN = "AWAITING_VALID_AUTH_TOKEN",
  AUTHENTICATED = "AUTHENTICATED"
}

export const AUTH_STATE_KEYS = {
  BSKY_AUTH_STATE: "bsky_auth_state",
  BSKY_CLIENT_SESSION: "bsky_client_session",
  BSKY_USER_ID: "bsky_user_id",
  BSKY_PASSWORD: "bsky_password",
}

export function useAuthState() {
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [clientSession, setClientSession] = useState<string>("");

  // https://docs.plasmo.com/framework/storage
  const storage = new Storage();

  // We only need the credentials temporarily to get the auth token
  // so we clear them after we have the token
  const setClientSessionAndClearCredentials = async (newSession: string) => {
    setClientSession(newSession);
    if (newSession.trim()) {
      // Handle client session storage
      await storage.set(AUTH_STATE_KEYS.BSKY_CLIENT_SESSION, newSession);
      
      // Clear credentials
      setUsername("");
      setPassword("");
      await storage.remove(AUTH_STATE_KEYS.BSKY_USER_ID);
      await storage.remove(AUTH_STATE_KEYS.BSKY_PASSWORD);
    } else {
      await storage.remove(AUTH_STATE_KEYS.BSKY_CLIENT_SESSION);
    }
  };
  // Load initial values
  useEffect(() => {
    const loadInitialValues = async () => {
      // Load auth state from regular storage
      const storedAuthState = await storage.get(AUTH_STATE_KEYS.BSKY_AUTH_STATE);
      if (storedAuthState) {
        setAuthState(storedAuthState as AuthState);
      }

      // Load session first
      const storedSession = await storage.get(AUTH_STATE_KEYS.BSKY_CLIENT_SESSION);
      if (storedSession) {
        setClientSession(storedSession);
        // If we have a session, don't load username and password
        return;
      }

      // Only load username and password if we don't have a session
      const storedUsername = await storage.get(AUTH_STATE_KEYS.BSKY_USER_ID);
      const storedPassword = await storage.get(AUTH_STATE_KEYS.BSKY_PASSWORD);

      if (storedUsername) setUsername(storedUsername);
      if (storedPassword) setPassword(storedPassword);
    };

    loadInitialValues();
  }, []);

  // Sync auth state to storage
  useEffect(() => {
    storage.set(AUTH_STATE_KEYS.BSKY_AUTH_STATE, authState);
  }, [authState]);

  // Sync sensitive data 
  useEffect(() => {
    if (username) {
      storage.set(AUTH_STATE_KEYS.BSKY_USER_ID, username);
    } else {
      storage.remove(AUTH_STATE_KEYS.BSKY_USER_ID);
    }
  }, [username]);

  useEffect(() => {
    if (password) {
      storage.set(AUTH_STATE_KEYS.BSKY_PASSWORD, password);
    } else {
      storage.remove(AUTH_STATE_KEYS.BSKY_PASSWORD);
    }
  }, [password]);


  return {
    authState,
    setAuthState,
    username,
    setUsername,
    password,
    setPassword,
    clientSession,
    setClientSession: setClientSessionAndClearCredentials
  };
}
