# Mobile UI/UX & Responsive Ergonomics Implementation Plan

**Date**: 2026-09-01  
**Goal**: Elevate mobile UX, touch ergonomics, responsive tables, iOS safe areas, and interactive microinteractions across all application pages.

---

## Tasks Overview

### Task 1: Mobile Base, Safe-Area Inset & Navigation Polish
- **Files**: `src/app/globals.css`, `src/components/layout/MobileNav.tsx`, `src/app/dashboard/layout.tsx`
- **Actions**:
  - In `globals.css`, add `-webkit-overflow-scrolling: touch`, `touch-manipulation`, and iOS auto-zoom prevention for inputs (`@media (max-width: 768px) { input, select, textarea { font-size: 16px !important; } }`).
  - In `MobileNav.tsx`, add safe-area bottom padding (`pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]`), tactile feedback `active:scale-95 transition-transform`, and `aria-current={isActive ? "page" : undefined}`.
  - In `dashboard/layout.tsx`, ensure content scroll area has `pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6`.

### Task 2: Attendance & Sticky Bar Mobile Touch Optimization
- **Files**: `src/app/dashboard/attendance/components/AttendanceRecorder.tsx`, `src/app/dashboard/attendance/components/AttendanceList.tsx`
- **Actions**:
  - In `AttendanceList.tsx`, add `touch-manipulation`, `active:scale-[0.96]`, `aria-pressed={isActive}`, and accessible `aria-label` on student status buttons.
  - In `AttendanceRecorder.tsx`, polish sticky top bar for mobile screens: compact button padding, safe-area top, and tactile press scaling.

### Task 3: Mobile Tables & Responsive Horizontal Scrolling
- **Files**: `src/app/dashboard/coordinators/components/CoordinatorsList.tsx`, `src/app/dashboard/supervisors/components/SupervisorsList.tsx`, `src/app/dashboard/reports/components/AttendanceStats.tsx`
- **Actions**:
  - Wrap table in `overflow-x-auto` with `min-w-[480px]` or `min-w-[520px]` so columns never break or clip on small screens.
  - Ensure delete/action buttons have at least 36px x 36px touch targets and `active:scale-[0.95]`.

### Task 4: Dialogs & Forms Mobile Viewport Ergonomics
- **Files**: `src/app/dashboard/students/components/StudentForm.tsx`, `src/app/dashboard/students/components/DelegationDialog.tsx`, `src/app/dashboard/students/components/BulkStudentDialog.tsx`, `src/app/dashboard/coordinators/components/CoordinatorForm.tsx`, `src/app/dashboard/supervisors/components/SupervisorForm.tsx`
- **Actions**:
  - In `BulkStudentDialog.tsx`, polish responsive mobile tabs, scrollable container, and responsive action footer.
  - In `SupervisorForm.tsx`, polish scrollable class selection box with touch-friendly checkboxes.
  - Ensure all dialog footers stack smoothly on narrow mobile screens (`flex-col-reverse sm:flex-row`).

### Task 5: Students & Reports Mobile Layout & Pagination Polish
- **Files**: `src/app/dashboard/students/page.tsx`, `src/app/dashboard/reports/page.tsx`
- **Actions**:
  - In `students/page.tsx`, polish pagination bar for mobile: responsive flex layout, touch-friendly page buttons, active filter chips with tap-to-remove.
  - In `reports/page.tsx`, optimize filter grid and export button layout for one-handed mobile use.

### Task 6: Final Verification & Test Suite
- **Actions**:
  - Run `npm test -- --run` across all 14 test suites.
  - Run `npm run build` to verify clean production compilation.
