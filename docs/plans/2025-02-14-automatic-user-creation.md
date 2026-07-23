# Automatic User Account Creation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automate the coordinator and supervisor adding forms so that they take Email and Password, and automatically create a Firebase Auth account using Firebase Admin SDK server actions instead of requiring manual UID copying.

**Architecture:**
- Create `src/app/actions/supervisor.ts` server action for supervisor user creation.
- Modify `src/app/dashboard/coordinators/components/CoordinatorForm.tsx` to collect Email and Password instead of UID.
- Modify `src/app/dashboard/coordinators/components/CoordinatorsList.tsx` to call `createCoordinatorAccount` server action on submit.
- Modify `src/app/dashboard/supervisors/components/SupervisorForm.tsx` to collect Email and Password instead of UID.
- Modify `src/app/dashboard/supervisors/components/SupervisorsList.tsx` to call `createSupervisorAccount` server action on submit.

**Tech Stack:** React, Next.js App Router (Server Actions), Firebase Admin SDK.

---

### Task 1: Create Supervisor Server Action

**Files:**
- Create: `src/app/actions/supervisor.ts`

**Step 1: Write minimal implementation**
Create `src/app/actions/supervisor.ts`:
```typescript
"use server";

import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function createSupervisorAccount(data: {
  name: string;
  email: string;
  password: string;
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
      uid: userRecord.uid,
      createdAt: new Date(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error('Error creating supervisor:', error);
    return { success: false, error: error.message || 'Gagal membuat akun pembina' };
  }
}
```

**Step 2: Commit**
```bash
git add src/app/actions/supervisor.ts
git commit -m "feat: add createSupervisorAccount server action"
```

---

### Task 2: Update Coordinator Form and List Components

**Files:**
- Modify: `src/app/dashboard/coordinators/components/CoordinatorForm.tsx`
- Modify: `src/app/dashboard/coordinators/components/CoordinatorsList.tsx`

**Step 1: Update CoordinatorForm.tsx**
Modify `src/app/dashboard/coordinators/components/CoordinatorForm.tsx` to collect Email and Password:
1. Add state variables for `email` and `password`. Remove state for `uid`.
2. Update inputs to render Email and Password fields.
3. Update `onSubmit` signature in `CoordinatorFormProps`:
   ```typescript
   interface CoordinatorFormProps {
     onSubmit: (data: {
       name: string;
       email: string;
       password: string;
       classId: string;
       gender: Gender;
     }) => Promise<boolean | void>;
     isLoading?: boolean;
     error?: string | null;
   }
   ```
4. Update `handleSubmit` to call `onSubmit({ name, email, password, classId, gender })`.

**Step 2: Update CoordinatorsList.tsx**
Modify `src/app/dashboard/coordinators/components/CoordinatorsList.tsx` to call the `createCoordinatorAccount` server action:
1. Import `createCoordinatorAccount` from `@/app/actions/coordinator`.
2. Update `handleAdd` function:
   ```typescript
   const handleAdd = async (data: {
     name: string;
     email: string;
     password: string;
     classId: string;
     gender: Gender;
   }) => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await createCoordinatorAccount(data);
       if (result.success && result.uid) {
         const newCoord: Coordinator = {
           name: data.name,
           uid: result.uid,
           classId: data.classId,
           gender: data.gender,
           id: result.uid,
           createdAt: new Date(),
         };
         setCoordinators([...coordinators, newCoord]);
         setIsFormOpen(false);
         return true;
       } else {
         setError(result.error || "Gagal membuat akun koordinator");
         return false;
       }
     } catch (err: any) {
       console.error("Failed to add coordinator", err);
       setError("Gagal membuat akun koordinator. Silakan coba lagi.");
       return false;
     } finally {
       setIsLoading(false);
     }
   };
   ```

**Step 3: Commit**
```bash
git add src/app/dashboard/coordinators/components/CoordinatorForm.tsx src/app/dashboard/coordinators/components/CoordinatorsList.tsx
git commit -m "feat: automate coordinator creation with email and password"
```

---

### Task 3: Update Supervisor Form and List Components

**Files:**
- Modify: `src/app/dashboard/supervisors/components/SupervisorForm.tsx`
- Modify: `src/app/dashboard/supervisors/components/SupervisorsList.tsx`

**Step 1: Update SupervisorForm.tsx**
Modify `src/app/dashboard/supervisors/components/SupervisorForm.tsx` to collect Email and Password:
1. Add state variables for `email` and `password`. Remove state for `uid`.
2. Update inputs to render Email and Password fields.
3. Update `onSubmit` signature in `SupervisorFormProps`:
   ```typescript
   interface SupervisorFormProps {
     onSubmit: (data: {
       name: string;
       email: string;
       password: string;
     }) => Promise<boolean | void>;
     isLoading?: boolean;
     error?: string | null;
   }
   ```
4. Update `handleSubmit` to call `onSubmit({ name, email, password })`.

**Step 2: Update SupervisorsList.tsx**
Modify `src/app/dashboard/supervisors/components/SupervisorsList.tsx` to call the `createSupervisorAccount` server action:
1. Import `createSupervisorAccount` from `@/app/actions/supervisor`.
2. Update `handleAdd` function:
   ```typescript
   const handleAdd = async (data: {
     name: string;
     email: string;
     password: string;
   }) => {
     setIsLoading(true);
     setError(null);
     try {
       const result = await createSupervisorAccount(data);
       if (result.success && result.uid) {
         const newSup: Supervisor = {
           name: data.name,
           uid: result.uid,
           id: result.uid,
           createdAt: new Date(),
         };
         setSupervisors([...supervisors, newSup]);
         setIsFormOpen(false);
         return true;
       } else {
         setError(result.error || "Gagal membuat akun pembina");
         return false;
       }
     } catch (err: any) {
       console.error("Failed to add supervisor", err);
       setError("Gagal membuat akun pembina. Silakan coba lagi.");
       return false;
     } finally {
       setIsLoading(false);
     }
   };
   ```

**Step 3: Commit**
```bash
git add src/app/dashboard/supervisors/components/SupervisorForm.tsx src/app/dashboard/supervisors/components/SupervisorsList.tsx
git commit -m "feat: automate supervisor creation with email and password"
```

---

### Task 4: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit.
