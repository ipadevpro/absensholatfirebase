"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export type UserRole = "admin" | "coordinator" | "supervisor" | null;

const AUTH_UID_KEY = "auth_uid";
const AUTH_ROLE_KEY = "auth_role";
const AUTH_PROFILE_KEY = "auth_profile";

function getCachedAuth(): { uid: string | null; role: UserRole; profile: any | null } {
  if (typeof window === "undefined" || !window.localStorage) {
    return { uid: null, role: null, profile: null };
  }
  try {
    const uid = window.localStorage.getItem(AUTH_UID_KEY);
    const role = window.localStorage.getItem(AUTH_ROLE_KEY) as UserRole;
    const profileRaw = window.localStorage.getItem(AUTH_PROFILE_KEY);
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    return { uid, role, profile };
  } catch (e) {
    console.error("Error reading auth cache from localStorage:", e);
    return { uid: null, role: null, profile: null };
  }
}

function setCachedAuth(uid: string, role: UserRole, profile: any) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (uid && role) {
      window.localStorage.setItem(AUTH_UID_KEY, uid);
      window.localStorage.setItem(AUTH_ROLE_KEY, role);
      window.localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile ?? {}));
    } else {
      clearCachedAuth();
    }
  } catch (e) {
    console.error("Error writing auth cache to localStorage:", e);
  }
}

function clearCachedAuth() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(AUTH_UID_KEY);
    window.localStorage.removeItem(AUTH_ROLE_KEY);
    window.localStorage.removeItem(AUTH_PROFILE_KEY);
  } catch (e) {
    console.error("Error clearing auth cache from localStorage:", e);
  }
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  profile: any | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeUidRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Read cache on mount
    const cached = getCachedAuth();
    if (cached.uid && cached.role) {
      setRole(cached.role);
      setProfile(cached.profile);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      activeUidRef.current = currentUser ? currentUser.uid : null;

      if (currentUser) {
        // Fast path (SWR): if cached user matches currentUser, hydrate role & profile immediately
        const currentCache = getCachedAuth();
        if (currentCache.uid === currentUser.uid && currentCache.role) {
          setRole(currentCache.role);
          setProfile(currentCache.profile);
          setLoading(false);
        }

        // Parallel role discovery
        try {
          const [adminDoc, supervisorDoc, coordDoc] = await Promise.all([
            getDoc(doc(db, "admins", currentUser.uid)),
            getDoc(doc(db, "supervisors", currentUser.uid)),
            getDoc(doc(db, "coordinators", currentUser.uid)),
          ]);

          // Guard against stale async resolution if user logged out or switched during fetch
          if (activeUidRef.current !== currentUser.uid) {
            return;
          }

          let detectedRole: UserRole = null;
          let detectedProfile: any = null;

          if (adminDoc.exists()) {
            detectedRole = "admin";
            detectedProfile = adminDoc.data();
          } else if (supervisorDoc.exists()) {
            detectedRole = "supervisor";
            detectedProfile = supervisorDoc.data();
          } else if (coordDoc.exists()) {
            detectedRole = "coordinator";
            detectedProfile = coordDoc.data();
          }

          setRole(detectedRole);
          setProfile(detectedProfile);
          setCachedAuth(currentUser.uid, detectedRole, detectedProfile);
        } catch (e) {
          console.error("Error fetching role and profile:", e);
          if (activeUidRef.current === currentUser.uid && currentCache.uid !== currentUser.uid) {
            setRole(null);
            setProfile(null);
          }
        } finally {
          if (activeUidRef.current === currentUser.uid) {
            setLoading(false);
          }
        }
      } else {
        setRole(null);
        setProfile(null);
        clearCachedAuth();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      activeUidRef.current = null;
      clearCachedAuth();
      setUser(null);
      setRole(null);
      setProfile(null);
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || "Logout failed");
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

