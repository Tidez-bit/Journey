import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

// Mock the api module
vi.mock('../../lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    
    // Reset auth store
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('should render email input', () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should render password input', () => {
    renderLogin();
    
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should render submit button', () => {
    renderLogin();
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('should show validation error when submitted with empty email', async () => {
    renderLogin();
    
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Fill only password
    await userEvent.type(passwordInput, 'password123');
    
    // Try to submit
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    // The form won't actually submit due to required attribute
    expect(api.post).not.toHaveBeenCalled();
  });

  it('should show validation error when submitted with empty password', async () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Fill only email
    await userEvent.type(emailInput, 'test@test.com');
    
    // Try to submit
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    expect(api.post).not.toHaveBeenCalled();
  });

  it('should call POST /api/auth/login on valid submit', async () => {
    const mockResponse = {
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@test.com',
        },
      },
    };

    vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Fill form
    await userEvent.type(emailInput, 'test@test.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Submit
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });

  it('should navigate to /dashboard on successful login', async () => {
    const mockResponse = {
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@test.com',
        },
      },
    };

    vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Fill and submit form
    await userEvent.type(emailInput, 'test@test.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error message on failed login (401)', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    };

    vi.mocked(api.post).mockRejectedValueOnce(mockError);

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Fill and submit form
    await userEvent.type(emailInput, 'test@test.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorMessage = screen.getByText(/invalid credentials/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('should show generic error message when no specific error provided', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'));

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Fill and submit form
    await userEvent.type(emailInput, 'test@test.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorMessage = screen.getByText(/login failed/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('should update auth store on successful login', async () => {
    const mockResponse = {
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@test.com',
        },
      },
    };

    vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

    renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Fill and submit form
    await userEvent.type(emailInput, 'test@test.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@test.com',
      });
      expect(state.token).toBe('mock-jwt-token');
    });
  });

  it('should render register link', () => {
    renderLogin();
    
    const registerLink = screen.getByText(/register here/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});
