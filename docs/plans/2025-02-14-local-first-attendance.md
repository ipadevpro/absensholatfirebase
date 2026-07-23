# Local-First Attendance Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Modify the attendance recorder component so all student status updates and "Hadir Semua" clicks are stored in local component state first, and only written to Firestore in a single document write when the user clicks the "Simpan" button.

**Architecture:**
- DB layer: Implement `saveAttendanceRecord` in `src/lib/db/attendance.ts` to write the entire statuses map.
- UI state: Update `AttendanceRecorder.tsx` to handle `localStatuses` state, `isDirty` state, local updates, single-write save, and tab switch warnings.

**Tech Stack:** React, Next.js, Firebase Firestore, Vitest.

---

### Task 1: Update Database Layer & Tests

**Files:**
- Modify: `src/lib/db/attendance.ts`
- Create: `src/lib/db/attendance.test.ts`

**Step 1: Write the failing test**
Create `src/lib/db/attendance.test.ts` to verify `saveAttendanceRecord`.
```typescript
import { vi, describe, it, expect } from 'vitest';
import { saveAttendanceRecord } from './attendance';
import { setDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  const mockSetDoc = vi.fn();
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn((db, col, id) => `doc-${id}` as any),
    setDoc: mockSetDoc,
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('saveAttendanceRecord', () => {
  it('should use setDoc to write the entire attendance statuses', async () => {
    const statuses = { 'student-1': 'hadir' as any };
    await saveAttendanceRecord('2025-02-14', '7a', 'ikhwan', 'zuhur', statuses);
    expect(setDoc).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/lib/db/attendance.test.ts`
Expected: FAIL (function not defined)

**Step 3: Write minimal implementation**
Modify `src/lib/db/attendance.ts` to add and export `saveAttendanceRecord`:
```typescript
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
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/lib/db/attendance.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/lib/db/attendance.ts src/lib/db/attendance.test.ts
git commit -m "feat: add saveAttendanceRecord db helper and test"
```

---

### Task 2: Implement Local-First State in AttendanceRecorder

**Files:**
- Modify: `src/app/dashboard/attendance/components/AttendanceRecorder.tsx`

**Step 1: Write implementation**
Modify `src/app/dashboard/attendance/components/AttendanceRecorder.tsx`:
1. Import `saveAttendanceRecord` from `@/lib/db/attendance`.
2. Add states for local editing:
   ```typescript
   const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>({});
   const [isDirty, setIsDirty] = useState(false);
   ```
3. Update subscription listener to only update `localStatuses` if the state is not dirty:
   ```typescript
    useEffect(() => {
      if (!date || !classId) return;
      
      setLoading(true);
      const unsubscribe = subscribeToAttendance(
        date,
        classId,
        gender,
        selectedPrayer,
        (statuses) => {
          setStudentStatuses(statuses);
          if (!isDirty) {
            setLocalStatuses(statuses);
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }, [date, classId, gender, selectedPrayer, isDirty]);
   ```
4. Update individual status change handler `handleStatusChange` to update locally:
   ```typescript
   const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
     setLocalStatuses((prev) => ({ ...prev, [studentId]: status }));
     setIsDirty(true);
   };
   ```
5. Update bulk handler `handleMarkAllPresent` to update locally:
   ```typescript
   const handleMarkAllPresent = () => {
     const updated = { ...localStatuses };
     students.forEach((s) => {
       updated[s.id] = "hadir";
     });
     setLocalStatuses(updated);
     setIsDirty(true);
     toast.info(`Ditandai hadir ${students.length} siswa secara lokal. Jangan lupa klik Simpan!`);
   };
   ```
6. Update `handleFinalSubmit` to save to Firestore and clear dirty state:
   ```typescript
   const handleFinalSubmit = async () => {
     const missingStatus = students.filter(s => !localStatuses[s.id]);
     
     if (missingStatus.length > 0) {
       toast.error(`Masih ada ${missingStatus.length} siswa yang belum diabsen!`, {
         icon: <AlertCircle className="text-rose-500" />,
         description: "Mohon lengkapi semua data sebelum menyimpan.",
       });
       return;
     }

     setIsSaving(true);
     try {
       await saveAttendanceRecord(date, classId, gender, selectedPrayer, localStatuses);
       setIsDirty(false);
       setShowSuccess(true);
       toast.success("Data absensi berhasil disimpan ke server!", {
         icon: <CheckCheck className="text-emerald-500" />,
       });
       setTimeout(() => setShowSuccess(false), 3000);
     } catch (err: any) {
       console.error("Error saving attendance:", err);
       toast.error("Gagal menyimpan absensi ke server: " + err.message);
     } finally {
       setIsSaving(false);
     }
   };
   ```
7. Warn user if they attempt to switch tabs when `isDirty` is `true`:
   - Intercept prayer tab selection:
     ```typescript
     const handlePrayerTabChange = (val: string) => {
       if (isDirty) {
         const confirm = window.confirm("Ada perubahan yang belum disimpan. Apakah Anda yakin ingin membuang perubahan?");
         if (!confirm) return;
       }
       setIsDirty(false);
       setSelectedPrayer(val as PrayerType);
     };
     ```
8. Update the stats computation and rendering in `AttendanceRecorder.tsx` to read from `localStatuses` instead of `studentStatuses`.
9. In the JSX render, wrap the tab triggers with the custom handler.

**Step 2: Commit**
```bash
git add src/app/dashboard/attendance/components/AttendanceRecorder.tsx
git commit -m "feat: implement local-first editing in AttendanceRecorder component"
```

---

### Task 3: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit.
