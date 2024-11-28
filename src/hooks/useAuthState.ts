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
  BSKY_IDENTIFIER: "bsky_user_id",
  BSKY_PASSWORD: "bsky_password",
}

export function useAuthState() {
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED);
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [clientSession, setClientSession] = useState<string>("");

  // https://docs.plasmo.com/framework/storage
  const storage = new Storage();

  // We store the session in storage
  const setClientSessionInStorage = async (newSession: string) => {
    setClientSession(newSession);
    if (newSession.trim()) {
      await storage.set(AUTH_STATE_KEYS.BSKY_CLIENT_SESSION, newSession);
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
      } else {
        setAuthState(AuthState.UNAUTHENTICATED);
      }

      // Load session first
      const storedSession = await storage.get(AUTH_STATE_KEYS.BSKY_CLIENT_SESSION);
      if (storedSession) {
        setClientSession(storedSession);
        // If we have a session, don't load identifier and password
        return;
      }

      // Only load identifier and password if we don't have a session
      const storedIdentifier = await storage.get(AUTH_STATE_KEYS.BSKY_IDENTIFIER);
      const storedPassword = await storage.get(AUTH_STATE_KEYS.BSKY_PASSWORD);

      if (storedIdentifier) setIdentifier(storedIdentifier);
      if (storedPassword) setPassword(storedPassword);
    };

    loadInitialValues();
  }, []);

  // Sync auth state to storage and clear credentials when authenticated/unauthenticated
  useEffect(() => {
    const updateAuthState = async () => {
      await storage.set(AUTH_STATE_KEYS.BSKY_AUTH_STATE, authState);
      
      if (authState === AuthState.AUTHENTICATED || authState === AuthState.UNAUTHENTICATED) {
        setIdentifier("");
        setPassword("");
        await storage.remove(AUTH_STATE_KEYS.BSKY_IDENTIFIER);
        await storage.remove(AUTH_STATE_KEYS.BSKY_PASSWORD);
      }
    };
    
    updateAuthState();
  }, [authState]);

  // Sync identifier data temporarily (see state change logic) 
  useEffect(() => {
    if (identifier) {
      storage.set(AUTH_STATE_KEYS.BSKY_IDENTIFIER, identifier);
    } else {
      storage.remove(AUTH_STATE_KEYS.BSKY_IDENTIFIER);
    }
  }, [identifier]);

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
    identifier,
    setIdentifier,
    password,
    setPassword,
    clientSession,
    setClientSession: setClientSessionInStorage
  };
}
