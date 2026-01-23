import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  UserCredential
} from "firebase/auth";
import { auth } from "./config";

// Auth function types
export type AuthUser = User | null;
export type AuthCallback = (user: AuthUser) => void;

export interface AuthError {
  code: string;
  message: string;
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    throw {
      code: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

// Create new user with email and password
export async function createUserWithEmail(email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    throw {
      code: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

// Sign out current user
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw {
      code: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

// Listen to auth state changes
export function onAuthChange(callback: AuthCallback): () => void {
  return onAuthStateChanged(auth, callback);
}

// Helper function to get user-friendly error messages
function getErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address format',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'Email is already registered',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/operation-not-allowed': 'This operation is not allowed',
    'auth/expired-action-code': 'This link has expired',
    'auth/invalid-action-code': 'This link is invalid',
  };

  return errorMessages[code] || 'An unexpected error occurred';
}

export type { User, UserCredential };
