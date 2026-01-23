import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

const mockLogin = vi.fn();
const mockPush = vi.fn();

vi.mock('../../contexts/AuthContext.tsx', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as vi.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders login form with title', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Absen Sholat')).toBeInTheDocument();
    expect(screen.getByText('SMP PGII 1 Bandung')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('allows entering email and password', () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('calls login and redirects on successful submission', async () => {
    mockLogin.mockResolvedValue(undefined);
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email atau password salah')).toBeInTheDocument();
    });
  });

  it('clears error when user starts typing again', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email atau password salah')).toBeInTheDocument();
    });
    
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    
    expect(screen.queryByText('Email atau password salah')).not.toBeInTheDocument();
  });
});
