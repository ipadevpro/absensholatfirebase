import {
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Supervisor } from "@/types";

const SUPERVISORS_COLLECTION = "supervisors";

export async function getAllSupervisors(): Promise<Supervisor[]> {
  const snapshot = await getDocs(collection(db, SUPERVISORS_COLLECTION));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Supervisor));
}

export async function addSupervisor(supervisor: Omit<Supervisor, "id" | "createdAt">): Promise<string> {
  const docRef = doc(db, SUPERVISORS_COLLECTION, supervisor.uid);
  await setDoc(docRef, {
    ...supervisor,
    createdAt: new Date()
  });
  return supervisor.uid;
}

export async function deleteSupervisor(id: string): Promise<void> {
  await deleteDoc(doc(db, SUPERVISORS_COLLECTION, id));
}
