// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./page";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("LoginPage", () => {
  const mockLogin = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      login: mockLogin,
    });
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders branding elements and login form correctly", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Absen Sholat" })).toBeDefined();
    expect(screen.getByText("SMP PGII 1 Bandung")).toBeDefined();
    expect(screen.getByText("Masuk ke sistem presensi ibadah harian")).toBeDefined();
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByRole("button", { name: "Masuk" })).toBeDefined();
    expect(screen.getByText(/Dikembangkan oleh Devi Saidulloh/i)).toBeDefined();
  });

  it("calls login and redirects to /dashboard on successful submit", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Masuk" });

    fireEvent.change(emailInput, { target: { value: "admin@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin@test.com", "password123");
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error alert on login failure and clears error on input change", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Masuk" });

    fireEvent.change(emailInput, { target: { value: "wrong@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpass" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email atau password salah")).toBeDefined();
    });

    // Typing in email should clear error
    fireEvent.change(emailInput, { target: { value: "new@test.com" } });
    expect(screen.queryByText("Email atau password salah")).toBeNull();
  });

  it("displays loading state when submitting", async () => {
    let resolveLogin: (val?: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValueOnce(loginPromise);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Masuk" });

    fireEvent.change(emailInput, { target: { value: "admin@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    expect(screen.getByText("Memproses...")).toBeDefined();

    resolveLogin!();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
