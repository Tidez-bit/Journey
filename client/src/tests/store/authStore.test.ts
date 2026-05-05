import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    });
    
    // Clear localStorage
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should have initial state with user = null, isAuthenticated = false', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set user and isAuthenticated = true on login', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };
    const mockToken = 'mock-jwt-token';

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  it('should store token to localStorage on login', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };
    const mockToken = 'mock-jwt-token';

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  it('should clear user and isAuthenticated = false on logout', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // First login
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };
    const mockToken = 'mock-jwt-token';

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should remove token from localStorage on logout', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // First login
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };
    const mockToken = 'mock-jwt-token';

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('should fully reset state after login then logout', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Login
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };
    const mockToken = 'mock-jwt-token';

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Logout
    act(() => {
      result.current.logout();
    });

    // Verify complete reset
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should update user with setUser', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 'user-456',
      name: 'Updated User',
      email: 'updated@example.com',
    };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });
});
