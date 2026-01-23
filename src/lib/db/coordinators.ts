import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Coordinator } from "@/types";

const COORDINATORS_COLLECTION = "coordinators";

export async function getCoordinatorsByClass(classId: string): Promise<Coordinator[]> {
  const q = query(collection(db, COORDINATORS_COLLECTION), where("classId", "==", classId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Coordinator));
}

export async function getAllCoordinators(): Promise<Coordinator[]> {
  const snapshot = await getDocs(collection(db, COORDINATORS_COLLECTION));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Coordinator));
}

export async function addCoordinator(coordinator: Omit<Coordinator, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, COORDINATORS_COLLECTION), {
    ...coordinator,
    createdAt: new Date()
  });
  return docRef.id;
}

export async function deleteCoordinator(id: string): Promise<void> {
  await deleteDoc(doc(db, COORDINATORS_COLLECTION, id));
}
