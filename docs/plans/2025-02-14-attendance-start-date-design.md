# Design Spec: Attendance Start Date Configuration & Sync

## Background
Currently, the missing attendance warning checks the last 5 school days unconditionally. If the school year or monitoring period starts mid-week or after a holiday, coordinators will see irrelevant warnings for days before the start. To fix this, Admins need a way to set a "start date" for attendance calculation. The warnings on both the Coordinator Dashboard and the Attendance page should synchronize and ignore days prior to this start date.

## Requirements
1. **Database Layer:**
   - Store settings in Firestore collection `settings`, document `attendance`, field `startDate`.
   - Implement `getAttendanceStartDate()` and `updateAttendanceStartDate(date: string)`.

2. **Admin Dashboard UI:**
   - Add a Settings card on the Admin Dashboard showing a Date Picker and a "Simpan" button.
   - Load and save the `startDate` configuration.

3. **Warnings Synchronization:**
   - In both `src/app/dashboard/page.tsx` (coordinator check) and `src/app/dashboard/attendance/page.tsx` (attendance check), load the `startDate` setting.
   - Skip checking for missing attendance on days earlier than the configured `startDate`.
