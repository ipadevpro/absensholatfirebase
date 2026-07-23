# Design Spec: Supervisor (Pembina/Pembimbing) Role

## Background
The application currently supports two roles: Admin and Coordinator. We need to introduce a third role called "Pembina/Pembimbing" (referred to as `supervisor` in the codebase). This role is for teachers/supervisors whose duty is to monitor whether coordinators have completed class attendance, as well as to view and download reports. Only Admins can manage (add/delete) supervisors.

## Requirements
1. **Types:**
   - Update `UserRole` to include `"supervisor"`.
   - Add `Supervisor` interface with fields: `id`, `uid`, `name`, `createdAt`.

2. **Auth Context:**
   - Modify `AuthProvider` to check the `"supervisors"` collection. If a document exists, set `role` to `"supervisor"`.

3. **Database Layer:**
   - Create `src/lib/db/supervisors.ts` with operations: `getAllSupervisors`, `addSupervisor`, and `deleteSupervisor`.

4. **UI Navigation:**
   - Modify `Sidebar.tsx` and `MobileNav.tsx` to:
     - Make `/dashboard`, `/dashboard/attendance`, and `/dashboard/reports` accessible to the `supervisor` role.
     - Add `/dashboard/supervisors` link visible only to the `admin` role.

5. **Page Access:**
   - Update `/dashboard/attendance` and `/dashboard/reports` pages so that `supervisor` gets the same class-selection view as `admin` (i.e. access to choose all classes and edit/view/download data).
   - Create the `/dashboard/supervisors` page allowing Admins to manage supervisors.
