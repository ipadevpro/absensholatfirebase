'use server';

import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Gender } from '@/types';

export async function createCoordinatorAccount(data: {
  name: string;
  email: string;
  password: string;
  classId: string;
  gender: Gender;
}) {
  try {
    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    // 2. Add to coordinators collection in Firestore
    await adminDb.collection('coordinators').doc(userRecord.uid).set({
      name: data.name,
      uid: userRecord.uid,
      classId: data.classId,
      gender: data.gender,
      createdAt: new Date(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error('Error creating coordinator:', error);
    return { success: false, error: error.message || 'Gagal membuat akun koordinator' };
  }
}
