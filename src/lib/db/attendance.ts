import {
  collection,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AttendanceStatus } from "@/types";

const ATTENDANCE_COLLECTION = "attendance";

function getAttendanceDocId(date: string, classId: string, gender: string, prayerType: string): string {
  return `${date}_${classId}_${gender}_${prayerType}`;
}

export function subscribeToAttendance(
  date: string,
  classId: string,
  gender: string,
  prayerType: string,
  callback: (statuses: Record<string, AttendanceStatus>) => void
): () => void {
  const docId = getAttendanceDocId(date, classId, gender, prayerType);
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.statuses) {
        callback(data.statuses);
      } else if (data.presentStudents) {
        // Migration logic for old data
        const statuses: Record<string, AttendanceStatus> = {};
        data.presentStudents.forEach((id: string) => {
          statuses[id] = "hadir";
        });
        callback(statuses);
      } else {
        callback({});
      }
    } else {
      callback({});
    }
  });
}

export async function updateStudentStatus(
  date: string,
  classId: string,
  gender: string,
  prayerType: string,
  studentId: string,
  status: AttendanceStatus
): Promise<void> {
  const docId = getAttendanceDocId(date, classId, gender, prayerType);
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, {
      [`statuses.${studentId}`]: status,
      updatedAt: new Date(),
    });
  } else {
    await setDoc(docRef, {
      date,
      classId,
      gender,
      prayerType,
      statuses: {
        [studentId]: status,
      },
      updatedAt: new Date(),
    });
  }
}

export async function saveAttendanceRecord(
  date: string,
  classId: string,
  gender: string,
  prayerType: string,
  statuses: Record<string, AttendanceStatus>
): Promise<void> {
  const docId = getAttendanceDocId(date, classId, gender, prayerType);
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
  
  await setDoc(docRef, {
    date,
    classId,
    gender,
    prayerType,
    statuses,
    updatedAt: new Date(),
  });
}
