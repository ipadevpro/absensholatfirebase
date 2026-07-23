import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const SETTINGS_COLLECTION = "settings";
const ATTENDANCE_DOC = "attendance";

export async function getAttendanceStartDate(): Promise<string | null> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, ATTENDANCE_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.startDate || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching start date:", error);
    return null;
  }
}

export async function updateAttendanceStartDate(date: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, ATTENDANCE_DOC);
  await setDoc(docRef, {
    startDate: date,
  }, { merge: true });
}
