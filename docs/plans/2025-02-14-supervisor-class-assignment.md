# Supervisor Class Assignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow Admins to assign multiple classes to a supervisor, and filter the supervisor's dashboard, attendance, and reports views to only show data for their assigned classes.

**Architecture:**
- DB & Types: Add `classes: string[]` to `Supervisor` interface in `src/types/index.ts`.
- Server Action: Update `createSupervisorAccount` in `src/app/actions/supervisor.ts` to accept and save `classes: string[]`.
- DB Test: Update `src/lib/db/supervisors.test.ts` to reflect the updated schema and mock.
- Admin UI:
  - Update `SupervisorForm.tsx` to display a checkboxes layout for `AVAILABLE_CLASSES`.
  - Update `SupervisorsList.tsx` to list assigned classes.
- Filtering Logic:
  - Dashboard: If user is supervisor, fetch profile, compute "Siswa Binaan" count (students in assigned classes), check missing attendance for assigned classes, and show recent activity for assigned classes.
  - Attendance Page: If user is supervisor, fetch profile, filter classes dropdown to only show assigned classes, and default select the first one.
  - Reports Page: If user is supervisor, fetch profile, filter classes dropdown to only show assigned classes, and default select the first one.

**Tech Stack:** React, Tailwind CSS, Lucide icons, Firebase Firestore, Vitest.

---

### Task 1: Update Types, Server Action, and DB Tests

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/app/actions/supervisor.ts`
- Modify: `src/lib/db/supervisors.test.ts`

**Step 1: Update `src/types/index.ts`**
Update `Supervisor` interface:
```typescript
export interface Supervisor {
  id: string;
  uid: string;
  name: string;
  classes: string[]; // Assigned classes
  createdAt: Date;
}
```

**Step 2: Update `src/app/actions/supervisor.ts`**
Update `createSupervisorAccount`:
```typescript
export async function createSupervisorAccount(data: {
  name: string;
  email: string;
  password: string;
  classes: string[];
}) {
  try {
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    await adminDb.collection('supervisors').doc(userRecord.uid).set({
      name: data.name,
      uid: userRecord.uid,
      classes: data.classes,
      createdAt: new Date(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error('Error creating supervisor:', error);
    return { success: false, error: error.message || 'Gagal membuat akun pembina' };
  }
}
```

**Step 3: Update `src/lib/db/supervisors.test.ts`**
Modify test mock and additions to match `classes` field.
Run: `npx vitest run src/lib/db/supervisors.test.ts`
Expected: PASS

**Step 4: Commit**
```bash
git add src/types/index.ts src/app/actions/supervisor.ts src/lib/db/supervisors.test.ts
git commit -m "feat: add classes field to supervisor data type and creation action"
```

---

### Task 2: Update Admin Supervisors Management UI

**Files:**
- Modify: `src/app/dashboard/supervisors/components/SupervisorForm.tsx`
- Modify: `src/app/dashboard/supervisors/components/SupervisorsList.tsx`

**Step 1: Update SupervisorForm.tsx**
1. Import `AVAILABLE_CLASSES` and `Checkbox`:
   ```typescript
   import { AVAILABLE_CLASSES } from "@/lib/constants";
   import { Checkbox } from "@/components/ui/checkbox";
   ```
2. Update state:
   ```typescript
   const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
   ```
3. Update `onSubmit` signature:
   ```typescript
   interface SupervisorFormProps {
     onSubmit: (data: {
       name: string;
       email: string;
       password: string;
       classes: string[];
     }) => Promise<boolean | void>;
     isLoading?: boolean;
     error?: string | null;
   }
   ```
4. Render check-grid of classes:
   ```tsx
   <div className="space-y-2">
     <Label>Kelas Binaan</Label>
     <div className="grid grid-cols-2 gap-3 p-3 border border-emerald-100 rounded-xl bg-gray-50/50">
       {AVAILABLE_CLASSES.map((cls) => (
         <div key={cls.id} className="flex items-center gap-2">
           <Checkbox
             id={`class-${cls.id}`}
             checked={selectedClasses.includes(cls.id)}
             onCheckedChange={(checked) => {
               if (checked) {
                 setSelectedClasses([...selectedClasses, cls.id]);
               } else {
                 setSelectedClasses(selectedClasses.filter((c) => c !== cls.id));
               }
             }}
             className="border-emerald-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded-md"
           />
           <label htmlFor={`class-${cls.id}`} className="text-sm font-medium text-gray-700 cursor-pointer select-none">
             {cls.name}
           </label>
         </div>
       ))}
     </div>
   </div>
   ```
5. Pass `classes: selectedClasses` to `onSubmit`. Clear `selectedClasses` on success.

**Step 2: Update SupervisorsList.tsx**
1. Add "Kelas Binaan" column in the table head and body.
2. In body row:
   ```tsx
   <TableCell className="max-w-[200px] truncate">
     {supervisor.classes && supervisor.classes.length > 0
       ? supervisor.classes.map(cId => AVAILABLE_CLASSES.find(c => c.id === cId)?.name || cId).join(", ")
       : "Belum ada kelas"}
   </TableCell>
   ```

**Step 3: Commit**
```bash
git add src/app/dashboard/supervisors/components/SupervisorForm.tsx src/app/dashboard/supervisors/components/SupervisorsList.tsx
git commit -m "feat: implement class selection in SupervisorForm and list view"
```

---

### Task 3: Filter Supervisor Dashboard View

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Write implementation**
Update `src/app/dashboard/page.tsx`:
1. In `loadDashboardData` for `supervisor` role:
   - Load supervisor profile:
     ```typescript
     const supervisorDoc = await getDoc(doc(db, "supervisors", user.uid));
     if (supervisorDoc.exists()) {
       const supervisorData = supervisorDoc.data() as Supervisor;
       const assignedClasses = supervisorData.classes || [];
       
       // a) Filtered students count (students in assigned classes)
       if (assignedClasses.length > 0) {
         const studentsQuery = query(
           collection(db, "students"),
           where("classId", "in", assignedClasses)
         );
         const studentsSnap = await getDocs(studentsQuery);
         setTotalStudents(studentsSnap.size);
       } else {
         setTotalStudents(0);
       }

       // b) Fetch recent activities for assigned classes
       if (assignedClasses.length > 0) {
         try {
           const q = query(
             collection(db, "attendance"),
             where("classId", "in", assignedClasses),
             orderBy("updatedAt", "desc"),
             limit(5)
           );
           const snap = await getDocs(q);
           setRecentActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecentActivity)));
         } catch (e) {
           const fallbackQ = query(collection(db, "attendance"), where("classId", "in", assignedClasses), limit(20));
           const snap = await getDocs(fallbackQ);
           const sorted = snap.docs
             .map(doc => ({ id: doc.id, ...doc.data() } as RecentActivity))
             .filter(a => a.updatedAt)
             .sort((a, b) => {
               const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt).getTime();
               const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt).getTime();
               return timeB - timeA;
             })
             .slice(0, 5);
           setRecentActivities(sorted);
         }
       } else {
         setRecentActivities([]);
       }

       // c) Today's missing attendance monitor for assigned classes
       const todayStr = format(new Date(), "yyyy-MM-dd");
       const attendanceSnap = await getDocs(query(collection(db, "attendance"), where("date", "==", todayStr)));
       const presentRecords = new Set(attendanceSnap.docs.map(doc => doc.id));
       const missingList: MissingAttendanceToday[] = [];

       assignedClasses.forEach(classId => {
         const cls = AVAILABLE_CLASSES.find(c => c.id === classId);
         if (cls) {
           (["ikhwan", "akhwat"] as const).forEach(gender => {
             const expectedPrayers = getPrayersForDay(gender, new Date());
             expectedPrayers.forEach(prayer => {
               const docId = `${todayStr}_${cls.id}_${gender}_${prayer}`;
               if (!presentRecords.has(docId)) {
                 missingList.push({ classId: cls.id, gender, prayer });
               }
             });
           });
         }
       });
       setMissingToday(missingList);
     }
     ```
2. Update the card label on stats for Supervisor:
   - Display "Total Siswa Binaan" instead of "Total Siswa" if the role is supervisor:
     ```tsx
     {role === "supervisor" ? "Siswa Binaan" : "Total Siswa"}
     ```

**Step 2: Commit**
```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: filter supervisor dashboard stats and monitors by assigned classes"
```

---

### Task 4: Filter Supervisor Classes in Attendance and Reports Pages

**Files:**
- Modify: `src/app/dashboard/attendance/page.tsx`
- Modify: `src/app/dashboard/reports/page.tsx`

**Step 1: Update Attendance Page (`src/app/dashboard/attendance/page.tsx`)**
1. Add state variable:
   ```typescript
   const [supervisorClasses, setSupervisorClasses] = useState<string[]>([]);
   ```
2. In `checkRoleAndProfile` inside `supervisorDoc.exists()`:
   ```typescript
   const supervisorData = supervisorDoc.data() as Supervisor;
   const assignedClasses = supervisorData.classes || [];
   setSupervisorClasses(assignedClasses);
   if (assignedClasses.length > 0) {
     setClassId(assignedClasses[0]); // default to first class
   }
   setIsAdmin(true); // Treat as admin view-wise (but select dropdown is filtered)
   ```
3. Update Class Select Dropdown rendering:
   - Filter `AVAILABLE_CLASSES` list if not admin:
     - Wait, if `isAdmin` is true, it renders the select dropdown. We should check if they are a supervisor vs absolute admin:
     - We can check if `supervisorClasses.length > 0` (which is true for supervisors, and false for absolute admins).
     - Filter `AVAILABLE_CLASSES` in the select dropdown:
       ```typescript
       const filteredClassesForSelect = supervisorClasses.length > 0
         ? AVAILABLE_CLASSES.filter(c => supervisorClasses.includes(c.id))
         : AVAILABLE_CLASSES;
       ```
     - Map over `filteredClassesForSelect` in the selector.

**Step 2: Update Reports Page (`src/app/dashboard/reports/page.tsx`)**
1. Add state:
   ```typescript
   const [supervisorClasses, setSupervisorClasses] = useState<string[]>([]);
   ```
2. In `checkRoleAndProfile` inside `supervisorDoc.exists()`:
   ```typescript
   const supervisorData = supervisorDoc.data() as Supervisor;
   const assignedClasses = supervisorData.classes || [];
   setSupervisorClasses(assignedClasses);
   if (assignedClasses.length > 0) {
     setClassId(assignedClasses[0]); // default select first
   }
   setIsAdmin(true);
   ```
3. Update Class Select Dropdown rendering:
   - Filter classes using `supervisorClasses`:
     ```typescript
     const filteredClassesForSelect = supervisorClasses.length > 0
       ? AVAILABLE_CLASSES.filter(c => supervisorClasses.includes(c.id))
       : AVAILABLE_CLASSES;
     ```
   - Map over `filteredClassesForSelect` in the selector.

**Step 3: Commit**
```bash
git add src/app/dashboard/attendance/page.tsx src/app/dashboard/reports/page.tsx
git commit -m "feat: filter supervisor class dropdowns by assigned classes"
```

---

### Task 5: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit.
