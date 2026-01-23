import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Student } from "@/types";

const STUDENTS_COLLECTION = "students";

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  const q = query(collection(db, STUDENTS_COLLECTION), where("classId", "==", classId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Student));
}

export async function addStudent(student: Omit<Student, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), {
    ...student,
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  await updateDoc(doc(db, STUDENTS_COLLECTION, id), data);
}

export async function deleteStudent(id: string): Promise<void> {
  await deleteDoc(doc(db, STUDENTS_COLLECTION, id));
}