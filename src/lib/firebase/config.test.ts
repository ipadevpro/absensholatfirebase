import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef',
};

describe('Firebase Configuration', () => {
  beforeEach(() => {
    // Clear module cache to ensure fresh imports
    vi.resetModules();
    
    // Set environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should export firebase app instance', async () => {
    const { app } = await import('./config');
    expect(app).toBeDefined();
    expect(app.options.apiKey).toBe(mockEnv.NEXT_PUBLIC_FIREBASE_API_KEY);
  });

  it('should export firebase auth instance', async () => {
    const { auth } = await import('./config');
    expect(auth).toBeDefined();
  });

  it('should export firebase db instance', async () => {
    const { db } = await import('./config');
    expect(db).toBeDefined();
  });
});

describe('Firebase Auth Module', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.entries(mockEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should export auth-related functions', async () => {
    const auth = await import('./auth');
    expect(auth.signInWithEmailAndPassword).toBeDefined();
    expect(auth.createUserWithEmailAndPassword).toBeDefined();
    expect(auth.signOut).toBeDefined();
    expect(auth.onAuthStateChanged).toBeDefined();
  });
});

describe('Firebase DB Module', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.entries(mockEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should export db-related functions', async () => {
    const db = await import('./db');
    expect(db.getStudents).toBeDefined();
    expect(db.getPrayers).toBeDefined();
    expect(db.addAttendance).toBeDefined();
    expect(db.updateAttendance).toBeDefined();
  });
});
