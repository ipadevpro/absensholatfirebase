import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  DocumentData
} from "firebase/firestore";
import { db } from "./config";

// Types for the application
export interface Student {
  id: string;
  name: string;
  class: string;
  grade: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Prayer {
  id: string;
  name: string;
  time: string; // HH:mm format
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  prayerId: string;
  prayerName: string;
  date: Timestamp;
  status: 'present' | 'absent' | 'permission' | 'late';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  permission: number;
  late: number;
  total: number;
}

// Collection references
const STUDENTS_COLLECTION = 'students';
const PRAYERS_COLLECTION = 'prayers';
const ATTENDANCE_COLLECTION = 'attendance';

// Students functions
export async function getStudents(): Promise<Student[]> {
  try {
    const studentsRef = collection(db, STUDENTS_COLLECTION);
    const q = query(studentsRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Student));
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  try {
    const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists()) {
      return {
        id: studentSnap.id,
        ...studentSnap.data()
      } as Student;
    }
    return null;
  } catch (error) {
    console.error('Error fetching student:', error);
    throw error;
  }
}

export async function addStudent(studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = Timestamp.now();
    const studentsRef = collection(db, STUDENTS_COLLECTION);
    const docRef = await addDoc(studentsRef, {
      ...studentData,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
}

// Prayers functions
export async function getPrayers(): Promise<Prayer[]> {
  try {
    const prayersRef = collection(db, PRAYERS_COLLECTION);
    const q = query(prayersRef, where('isActive', '==', true), orderBy('time', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Prayer));
  } catch (error) {
    console.error('Error fetching prayers:', error);
    throw error;
  }
}

export async function addPrayer(prayerData: Omit<Prayer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = Timestamp.now();
    const prayersRef = collection(db, PRAYERS_COLLECTION);
    const docRef = await addDoc(prayersRef, {
      ...prayerData,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding prayer:', error);
    throw error;
  }
}

// Attendance functions
export async function getAttendanceByDate(date: Date): Promise<Attendance[]> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRef = collection(db, ATTENDANCE_COLLECTION);
    const q = query(
      attendanceRef,
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Attendance));
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
}

export async function getAttendanceByStudent(studentId: string, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
  try {
    let q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    );

    if (startDate && endDate) {
      q = query(
        collection(db, ATTENDANCE_COLLECTION),
        where('studentId', '==', studentId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Attendance));
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    throw error;
  }
}

export async function addAttendance(attendanceData: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = Timestamp.now();
    const attendanceRef = collection(db, ATTENDANCE_COLLECTION);
    const docRef = await addDoc(attendanceRef, {
      ...attendanceData,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding attendance:', error);
    throw error;
  }
}

export async function updateAttendance(attendanceId: string, data: Partial<Attendance>): Promise<void> {
  try {
    const attendanceRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);
    await updateDoc(attendanceRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }
}

export async function getAttendanceStats(studentId: string, startDate: Date, endDate: Date): Promise<AttendanceStats> {
  try {
    const attendance = await getAttendanceByStudent(studentId, startDate, endDate);
    
    const stats: AttendanceStats = {
      present: 0,
      absent: 0,
      permission: 0,
      late: 0,
      total: attendance.length
    };

    attendance.forEach(record => {
      if (record.status === 'present') stats.present++;
      else if (record.status === 'absent') stats.absent++;
      else if (record.status === 'permission') stats.permission++;
      else if (record.status === 'late') stats.late++;
    });

    return stats;
  } catch (error) {
    console.error('Error calculating attendance stats:', error);
    throw error;
  }
}

// Utility function to convert Firestore Timestamp to Date
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

// Utility function to convert Date to Firestore Timestamp
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}
