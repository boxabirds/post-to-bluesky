import { renderHook, act } from '@testing-library/react';
import { useAuthState, AuthState, AUTH_STATE_KEYS } from './useAuthState';

// Mock Storage class
const mockStorageInstance = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn()
};

jest.mock('@plasmohq/storage', () => ({
  Storage: jest.fn().mockImplementation(() => mockStorageInstance)
}));

describe('useAuthState', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockStorageInstance.get.mockImplementation(() => Promise.resolve(null));
    mockStorageInstance.set.mockImplementation(() => Promise.resolve());
    mockStorageInstance.remove.mockImplementation(() => Promise.resolve());
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAuthState());

      expect(result.current.authState).toBe(AuthState.UNAUTHENTICATED);
      expect(result.current.identifier).toBe('');
      expect(result.current.password).toBe('');
      expect(result.current.clientSession).toBe('');
    });

    it('should load stored values on initialization', async () => {
      // Mock stored values
      mockStorageInstance.get.mockImplementation((key: string) => {
        switch(key) {
          case AUTH_STATE_KEYS.BSKY_AUTH_STATE:
            return Promise.resolve(AuthState.AUTHENTICATED);
          case AUTH_STATE_KEYS.BSKY_CLIENT_SESSION:
            return Promise.resolve('stored-session');
          default:
            return Promise.resolve(null);
        }
      });

      const { result } = renderHook(() => useAuthState());

      // Wait for all effects to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.authState).toBe(AuthState.AUTHENTICATED);
      expect(result.current.clientSession).toBe('stored-session');
    });
  });

  describe('Credential Management', () => {
    it('should clear credentials when auth state changes to AUTHENTICATED', async () => {
      const { result } = renderHook(() => useAuthState());

      // Set initial credentials
      await act(async () => {
        result.current.setIdentifier('test-user');
        result.current.setPassword('test-pass');
      });

      // Change auth state to AUTHENTICATED
      await act(async () => {
        result.current.setAuthState(AuthState.AUTHENTICATED);
      });

      // Verify credentials are cleared
      expect(result.current.identifier).toBe('');
      expect(result.current.password).toBe('');
      expect(mockStorageInstance.remove).toHaveBeenCalledWith(AUTH_STATE_KEYS.BSKY_IDENTIFIER);
      expect(mockStorageInstance.remove).toHaveBeenCalledWith(AUTH_STATE_KEYS.BSKY_PASSWORD);
    });

    it('should clear credentials when auth state changes to UNAUTHENTICATED', async () => {
      const { result } = renderHook(() => useAuthState());

      // Set initial credentials
      await act(async () => {
        result.current.setIdentifier('test-user');
        result.current.setPassword('test-pass');
      });

      // Change auth state to UNAUTHENTICATED
      await act(async () => {
        result.current.setAuthState(AuthState.UNAUTHENTICATED);
      });

      // Verify credentials are cleared
      expect(result.current.identifier).toBe('');
      expect(result.current.password).toBe('');
      expect(mockStorageInstance.remove).toHaveBeenCalledWith(AUTH_STATE_KEYS.BSKY_IDENTIFIER);
      expect(mockStorageInstance.remove).toHaveBeenCalledWith(AUTH_STATE_KEYS.BSKY_PASSWORD);
    });

    it('should preserve credentials when auth state changes to AWAITING_VALID_AUTH_TOKEN', async () => {
      const { result } = renderHook(() => useAuthState());

      // Wait for initial state to settle
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Set initial credentials
      await act(async () => {
        result.current.setIdentifier('test-user');
        result.current.setPassword('test-pass');
        // Wait for state updates
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Change auth state to AWAITING_VALID_AUTH_TOKEN
      await act(async () => {
        result.current.setAuthState(AuthState.AWAITING_VALID_AUTH_TOKEN);
        // Wait for state updates
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify credentials are preserved
      expect(result.current.identifier).toBe('test-user');
      expect(result.current.password).toBe('test-pass');
    });

    it('should not clear credentials when setting client session', async () => {
      const { result } = renderHook(() => useAuthState());

      // Wait for initial state to settle
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Set initial credentials
      await act(async () => {
        result.current.setIdentifier('test-user');
        result.current.setPassword('test-pass');
        // Wait for state updates
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Clear mock history before setting client session
      mockStorageInstance.remove.mockClear();

      // Set client session
      await act(async () => {
        await result.current.setClientSession('new-session');
        // Wait for state updates
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify credentials are preserved
      expect(result.current.identifier).toBe('test-user');
      expect(result.current.password).toBe('test-pass');
      expect(result.current.clientSession).toBe('new-session');

      // Verify only session storage was updated
      expect(mockStorageInstance.set).toHaveBeenCalledWith(
        AUTH_STATE_KEYS.BSKY_CLIENT_SESSION,
        'new-session'
      );
      expect(mockStorageInstance.remove).not.toHaveBeenCalledWith(AUTH_STATE_KEYS.BSKY_IDENTIFIER);
      expect(mockStorageInstance.remove).not.toHaveBeenCalledWith(AUTH_STATE_KEYS.BSKY_PASSWORD);
    });
  });
});
