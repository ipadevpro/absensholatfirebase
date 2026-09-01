// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("ProtectedRoute", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders children smoothly when user is present even if loading is true", () => {
    (useAuth as any).mockReturnValue({
      user: { uid: "user-123", email: "user@test.com" },
      loading: true,
    });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Dashboard Shell Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("protected-content")).toBeDefined();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders spinner only when user is null and loading is true", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      loading: true,
    });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Dashboard Shell Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByTestId("protected-content")).toBeNull();
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("redirects to /login and renders nothing when user is null and not loading", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      loading: false,
    });

    const { container } = render(
      <ProtectedRoute>
        <div data-testid="protected-content">Dashboard Shell Content</div>
      </ProtectedRoute>
    );

    expect(container.firstChild).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
