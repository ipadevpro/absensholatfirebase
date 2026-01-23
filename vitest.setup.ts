import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for Firebase
vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com');
vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'test-project');
vi.stubEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com');
vi.stubEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '123456789');
vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '1:123456789:web:abcdef');