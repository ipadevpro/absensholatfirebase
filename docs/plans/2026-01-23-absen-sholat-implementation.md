# Absen Sholat Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build a mobile-first web app for SMP PGII 1 Bandung to track student prayer attendance (Zuhur, Ashar, Jum'at) with automatic grading and RBAC for teachers and student coordinators.

**Architecture:** Next.js 16+ App Router with Firebase (Auth, Firestore, offline persistence). Mobile-first PWA design with shadcn/ui components. Offline-first data sync using Firestore's offline cache.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Firebase (Auth, Firestore), Lucide React icons.

---

## Project Setup

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `.env.local`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

**Step 1: Initialize project**

```bash
cd /Users/users/Documents/Project/cursor/absensholatbaru
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git --use-npm
```

**Step 2: Install dependencies**

```bash
npm install firebase lucide-react date-fns clsx tailwind-merge class-variance-authority
npm install -D @types/node @types/react @types/react-dom typescript
```

**Step 3: Create .env.local template**

```bash
cp .env.local .env.local.example
```

**Step 4: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js 16 project with TypeScript and Tailwind"
```

---

### Task 2: Configure Firebase

**Files:**
- Create: `src/lib/firebase/config.ts`
- Create: `src/lib/firebase/auth.ts`
- Create: `src/lib/firebase/db.ts`
- Modify: `.env.local`

**Step 1: Create Firebase config**

```typescript
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
  console.warn("Firebase persistence error:", err.code);
});

export { app, auth, db };
```

**Step 2: Commit**

```bash
git add src/lib/firebase/
git commit -m "feat: add Firebase configuration with offline persistence"
```

---

### Task 3: Setup Project Structure and Types

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx` (shadcn)
- Create: `src/components/ui/card.tsx` (shadcn)
- Create: `src/components/ui/input.tsx` (shadcn)
- Create: `src/components/ui/label.tsx` (shadcn)
- Create: `src/components/ui/select.tsx` (shadcn)
- Create: `src/components/ui/checkbox.tsx` (shadcn)
- Create: `src/components/ui/table.tsx` (shadcn)
- Create: `src/components/ui/tabs.tsx` (shadcn)

**Step 1: Create types**

```typescript
export type Gender = "ikhwan" | "akhwat";

export type PrayerType = "zuhur" | "ashar" | "jumat";

export type UserRole = "guru" | "koordinator";

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  classId: string;
  createdAt: Date;
}

export interface Coordinator {
  id: string;
  uid: string;
  name: string;
  gender: Gender;
  classId: string;
  createdAt: Date;
}

export interface Class {
  id: string;
  name: string;
  grade: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  gender: Gender;
  prayerType: PrayerType;
  presentStudents: string[];
}

export interface AttendanceStats {
  studentId: string;
  studentName: string;
  totalPrayers: number;
  attended: number;
  percentage: number;
}
```

**Step 2: Create utils**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

export function getPrayersForDay(gender: Gender, date: Date): PrayerType[] {
  const day = date.getDay();
  const isFriday = day === 5;

  if (gender === "ikhwan") {
    if (isFriday) return ["jumat", "ashar"];
    return ["zuhur", "ashar"];
  }
  return ["zuhur", "ashar"];
}
```

**Step 3: Commit**

```bash
git add src/types/ src/lib/utils.ts src/components/ui/
git commit -m "feat: add TypeScript types and utility functions"
```

---

## Authentication System

### Task 4: Create Auth Context and Hook

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/hooks/useAuth.ts`
- Create: `src/components/auth/ProtectedRoute.tsx`

**Step 1: Create AuthContext**

```typescript
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

**Step 2: Create ProtectedRoute**

```typescript
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return null;
  return <>{children}</>;
}
```

**Step 3: Commit**

```bash
git add src/contexts/ src/hooks/ src/components/auth/
git commit -m "feat: add authentication context and protected routes"
```

---

### Task 5: Create Login Page

**Files:**
- Create: `app/login/page.tsx`
- Modify: `app/layout.tsx` (add AuthProvider)

**Step 1: Create login page**

```typescript
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError("Email atau password salah");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Absen Sholat</CardTitle>
          <p className="text-sm text-gray-500">SMP PGII 1 Bandung</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/login/
git commit -m "feat: add login page"
```

---

## Dashboard Layout

### Task 6: Create Dashboard Layout and Navigation

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/dashboard/layout.tsx`
- Create: `app/dashboard/page.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Header.tsx`

**Step 1: Update root layout**

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Absen Sholat - SMP PGII 1 Bandung",
  description: "Aplikasi absensi ibadah sekolah",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

**Step 2: Create dashboard layout**

```typescript
"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

**Step 3: Create sidebar component**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, ClipboardCheck, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Siswa", icon: Users },
  { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-white shadow-md hidden md:block">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-green-600">Absen Sholat</h1>
        <p className="text-xs text-gray-500">SMP PGII 1 Bandung</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-green-100 text-green-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="absolute bottom-0 w-full p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg w-full"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
```

**Step 4: Create header component**

```typescript
"use client";

import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Selamat Datang</h2>
        <div className="text-sm text-gray-500">
          {user?.email}
        </div>
      </div>
    </header>
  );
}
```

**Step 5: Commit**

```bash
git add app/dashboard/ src/components/layout/
git commit -m "feat: add dashboard layout with sidebar and header"
```

---

## Data Management (Guru Features)

### Task 7: Student Management CRUD

**Files:**
- Create: `src/lib/db/students.ts`
- Create: `app/dashboard/students/page.tsx`
- Create: `app/dashboard/students/components/StudentForm.tsx`
- Create: `app/dashboard/students/components/StudentList.tsx`

**Step 1: Create students DB functions**

```typescript
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
import { db } from "@/lib/firebase/db";
import { Student } from "@/types";

const STUDENTS_COLLECTION = "students";

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  const q = query(collection(db, STUDENTS_COLLECTION), where("classId", "==", classId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Student));
}

export async function addStudent(student: Omit<Student, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), student);
  return docRef.id;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  await updateDoc(doc(db, STUDENTS_COLLECTION, id), data);
}

export async function deleteStudent(id: string): Promise<void> {
  await deleteDoc(doc(db, STUDENTS_COLLECTION, id));
}
```

**Step 2: Create student list component**

```typescript
"use client";

import { Student } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

export function StudentList({ students, onEdit, onDelete }: StudentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Siswa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-gray-500">
                  {student.gender === "ikhwan" ? "Ikhwan" : "Akhwat"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(student)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(student.id)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              Belum ada siswa di kelas ini
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Create student form component**

```typescript
"use client";

import { useState } from "react";
import { Student, Gender } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentFormProps {
  student?: Student;
  onSubmit: (data: Omit<Student, "id" | "createdAt">) => void;
  onCancel: () => void;
}

export function StudentForm({ student, onSubmit, onCancel }: StudentFormProps) {
  const [name, setName] = useState(student?.name || "");
  const [gender, setGender] = useState<Gender>(student?.gender || "ikhwan");
  const [classId, setClassId] = useState(student?.classId || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, gender, classId });
    setName("");
    setGender("ikhwan");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{student ? "Edit Siswa" : "Tambah Siswa"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Siswa</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="gender">Jenis Kelamin</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ikhwan">Ikhwan</SelectItem>
                <SelectItem value="akhwat">Akhwat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit">{student ? "Update" : "Tambah"}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Commit**

```bash
git add src/lib/db/ app/dashboard/students/
git commit -m "feat: add student management CRUD operations"
```

---

### Task 8: Coordinator Management

**Files:**
- Create: `src/lib/db/coordinators.ts`
- Create: `app/dashboard/coordinators/page.tsx`
- Create: `app/dashboard/coordinators/components/CoordinatorForm.tsx`

**Step 1: Create coordinators DB functions**

```typescript
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/db";
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
  const docRef = await addDoc(collection(db, COORDINATORS_COLLECTION), coordinator);
  return docRef.id;
}

export async function deleteCoordinator(id: string): Promise<void> {
  await deleteDoc(doc(db, COORDINATORS_COLLECTION, id));
}
```

**Step 2: Commit**

```bash
git add src/lib/db/coordinators.ts app/dashboard/coordinators/
git commit -m "feat: add coordinator management"
```

---

## Attendance Recording (Coordinator Features)

### Task 9: Attendance Recording System

**Files:**
- Create: `src/lib/db/attendance.ts`
- Create: `app/dashboard/attendance/page.tsx`
- Create: `app/dashboard/attendance/components/AttendanceRecorder.tsx`
- Create: `app/dashboard/attendance/components/AttendanceList.tsx`

**Step 1: Create attendance DB functions**

```typescript
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/db";
import { AttendanceRecord } from "@/types";

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
    if (!data.presentStudents.includes(studentId)) {
      await updateDoc(docRef, {
        presentStudents: arrayUnion(studentId),
      });
    }
  } else {
    await addDoc(collection(db, ATTENDANCE_COLLECTION), {
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
```

**Step 2: Create attendance recorder component**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Student } from "@/types";
import { getStudentsByClass } from "@/lib/db/students";
import { markPresent, markAbsent } from "@/lib/db/attendance";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrayersForDay } from "@/lib/utils";

interface AttendanceRecorderProps {
  classId: string;
  gender: "ikhwan" | "akhwat";
  date: string;
}

export function AttendanceRecorder({ classId, gender, date }: AttendanceRecorderProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [selectedPrayer, setSelectedPrayer] = useState<string>("zuhur");
  const [saving, setSaving] = useState(false);

  const prayers = getPrayersForDay(gender, new Date(date));

  useEffect(() => {
    loadStudents();
  }, [classId]);

  useEffect(() => {
    loadAttendance();
  }, [classId, gender, date, selectedPrayer]);

  const loadStudents = async () => {
    const data = await getStudentsByClass(classId);
    setStudents(data);
  };

  const loadAttendance = async () => {
    const prayerType = selectedPrayer as "zuhur" | "ashar" | "jumat";
    const present = await getAttendance(date, classId, gender, prayerType);
    setPresentIds(new Set(present));
  };

  const handleToggle = async (studentId: string, checked: boolean) => {
    const prayerType = selectedPrayer as "zuhur" | "ashar" | "jumat";
    if (checked) {
      await markPresent(date, classId, gender, prayerType, studentId);
      setPresentIds((prev) => new Set([...prev, studentId]));
    } else {
      await markAbsent(date, classId, gender, prayerType, studentId);
      setPresentIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Absensi Sholat {selectedPrayer.charAt(0).toUpperCase() + selectedPrayer.slice(1)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {prayers.map((prayer) => (
            <Button
              key={prayer}
              variant={selectedPrayer === prayer ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPrayer(prayer)}
            >
              {prayer === "jumat" ? "Jum'at" : prayer.charAt(0).toUpperCase() + prayer.slice(1)}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium">{student.name}</span>
              <Checkbox
                checked={presentIds.has(student.id)}
                onCheckedChange={(checked) => handleToggle(student.id, !!checked)}
              />
            </div>
          ))}
          {students.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              Belum ada siswa di kelas ini
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Commit**

```bash
git add src/lib/db/attendance.ts app/dashboard/attendance/
git commit -m "feat: add attendance recording system"
```

---

## Reports and Grading

### Task 10: Attendance Reports with Auto-Grading

**Files:**
- Create: `src/lib/db/reports.ts`
- Create: `app/dashboard/reports/page.tsx`
- Create: `app/dashboard/reports/components/AttendanceStats.tsx`

**Step 1: Create reports DB functions**

```typescript
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/db";
import { AttendanceStats, Student } from "@/types";

const ATTENDANCE_COLLECTION = "attendance";

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export async function getAttendanceStats(
  classId: string,
  gender: string,
  year: number,
  month: number
): Promise<AttendanceStats[]> {
  const { start, end } = getMonthRange(year, month);

  const studentsQuery = query(
    collection(db, "students"),
    where("classId", "==", classId)
  );
  const studentsSnapshot = await getDocs(studentsQuery);
  const students = studentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Student[];

  const attendanceQuery = query(
    collection(db, ATTENDANCE_COLLECTION),
    where("date", ">=", start),
    where("date", "<=", end)
  );
  const attendanceSnapshot = await getDocs(attendanceQuery);
  const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data());

  const stats: AttendanceStats[] = students.map((student) => {
    let totalPrayers = 0;
    let attended = 0;

    attendanceRecords.forEach((record) => {
      if (record.classId === classId && record.gender === gender) {
        const recordDate = new Date(record.date);
        const day = recordDate.getDay();
        const isFriday = day === 5;

        let prayersThisDay = 0;
        if (gender === "ikhwan") {
          prayersThisDay = isFriday ? 2 : 2;
        } else {
          prayersThisDay = 2;
        }

        totalPrayers += prayersThisDay;

        if (record.presentStudents.includes(student.id)) {
          attended += prayersThisDay;
        }
      }
    });

    const percentage = totalPrayers > 0 ? Math.round((attended / totalPrayers) * 100) : 0;

    return {
      studentId: student.id,
      studentName: student.name,
      totalPrayers,
      attended,
      percentage,
    };
  });

  return stats.sort((a, b) => b.percentage - a.percentage);
}
```

**Step 2: Create stats component**

```typescript
"use client";

import { AttendanceStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AttendanceStatsProps {
  stats: AttendanceStats[];
}

export function AttendanceStatsTable({ stats }: AttendanceStatsProps) {
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "E";
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    if (percentage >= 60) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rekap Kehadiran</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="text-center">Hadir</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">%</TableHead>
              <TableHead className="text-center">Nilai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => (
              <TableRow key={stat.studentId}>
                <TableCell>{stat.studentName}</TableCell>
                <TableCell className="text-center">{stat.attended}</TableCell>
                <TableCell className="text-center">{stat.totalPrayers}</TableCell>
                <TableCell className="text-center">{stat.percentage}%</TableCell>
                <TableCell className={`text-center font-bold ${getGradeColor(stat.percentage)}`}>
                  {getGrade(stat.percentage)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {stats.length === 0 && (
          <p className="text-center text-gray-500 py-4">Belum ada data kehadiran</p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 3: Commit**

```bash
git add src/lib/db/reports.ts app/dashboard/reports/
git commit -m "feat: add attendance reports with auto-grading"
```

---

## PWA Configuration

### Task 11: PWA Manifest and Service Worker

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Modify: `next.config.js`

**Step 1: Create manifest.json**

```json
{
  "name": "Absen Sholat",
  "short_name": "AbsenSholat",
  "description": "Aplikasi absensi ibadah sekolah - SMP PGII 1 Bandung",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Step 2: Update next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**Step 3: Commit**

```bash
git add public/ next.config.js
git commit -m "feat: add PWA configuration"
```

---

## Final Integration

### Task 12: Firebase Security Rules

**Files:**
- Create: `firestore.rules`
- Create: `firestore.indexes.json`

**Step 1: Create firestore.rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    function isGuru() {
      return isAuthenticated() && request.auth.token.email.matches('.*@guru\\.pgii\\.sch\\.id$');
    }
    function isCoordinator() {
      return isAuthenticated() && request.auth.token.email.matches('.*@koordinator\\.pgii\\.sch\\.id$');
    }

    // Students collection
    match /students/{studentId} {
      allow read: if isAuthenticated();
      allow write: if isGuru();
    }

    // Coordinators collection
    match /coordinators/{coordinatorId} {
      allow read: if isAuthenticated();
      allow write: if isGuru();
    }

    // Attendance collection
    match /attendance/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isGuru() || isCoordinator();
    }
  }
}
```

**Step 2: Commit**

```bash
git add firestore.rules firestore.indexes.json
git commit -m "feat: add Firebase security rules"
```

---

## Summary

This plan covers:
1. Next.js project setup with Firebase
2. Authentication with RBAC (Guru/Koordinator)
3. Student management (CRUD)
4. Coordinator delegation
5. Attendance recording by prayer type and gender
6. Auto-grading based on attendance percentage
7. PWA configuration for mobile-first experience
8. Firebase security rules

**Total Tasks:** 12

---

**Plan complete and saved to `docs/plans/2026-01-23-absen-sholat-implementation.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
