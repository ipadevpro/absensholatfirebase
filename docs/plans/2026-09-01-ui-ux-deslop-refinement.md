# Implementation Plan: UI/UX Deslop & Refinement

**Goal:** Refine and elevate the UI/UX of Absen Sholat (SMP PGII 1 Bandung) by eliminating AI-slop patterns (excessive serif fonts, oversized bubbles, jarring color fluctuations, raw window.confirm dialogs, and inconsistent tables) and replacing them with a crisp, cohesive, modern Islamic school attendance interface based on `ibelick/baseline-ui`, `dammyjay93/interface-design`, and `leonxlnx/taste-skill`.

---

## Global Constraints & Design System Standards
1. **Typography:** Clean Modern Sans (`font-sans`), standard weight hierarchy (semibold headings, medium labels, regular body). Eliminate forced serif headings. Use `tabular-nums` for all numeric data.
2. **Radius Scale:** Standardized:
   - Controls (inputs, buttons, select triggers): `rounded-lg` (~8px)
   - Cards & summary containers: `rounded-xl` (~12px) to `rounded-2xl` (~16px)
   - Modals & dialogs: `rounded-2xl` (~16px)
   - Eliminate arbitrary `rounded-[2.5rem]` and `rounded-[3rem]`.
3. **Color & Elevation:**
   - Primary: Deep Pine Emerald (`#0f5132` / `#047857`)
   - Neutral Canvas: Crisp soft stone/ivory background (`#faf9f5` / `#f8fafc`)
   - 1px crisp borders (`border-emerald-100/60` or `border-zinc-200`) + soft multi-layer shadow, no heavy saturated colored glow.
   - Semantic statuses: Hadir (Emerald), Sakit (Amber), Izin (Blue), Alpa (Rose), Haid (Purple/Violet).
4. **Interaction & Accessibility:**
   - Mobile touch targets >= 44x44px.
   - Zero `window.confirm()` — all destructive/confirm actions must use accessible Radix `AlertDialog`.
   - Consistent Indonesian localization across all screens and modals.
   - Preserve all business logic, Firebase queries, state management, and permissions intact.

---

## Tasks

### Task 1: Design Tokens & Base Theme Polish
- **Files:** `src/app/globals.css`, `src/components/ui/card.tsx`, `src/components/ui/button.tsx`
- **Description:**
  - Update `globals.css` to remove `h1..h4 { @apply font-serif }`.
  - Refine color tokens (primary deep emerald, soft background, card, border, muted).
  - Clean up custom utilities (`tabular-nums`, subtle backdrop-blur).
  - Verify and update `card.tsx` and `button.tsx` styles.

### Task 2: Layout & Navigation Refinement
- **Files:** `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/MobileNav.tsx`, `src/app/dashboard/layout.tsx`
- **Description:**
  - Standardize Sidebar typography, active indicator, remove oversized background icons.
  - Header: clean typography, user role badge, school brand.
  - MobileNav: ergonomic touch targets, replace logout `window.confirm` with `AlertDialog`.
  - Layout: viewport height stability (`min-h-[100dvh]`).

### Task 3: Login Page Overhaul
- **Files:** `src/app/login/page.tsx`
- **Description:**
  - Redesign login with elegant SMP PGII 1 Bandung identity.
  - Cohesive inputs, clear focus states, integrated button loading state.

### Task 4: Attendance Screen & Recorder Overhaul
- **Files:** `src/app/dashboard/attendance/page.tsx`, `src/app/dashboard/attendance/components/AttendanceRecorder.tsx`, `src/app/dashboard/attendance/components/AttendanceList.tsx`
- **Description:**
  - Clean Attendance page selector bar.
  - AttendanceRecorder: streamlined sticky bar, refined prayer tabs, clean celebration toast without intrusive overlay, replace dirty-tab `window.confirm` with a proper dialog.
  - AttendanceList: ergonomic student attendance cards (H/S/I/A/HD) with instant tap feedback, high contrast, and clean layout.

### Task 5: Dashboard Screen Overhaul
- **Files:** `src/app/dashboard/page.tsx`
- **Description:**
  - Redesign welcome banner with clean typography and subtle accents.
  - Refine metric cards for Admin, Supervisor, and Coordinator with `tabular-nums`.
  - Clean missing attendance alert & quick-action cards.
  - Polish recent activity list and settings card.

### Task 6: Management & Reports Screens Refinement
- **Files:**
  - `src/app/dashboard/students/page.tsx`, `src/app/dashboard/students/components/StudentList.tsx`
  - `src/app/dashboard/coordinators/page.tsx`, `src/app/dashboard/coordinators/components/CoordinatorsList.tsx`, `src/app/dashboard/coordinators/components/CoordinatorForm.tsx`
  - `src/app/dashboard/supervisors/page.tsx`, `src/app/dashboard/supervisors/components/SupervisorsList.tsx`, `src/app/dashboard/supervisors/components/SupervisorForm.tsx`
  - `src/app/dashboard/reports/page.tsx`, `src/app/dashboard/reports/components/AttendanceStats.tsx`
- **Description:**
  - Students: modern class cards, search/filter bar, bulk delete bar.
  - Coordinators & Supervisors: localize all text to Indonesian, replace `confirm()` with `AlertDialog`, polish form modals and table views.
  - Reports & AttendanceStats: clean filter controls, modern rank medals, `tabular-nums` for scores, elegant table styling.

### Task 7: Verification & Build
- **Description:**
  - Run `npm test` to ensure all unit tests pass.
  - Run `npm run build` to ensure zero build or TypeScript errors.
