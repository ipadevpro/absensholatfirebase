# Supervisor Role Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a new "Pembina/Pembimbing" (supervisor) role that can monitor attendance and view/download reports for all classes, along with an Admin management panel.

**Architecture:**
- DB/Types: Define `Supervisor` type, extend `UserRole` to include `"supervisor"`, and create `supervisors.ts` helper with test.
- Auth: Modify `AuthContext.tsx` to check the `"supervisors"` Firestore collection to assign the `"supervisor"` role.
- Nav: Extend `Sidebar.tsx` and `MobileNav.tsx` to show `/dashboard/supervisors` link only for admin, and permit `/dashboard`, `/attendance`, and `/reports` routes for supervisor.
- Pages: 
  - Update Dashboard, Attendance, and Reports pages to support the `supervisor` role (granting supervisor the same view/edit/export access as admin for attendance/reports).
  - Create the `/dashboard/supervisors` page for Admin to manage supervisor records.

**Tech Stack:** React, Next.js App Router, Tailwind CSS, Firebase Firestore.

---

### Task 1: Update Types and Implement Database Layer

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/db/supervisors.ts`
- Create: `src/lib/db/supervisors.test.ts`

**Step 1: Update `src/types/index.ts`**
Change `UserRole` and add `Supervisor` interface:
```typescript
export type UserRole = "admin" | "coordinator" | "supervisor" | null;

export interface Supervisor {
  id: string;
  uid: string;
  name: string;
  createdAt: Date;
}
```

**Step 2: Create failing test for database layer**
Create `src/lib/db/supervisors.test.ts` with tests for supervisor operations.
```typescript
import { vi, describe, it, expect } from 'vitest';
import { getAllSupervisors, addSupervisor, deleteSupervisor } from './supervisors';
import { getDocs, setDoc, deleteDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  const mockGetDocs = vi.fn(() => ({
    docs: [
      { id: '1', data: () => ({ name: 'Supervisor A', uid: 'uid-a' }) }
    ]
  }));
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    getDocs: mockGetDocs,
    setDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn((db, col, id) => `doc-${id}` as any),
  };
});

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('Supervisor DB helpers', () => {
  it('should fetch all supervisors', async () => {
    const list = await getAllSupervisors();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Supervisor A');
  });
});
```

**Step 3: Run test to verify it fails**
Run: `npx vitest run src/lib/db/supervisors.test.ts`
Expected: FAIL (files/functions do not exist yet)

**Step 4: Write minimal implementation**
Create `src/lib/db/supervisors.ts`:
```typescript
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
```

**Step 5: Run test to verify it passes**
Run: `npx vitest run src/lib/db/supervisors.test.ts`
Expected: PASS

**Step 6: Commit**
```bash
git add src/types/index.ts src/lib/db/supervisors.ts src/lib/db/supervisors.test.ts
git commit -m "feat: add supervisor type and db helper functions with tests"
```

---

### Task 2: Update Auth Context

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

**Step 1: Write implementation**
Modify `src/contexts/AuthContext.tsx` to handle `"supervisor"` role resolution.
1. Update `UserRole` definition:
   ```typescript
   export type UserRole = "admin" | "coordinator" | "supervisor" | null;
   ```
2. In `useEffect` on auth state change:
   ```typescript
        try {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (adminDoc.exists()) {
            setRole("admin");
          } else {
            const supervisorDoc = await getDoc(doc(db, "supervisors", user.uid));
            if (supervisorDoc.exists()) {
              setRole("supervisor");
            } else {
              const coordDoc = await getDoc(doc(db, "coordinators", user.uid));
              if (coordDoc.exists()) {
                setRole("coordinator");
              } else {
                setRole(null);
              }
            }
          }
        }
   ```

**Step 2: Commit**
```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: resolve supervisor role in AuthContext"
```

---

### Task 3: Update Navigation and Sidebar Layouts

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/MobileNav.tsx`

**Step 1: Update Sidebar.tsx**
1. Add supervisor roles to menu item paths:
   ```typescript
   const allMenuItems = [
     { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "coordinator", "supervisor"] },
     { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, roles: ["admin", "coordinator", "supervisor"] },
     { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, roles: ["admin", "coordinator", "supervisor"] },
     { href: "/dashboard/students", label: "Siswa", icon: Users, roles: ["admin"] },
     { href: "/dashboard/coordinators", label: "Koordinator", icon: UserCog, roles: ["admin"] },
     { href: "/dashboard/supervisors", label: "Pembina", icon: Users2 || UserCog, roles: ["admin"] }, // Use dynamic icon
   ];
   ```
   *Make sure `Users2` or `UserCog` is imported. Import `Users2` from `lucide-react`.*

**Step 2: Update MobileNav.tsx**
1. Update roles arrays in menu items:
   ```typescript
   const allMenuItems = [
     { href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "coordinator", "supervisor"] },
     { href: "/dashboard/attendance", icon: ClipboardCheck, roles: ["admin", "coordinator", "supervisor"] },
     { href: "/dashboard/reports", icon: BarChart3, roles: ["admin", "coordinator", "supervisor"] },
     { href: "/dashboard/students", icon: Users, roles: ["admin"] },
     { href: "/dashboard/coordinators", icon: UserCog, roles: ["admin"] },
   ];
   ```

**Step 3: Commit**
```bash
git add src/components/layout/Sidebar.tsx src/components/layout/MobileNav.tsx
git commit -m "feat: adjust sidebar and mobile nav to support supervisor role"
```

---

### Task 4: Support Supervisor Role in Dashboard, Attendance, and Reports Pages

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/attendance/page.tsx`
- Modify: `src/app/dashboard/reports/page.tsx`

**Step 1: Update Dashboard page.tsx**
1. Define supervisor dashboard links:
   ```typescript
   const supervisorLinks = [
     { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Isi atau monitor absen sholat", color: "text-emerald-600", bg: "bg-emerald-50" },
     { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat rekapan & nilai siswa", color: "text-amber-600", bg: "bg-amber-50" },
   ];
   ```
2. Determine `links` by checking for supervisor role:
   ```typescript
   const links = role === "admin" ? adminLinks : role === "supervisor" ? supervisorLinks : coordLinks;
   ```
3. Update Welcome Message label:
   ```tsx
   role === "coordinator" ? coordinator?.name || "Koordinator" : role === "supervisor" ? "Guru Pembina" : "Guru Admin"
   ```

**Step 2: Update Attendance page.tsx**
1. Add check for supervisor doc to grant `isAdmin` (which controls all class views):
   ```typescript
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          setIsAdmin(true);
        } else {
          const supervisorDoc = await getDoc(doc(db, "supervisors", user.uid));
          if (supervisorDoc.exists()) {
            setIsAdmin(true);
          } else {
            const coordDoc = await getDoc(doc(db, "coordinators", user.uid));
            if (coordDoc.exists()) {
              const coordinatorData = coordDoc.data() as Coordinator;
              setClassId(coordinatorData.classId);
              setGender(coordinatorData.gender);
              setIsAdmin(false);
            } else {
              setError("Profil tidak ditemukan...");
            }
          }
        }
   ```

**Step 3: Update Reports page.tsx**
1. Update check logic to set `isAdmin` to true if the user is a supervisor:
   ```typescript
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          setIsAdmin(true);
        } else {
          const supervisorDoc = await getDoc(doc(db, "supervisors", user.uid));
          if (supervisorDoc.exists()) {
            setIsAdmin(true);
          } else {
            const coordDoc = await getDoc(doc(db, "coordinators", user.uid));
            if (coordDoc.exists()) {
              const data = coordDoc.data() as Coordinator;
              setClassId(data.classId);
              setGender(data.gender);
              setIsAdmin(false);
            }
          }
        }
   ```

**Step 4: Commit**
```bash
git add src/app/dashboard/page.tsx src/app/dashboard/attendance/page.tsx src/app/dashboard/reports/page.tsx
git commit -m "feat: add supervisor support in dashboard, attendance, and reports pages"
```

---

### Task 5: Create Supervisors Management Page & Components

**Files:**
- Create: `src/app/dashboard/supervisors/page.tsx`
- Create: `src/app/dashboard/supervisors/components/SupervisorsList.tsx`
- Create: `src/app/dashboard/supervisors/components/SupervisorForm.tsx`

**Step 1: Create SupervisorForm.tsx**
Create `src/app/dashboard/supervisors/components/SupervisorForm.tsx` similar to `CoordinatorForm.tsx` (without class/gender select fields since supervisor oversees everything):
```tsx
import { useState } from "react";
import { Supervisor } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface SupervisorFormProps {
  onSubmit: (data: Omit<Supervisor, "id" | "createdAt">) => Promise<boolean | void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function SupervisorForm({ onSubmit, isLoading = false, error }: SupervisorFormProps) {
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !uid) return;

    const success = await onSubmit({ name, uid });
    if (success !== false) {
      setName("");
      setUid("");
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Tambah Pembina Baru</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              placeholder="Nama Pembina"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="uid">User ID (UID)</Label>
            <Input
              id="uid"
              placeholder="Firebase Auth UID"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Salin UID dari dashboard Firebase Authentication.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Menambahkan..." : "Tambah Pembina"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

**Step 2: Create SupervisorsList.tsx**
Create `src/app/dashboard/supervisors/components/SupervisorsList.tsx`:
```tsx
import { useState } from "react";
import { Supervisor } from "@/types";
import { addSupervisor, deleteSupervisor } from "@/lib/db/supervisors";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, X, AlertCircle } from "lucide-react";
import SupervisorForm from "./SupervisorForm";

interface SupervisorsListProps {
  initialSupervisors: Supervisor[];
}

export default function SupervisorsList({ initialSupervisors }: SupervisorsListProps) {
  const [supervisors, setSupervisors] = useState<Supervisor[]>(initialSupervisors);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (data: Omit<Supervisor, "id" | "createdAt">) => {
    setIsLoading(true);
    setError(null);
    try {
      const id = await addSupervisor(data);
      const newSup: Supervisor = {
        ...data,
        id,
        createdAt: new Date()
      };
      setSupervisors([...supervisors, newSup]);
      setIsFormOpen(false);
      return true;
    } catch (err) {
      console.error("Failed to add supervisor", err);
      setError("Gagal menambahkan pembina. Silakan coba lagi.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pembina ini?")) return;
    setError(null);
    try {
      await deleteSupervisor(id);
      setSupervisors(supervisors.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete supervisor", err);
      setError("Gagal menghapus pembina. Silakan coba lagi.");
    }
  };

  return (
    <div className="space-y-6">
      {error && !isFormOpen && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div></div>
        <Button 
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setError(null);
          }} 
          variant={isFormOpen ? "secondary" : "default"}
        >
          {isFormOpen ? <><X className="mr-2 h-4 w-4" /> Batal</> : <><Plus className="mr-2 h-4 w-4" /> Tambah Pembina</>}
        </Button>
      </div>

      {isFormOpen && (
        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-200">
          <SupervisorForm onSubmit={handleAdd} isLoading={isLoading} error={error} />
        </div>
      )}

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>UID</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supervisors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                  Belum ada data pembina.
                </TableCell>
              </TableRow>
            ) : (
              supervisors.map((supervisor) => (
                <TableRow key={supervisor.id}>
                  <TableCell className="font-medium">{supervisor.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{supervisor.uid}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(supervisor.id)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      title="Hapus Pembina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

**Step 3: Create page.tsx**
Create `src/app/dashboard/supervisors/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { getAllSupervisors } from "@/lib/db/supervisors";
import SupervisorsList from "./components/SupervisorsList";
import { useAuth } from "@/contexts/AuthContext";
import { Supervisor } from "@/types";
import { Loader2 } from "lucide-react";

export default function SupervisorsPage() {
  const { role, loading: authLoading } = useAuth();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "admin") {
      fetchSupervisors();
    }
  }, [role]);

  const fetchSupervisors = async () => {
    try {
      const data = await getAllSupervisors();
      setSupervisors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  if (role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center text-center p-12">
        <div className="bg-red-50 text-red-600 p-8 rounded-xl border border-red-100 max-w-md">
          <h2 className="text-xl font-bold mb-2">Akses Terbatas</h2>
          <p>Maaf, halaman ini hanya dapat diakses oleh Admin (Guru).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pembina / Pembimbing</h1>
        <p className="text-muted-foreground mt-2">
          Kelola akun guru pembina/pembimbing absensi sholat.
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <SupervisorsList initialSupervisors={supervisors} />
      )}
    </div>
  );
}
```

**Step 4: Commit**
```bash
git add src/app/dashboard/supervisors/page.tsx src/app/dashboard/supervisors/components/SupervisorsList.tsx src/app/dashboard/supervisors/components/SupervisorForm.tsx
git commit -m "feat: add supervisors management page and components"
```

---

### Task 6: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to ensure all tests (including supervisor db tests) pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit.
