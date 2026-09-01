# Implementation Plan: Fast Loading & Granular Skeleton Loading

**Goal:** Accelerate application loading speed and eliminate full-page blocking spinners by implementing query parallelization, auth role caching (SWR), and targeted, granular `Skeleton` components in dynamic data slots across all pages (Dashboard, Attendance, Students, Coordinators, Supervisors, and Reports).

---

## Technical Standards & Rules (Based on `vercel-react-best-practices`)
1. **Async Parallelism (`async-parallel`)**: Parallelize independent Firestore requests via `Promise.all` to eliminate network waterfalls.
2. **Client Caching & Optimistic Hydration (`client-localstorage-schema`)**: Cache user role and profile in `localStorage` to allow instant dashboard rendering without blocking on auth roundtrips.
3. **Targeted Skeleton Loading**:
   - **Never** block or replace the entire page, layout, header, or filter controls with a full-page loading screen or generic skeleton container.
   - Headers, navigation bars, selector controls, action buttons, and card shells render immediately.
   - Skeletons are placed strictly in the data slots (e.g., metric numbers, student rows, table rows, activity items).

---

## Tasks

### Task 1: Auth Performance, Query Parallelization & Role Caching
- **Files:** `src/contexts/AuthContext.tsx`, `src/components/auth/ProtectedRoute.tsx`
- **Actions:**
  - Parallelize role discovery with `Promise.all([getDoc(admins), getDoc(supervisors), getDoc(coordinators)])`.
  - Cache role and profile in `localStorage` for instant hydration upon page reload / navigation.
  - Prevent `ProtectedRoute` from blocking the whole page when cached user session exists.

### Task 2: Reusable Skeleton Component & Dashboard Granular Skeletons
- **Files:** `src/components/ui/skeleton.tsx`, `src/app/dashboard/page.tsx`
- **Actions:**
  - Create standard `Skeleton` primitive (`bg-muted/60 animate-pulse rounded-md`).
  - Remove full-page blocking skeleton in `DashboardPage`.
  - Render Hero banner, Quote, Quick Links, and structural containers immediately.
  - Add targeted skeletons for metric numbers, recent activity items, and missing attendance checklist.

### Task 3: Attendance Page & AttendanceRecorder Granular Skeletons
- **Files:** `src/app/dashboard/attendance/page.tsx`, `src/app/dashboard/attendance/components/AttendanceRecorder.tsx`, `src/app/dashboard/attendance/components/AttendanceList.tsx`
- **Actions:**
  - Filter bar and page headers render immediately.
  - Inside `AttendanceRecorder`, render 5 student card skeletons (avatar circle, text placeholder, status button placeholders) inside `AttendanceList` while students are loading.
  - Sticky counter displays compact skeleton while counting.

### Task 4: Students Management Granular Skeletons
- **Files:** `src/app/dashboard/students/page.tsx`, `src/app/dashboard/students/components/StudentList.tsx`
- **Actions:**
  - Header, class cards, search input, and filter controls render immediately.
  - When fetching students for a selected class, display 5 student item skeletons in `StudentList` instead of a spinner.

### Task 5: Coordinators, Supervisors & Reports Granular Skeletons
- **Files:**
  - `src/app/dashboard/coordinators/page.tsx`, `src/app/dashboard/coordinators/components/CoordinatorsList.tsx`
  - `src/app/dashboard/supervisors/page.tsx`, `src/app/dashboard/supervisors/components/SupervisorsList.tsx`
  - `src/app/dashboard/reports/page.tsx`, `src/app/dashboard/reports/components/AttendanceStats.tsx`
- **Actions:**
  - Page headers, action buttons, filter controls, and table headers render immediately.
  - Table bodies render 4-5 skeleton rows (`<TableRow><TableCell><Skeleton className="..." /></TableCell></TableRow>`) while fetching.

### Task 6: Verification & Performance Audit
- **Actions:**
  - Run `npm test -- --run` to verify all test suites pass.
  - Run `npm run build` to ensure zero compilation or TypeScript errors.
