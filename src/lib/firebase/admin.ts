import * as admin from 'firebase-admin';

function initializeAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in .env.local');
  }

  // RE-FORMATTING LOGIC
  try {
    // 1. If it looks like Base64 (doesn't start with ---), decode it
    if (!privateKey.includes('-----BEGIN')) {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
    }

    // 2. Clean up any weird escaping from .env
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // 3. Final trim and ensure headers
    privateKey = privateKey.trim();
    if (!privateKey.startsWith('-----BEGIN')) {
        privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
  } catch (e) {
    console.error('Error parsing private key format');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

// Global instances with proper export syntax
const app = initializeAdmin();
const adminAuth = admin.auth(app);
const adminDb = admin.firestore(app);

export { adminAuth, adminDb };
