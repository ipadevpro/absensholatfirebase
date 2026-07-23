# Attendance Start Date Configuration & Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a settings document in Firestore to store the attendance start date, add an Admin settings panel card on the dashboard, and synchronize warning calculations so they ignore days prior to this date.

**Architecture:**
- DB: Create `src/lib/db/settings.ts` with `getAttendanceStartDate` and `updateAttendanceStartDate` functions. Add tests in `src/lib/db/settings.test.ts`.
- Dashboard UI: Modify `src/app/dashboard/page.tsx` to display the "Settings" card for admins, allowing them to load, modify, and save the attendance start date.
- Sync Logic:
  - In `src/app/dashboard/page.tsx` (coordinator path), fetch `startDate` and skip missing checks for days before it.
  - In `src/app/dashboard/attendance/page.tsx`, fetch `startDate` and skip missing checks for days before it.

**Tech Stack:** React, Next.js, Firebase Firestore, Vitest.

---

### Task 1: Create Settings Database Layer & Tests

**Files:**
- Create: `src/lib/db/settings.ts`
- Create: `src/lib/db/settings.test.ts`

**Step 1: Create failing test**
Create `src/lib/db/settings.test.ts`:
```typescript
import { vi, describe, it, expect } from 'vitest';
import { getAttendanceStartDate, updateAttendanceStartDate } from './settings';
import { getDoc, setDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  const mockGetDoc = vi.fn(() => ({
    exists: () => true,
    data: () => ({ startDate: '2025-02-10' })
  }));
  const mockSetDoc = vi.fn();
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn((db, col, id) => `doc-${id}` as any),
    getDoc: mockGetDoc,
    setDoc: mockSetDoc,
  };
});

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('Settings DB helpers', () => {
  it('should fetch start date setting', async () => {
    const date = await getAttendanceStartDate();
    expect(date).toBe('2025-02-10');
    expect(getDoc).toHaveBeenCalled();
  });

  it('should update start date setting', async () => {
    await updateAttendanceStartDate('2025-02-15');
    expect(setDoc).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/lib/db/settings.test.ts`
Expected: FAIL (helper file does not exist yet)

**Step 3: Write minimal implementation**
Create `src/lib/db/settings.ts`:
```typescript
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
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/lib/db/settings.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/lib/db/settings.ts src/lib/db/settings.test.ts
git commit -m "feat: add settings db helpers and unit tests"
```

---

### Task 2: Implement Admin Dashboard UI for Start Date & Coordinator Warning Sync

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Write implementation**
1. Import `getAttendanceStartDate` and `updateAttendanceStartDate` from `@/lib/db/settings`.
2. Add state variable `startDate` in `DashboardPage`:
   ```typescript
   const [attendanceStartDate, setAttendanceStartDate] = useState<string>("");
   const [isSavingSettings, setIsSavingSettings] = useState(false);
   ```
3. Load `startDate` inside `loadDashboardData`:
   - Fetch `getAttendanceStartDate()` and store in `attendanceStartDate`.
4. Apply the date restriction to the coordinator's warning loop (in `loadDashboardData`):
   ```typescript
   const startDateStr = await getAttendanceStartDate();
   setAttendanceStartDate(startDateStr || "");
   // ...
   for (let i = 0; i < 5; i++) {
     const date = subDays(today, i);
     if (isWeekend(date)) continue;

     const dateStr = format(date, "yyyy-MM-dd");
     if (startDateStr && dateStr < startDateStr) continue; // SKIP older dates!
     
     // ... check record exists ...
   }
   ```
5. Render the "Pengaturan Tanggal Mulai Absensi" card for the Admin role:
   ```tsx
   {role === "admin" && (
     <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6">
       <CardHeader className="px-2 pt-2 pb-4">
         <CardTitle className="text-xl font-serif text-gray-900">Pengaturan Tanggal Mulai Absensi</CardTitle>
         <p className="text-xs text-muted-foreground mt-0.5">
           Atur tanggal mulai kalkulasi absen. Jadwal sebelum tanggal ini akan diabaikan pada peringatan koordinator.
         </p>
       </CardHeader>
       <CardContent className="px-2 pb-2 flex flex-col sm:flex-row gap-4 items-end">
         <div className="space-y-2 flex-1 w-full">
           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Mulai</label>
           <input
             type="date"
             value={attendanceStartDate}
             onChange={(e) => setAttendanceStartDate(e.target.value)}
             className="w-full h-10 px-3 rounded-xl border border-emerald-100 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
           />
         </div>
         <Button
           onClick={async () => {
             setIsSavingSettings(true);
             try {
               await updateAttendanceStartDate(attendanceStartDate);
               toast.success("Tanggal mulai absensi berhasil diperbarui");
             } catch (err: any) {
               toast.error("Gagal memperbarui pengaturan: " + err.message);
             } finally {
               setIsSavingSettings(false);
             }
           }}
           disabled={isSavingSettings}
           className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-10 font-medium shadow-md shadow-emerald-100 w-full sm:w-auto"
         >
           {isSavingSettings ? "Menyimpan..." : "Simpan"}
         </Button>
       </CardContent>
     </Card>
   )}
   ```

**Step 2: Commit**
```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: implement admin start date setting card and coordinator warning sync"
```

---

### Task 3: Sync Missing Attendance Warning on Attendance Page

**Files:**
- Modify: `src/app/dashboard/attendance/page.tsx`

**Step 1: Write implementation**
1. Import `getAttendanceStartDate` from `@/lib/db/settings`.
2. In `checkRoleAndProfile` inside the coordinator check block:
   - Fetch the start date setting:
     ```typescript
     const startDateStr = await getAttendanceStartDate();
     ```
   - Restrict the 5-day warning check loop:
     ```typescript
     for (let i = 0; i < 5; i++) {
       const checkDate = subDays(today, i);
       if (isWeekend(checkDate)) continue;

       const dateStr = format(checkDate, "yyyy-MM-dd");
       if (startDateStr && dateStr < startDateStr) continue; // SKIP older dates!
       
       // ... check record exists ...
     }
     ```

**Step 2: Commit**
```bash
git add src/app/dashboard/attendance/page.tsx
git commit -m "feat: sync missing attendance warnings on attendance page with start date"
```

---

### Task 4: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit.
