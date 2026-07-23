# Dashboard Differentiation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Differentiate the dashboard display per user role: Admin (school-wide counts & recent activity), Coordinator (their class stats and status), and Supervisor (school-wide counts & today's missing class-attendance monitor).

**Architecture:**
1. Database: Update `updateStudentStatus` in `src/lib/db/attendance.ts` to add `updatedAt` to attendance records.
2. Helper functions: Add dashboard-specific queries/helpers if needed, or query inline in the dashboard page.
3. UI Components: Update `src/app/dashboard/page.tsx` with role-specific widgets, stats loaders, and layouts.

**Tech Stack:** React, Tailwind CSS, Lucide icons, Firebase Firestore.

---

### Task 1: Add updatedAt to Attendance Records

**Files:**
- Modify: `src/lib/db/attendance.ts`

**Step 1: Write minimal implementation**
Modify `src/lib/db/attendance.ts` to include `updatedAt: new Date()` inside both branches of `updateStudentStatus`.
```typescript
export async function updateStudentStatus(
  date: string,
  classId: string,
  gender: string,
  prayerType: string,
  studentId: string,
  status: AttendanceStatus
): Promise<void> {
  const docId = getAttendanceDocId(date, classId, gender, prayerType);
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, {
      [`statuses.${studentId}`]: status,
      updatedAt: new Date(),
    });
  } else {
    await setDoc(docRef, {
      date,
      classId,
      gender,
      prayerType,
      statuses: {
        [studentId]: status,
      },
      updatedAt: new Date(),
    });
  }
}
```

**Step 2: Commit**
```bash
git add src/lib/db/attendance.ts
git commit -m "feat: add updatedAt timestamp to attendance records"
```

---

### Task 2: Implement Dashboard Page Statistics & Widgets

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Write implementation**
Update `src/app/dashboard/page.tsx` with role-based statistics loading and widgets:
1. Import collection queries, count operations, and getDocs:
   ```typescript
   import { collection, getDocs, query, where, limit, orderBy } from "firebase/firestore";
   ```
2. Define interfaces for statistics:
   ```typescript
   interface AdminStats {
     totalStudents: number;
     totalCoordinators: number;
     totalSupervisors: number;
   }

   interface CoordStats {
     totalClassStudents: number;
     todayZuhurFilled: boolean;
     todayAsharFilled: boolean;
     todayJumatFilled: boolean;
     attendanceRateThisMonth: number;
   }

   interface SupervisorStats extends AdminStats {
     missingClassesToday: {
       classId: string;
       gender: "ikhwan" | "akhwat";
       prayer: PrayerType;
     }[];
   }
   ```
3. Load data on mount based on the role:
   - **For Admin / Supervisor:**
     - Query counts of `students`, `coordinators`, and `supervisors` collections.
     - Load recent activity: Query the `attendance` collection, order by `updatedAt` desc, limit to 5.
   - **For Supervisor:**
     - Check missing attendance combinations for today. Expected combinations:
       - For each class in `AVAILABLE_CLASSES`:
         - If today is Friday: `jumat` prayer (for both genders, or specifically per coordinator gender).
         - Otherwise: `zuhur` and `ashar` prayers.
       - Check if an attendance document exists for each combination. If not, add to `missingClassesToday`.
   - **For Coordinator:**
     - Get coordinator profile (`coordinators` collection).
     - Count total students in their class and gender.
     - Check if today's Zuhur/Ashar/Jumat attendance is completed.
     - Calculate current month average attendance rate by querying `attendance` documents for their class & gender in the current month, counting positive attendance ("hadir" / "haid") vs total expected.
4. Render role-based widgets:
   - **Admin Layout:**
     - Welcome Hero Banner.
     - Quick action grid.
     - Stats Cards: Total Students, Total Coordinators, Total Supervisors.
     - **Recent Activity Feed:** list of recent attendance modifications.
   - **Supervisor Layout:**
     - Welcome Hero Banner.
     - Quick action grid.
     - Stats Cards: Total Students, Total Coordinators, Total Supervisors.
     - **"Belum Absen Hari Ini" Widget:** Lists classes that haven't filled attendance today with a quick link to record.
   - **Coordinator Layout:**
     - Welcome Hero Banner.
     - Missing Attendance Alert (if any).
     - **Class Statistics Widget:**
       - Card 1: Total Students (Jumlah Siswa Kelas).
       - Card 2: Kehadiran Hari Ini (Zuhur & Ashar status).
       - Card 3: Rata-rata Bulan Ini (Monthly percentage rate).
     - Quick action grid.
     - Bottom Info Card.

**Step 2: Commit**
```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: implement role-based dashboard layouts and stats loaders"
```

---

### Task 3: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit.
