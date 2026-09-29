"use server";

import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function createSupervisorAccount(data: {
  name: string;
  email: string;
  password: string;
  classes: string[];
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
      email: data.email,
      initialPassword: data.password,
      uid: userRecord.uid,
      classes: data.classes,
      createdAt: new Date(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error('Error creating supervisor:', error);
    return { success: false, error: error.message || 'Gagal membuat akun pembina' };
  }
}

export async function resetSupervisorPassword(uid: string, newPassword: string) {
  try {
    // 1. Update password in Firebase Auth
    await adminAuth.updateUser(uid, {
      password: newPassword,
    });

    // 2. Update initialPassword in Firestore
    await adminDb.collection('supervisors').doc(uid).set({
      initialPassword: newPassword,
      updatedAt: new Date(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('Error resetting supervisor password:', error);
    return { success: false, error: error.message || 'Gagal mereset password pembina' };
  }
}

export async function syncSupervisorEmails() {
  try {
    const snapshot = await adminDb.collection('supervisors').get();
    let updatedCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (!data.email) {
        try {
          const authUser = await adminAuth.getUser(docSnap.id);
          if (authUser && authUser.email) {
            await docSnap.ref.update({ email: authUser.email });
            updatedCount++;
          }
        } catch (authErr) {
          console.warn(`Could not fetch auth user for supervisor ${docSnap.id}:`, authErr);
        }
      }
    }

    return { success: true, count: updatedCount };
  } catch (error: any) {
    console.error('Error syncing supervisor emails:', error);
    return { success: false, error: error.message };
  }
}
