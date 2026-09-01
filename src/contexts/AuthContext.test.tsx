// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getDoc } from "firebase/firestore";

// Mock Firebase Auth and Firestore
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, collection, id) => ({ path: `${collection}/${id}` })),
  getDoc: vi.fn(),
}));

vi.mock("@/lib/firebase/config", () => ({
  auth: { currentUser: null },
  db: {},
}));

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

function ConsumerComponent() {
  const { user, role, profile, loading, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? "loading" : "ready"}</div>
      <div data-testid="user">{user ? user.uid : "no-user"}</div>
      <div data-testid="role">{role ?? "no-role"}</div>
      <div data-testid="profile">{profile ? JSON.stringify(profile) : "no-profile"}</div>
      <button onClick={() => login("test@example.com", "password")}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe("AuthContext & AuthProvider", () => {
  let authCallback: ((user: any) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();

    (onAuthStateChanged as any).mockImplementation((_auth: any, callback: any) => {
      authCallback = callback;
      return () => {};
    });
  });

  afterEach(() => {
    authCallback = null;
  });

  it("hydrates immediately from localStorage if cached UID matches current user (SWR)", async () => {
    // Seed localStorage
    window.localStorage.setItem("auth_uid", "user-123");
    window.localStorage.setItem("auth_role", "admin");
    window.localStorage.setItem("auth_profile", JSON.stringify({ name: "Admin User" }));

    // Mock Firestore getDoc to resolve later
    let resolveAdminDoc: (val: any) => void;
    const adminPromise = new Promise((resolve) => {
      resolveAdminDoc = resolve;
    });

    (getDoc as any).mockImplementation((docRef: any) => {
      if (docRef.path.includes("admins/user-123")) {
        return adminPromise;
      }
      return Promise.resolve({ exists: () => false, data: () => null });
    });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    // Trigger auth state with matching uid
    act(() => {
      authCallback?.({ uid: "user-123", email: "admin@test.com" });
    });

    // Fast path: role and profile should be set immediately and loading should be false
    expect(screen.getByTestId("role").textContent).toBe("admin");
    expect(screen.getByTestId("loading").textContent).toBe("ready");
    expect(screen.getByTestId("profile").textContent).toContain("Admin User");

    // Resolve parallel Firestore call
    await act(async () => {
      resolveAdminDoc!({
        exists: () => true,
        data: () => ({ name: "Admin User", updated: true }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("profile").textContent).toContain("updated");
    });
  });

  it("parallelizes Firestore queries via Promise.all when discovering role", async () => {
    let resolveAdmin: any;
    let resolveSupervisor: any;
    let resolveCoord: any;

    const pAdmin = new Promise((res) => { resolveAdmin = res; });
    const pSupervisor = new Promise((res) => { resolveSupervisor = res; });
    const pCoord = new Promise((res) => { resolveCoord = res; });

    (getDoc as any).mockImplementation((docRef: any) => {
      if (docRef.path.includes("admins")) return pAdmin;
      if (docRef.path.includes("supervisors")) return pSupervisor;
      if (docRef.path.includes("coordinators")) return pCoord;
      return Promise.resolve({ exists: () => false, data: () => null });
    });

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    act(() => {
      authCallback?.({ uid: "supervisor-123", email: "super@test.com" });
    });

    // All 3 getDoc calls should have been dispatched simultaneously
    expect(getDoc).toHaveBeenCalledTimes(3);

    // Resolve all 3
    await act(async () => {
      resolveAdmin({ exists: () => false, data: () => null });
      resolveSupervisor({ exists: () => true, data: () => ({ name: "Pembina 1", role: "supervisor" }) });
      resolveCoord({ exists: () => false, data: () => null });
    });

    await waitFor(() => {
      expect(screen.getByTestId("role").textContent).toBe("supervisor");
      expect(screen.getByTestId("loading").textContent).toBe("ready");
      expect(window.localStorage.getItem("auth_role")).toBe("supervisor");
      expect(window.localStorage.getItem("auth_uid")).toBe("supervisor-123");
    });
  });

  it("clears cached auth and state on logout", async () => {
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "Admin" }),
    });

    window.localStorage.setItem("auth_uid", "user-123");
    window.localStorage.setItem("auth_role", "admin");
    window.localStorage.setItem("auth_profile", JSON.stringify({ name: "Admin" }));

    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    act(() => {
      authCallback?.({ uid: "user-123", email: "admin@test.com" });
    });

    const logoutButton = screen.getByText("Logout");
    await act(async () => {
      logoutButton.click();
    });

    expect(signOut).toHaveBeenCalled();
    expect(window.localStorage.getItem("auth_uid")).toBeNull();
    expect(window.localStorage.getItem("auth_role")).toBeNull();
  });
});
