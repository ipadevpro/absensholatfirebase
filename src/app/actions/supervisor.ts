"use server";

import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function createSupervisorAccount(data: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    // 2. Add to supervisors collection in Firestore
    await adminDb.collection('supervisors').doc(userRecord.uid).set({
      name: data.name,
      uid: userRecord.uid,
      createdAt: new Date(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error('Error creating supervisor:', error);
    return { success: false, error: error.message || 'Gagal membuat akun pembina' };
  }
}
