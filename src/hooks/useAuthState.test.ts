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
      expect(result.current.username).toBe('');
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
    it('should clear credentials when setting client session', async () => {
      const { result } = renderHook(() => useAuthState());

      // Set initial credentials
      await act(async () => {
        result.current.setUsername('test-user');
        result.current.setPassword('test-pass');
      });

      // Set client session which should clear credentials
      await act(async () => {
        await result.current.setClientSession('new-session');
      });

      // Verify state changes
      expect(result.current.username).toBe('');
      expect(result.current.password).toBe('');
      expect(result.current.clientSession).toBe('new-session');

      // Verify storage operations
      expect(mockStorageInstance.remove).toHaveBeenCalledWith(AUTH_STATE_KEYS.BSKY_USER_ID);
      expect(mockStorageInstance.remove).toHaveBeenCalledWith(AUTH_STATE_KEYS.BSKY_PASSWORD);
      expect(mockStorageInstance.set).toHaveBeenCalledWith(
        AUTH_STATE_KEYS.BSKY_CLIENT_SESSION,
        'new-session'
      );
    });
  });
});
