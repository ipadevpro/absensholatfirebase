import {
  collection,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const ATTENDANCE_COLLECTION = "attendance";

function getAttendanceDocId(date: string, classId: string, gender: string, prayerType: string): string {
  return `${date}_${classId}_${gender}_${prayerType}`;
}

export async function getAttendance(
  date: string,
  classId: string,
  gender: string,
  prayerType: string
): Promise<string[]> {
  const docId = getAttendanceDocId(date, classId, gender, prayerType);
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().presentStudents || [];
  }
  return [];
}

export async function markPresent(
  date: string,
  classId: string,
  gender: string,
  prayerType: string,
  studentId: string
): Promise<void> {
  const docId = getAttendanceDocId(date, classId, gender, prayerType);
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    if (!data.presentStudents?.includes(studentId)) {
      await updateDoc(docRef, {
        presentStudents: arrayUnion(studentId),
      });
    }
  } else {
    // Use setDoc to create with specific ID
    await setDoc(docRef, {
      date,
      classId,
      gender,
      prayerType,
      presentStudents: [studentId],
    });
  }
}

export async function markAbsent(
  date: string,
  classId: string,
  gender: string,
  prayerType: string,
  studentId: string
): Promise<void> {
  const docId = getAttendanceDocId(date, classId, gender, prayerType);
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, {
      presentStudents: arrayRemove(studentId),
    });
  }
}
