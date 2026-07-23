# Design Spec: Local-First Attendance Editing

## Background
Currently, changing any student's attendance status or clicking "Hadir Semua" sends updates immediately to Firestore. This creates multiple network writes and lag. We need to transition to a local-first editing approach where all changes are stored locally in the component state, and only sent to Firestore as a single document write when the user clicks the "Simpan" (Save) button.

## Requirements
1. **Database Layer:**
   - Add `saveAttendanceRecord(date, classId, gender, prayerType, statuses)` to `src/lib/db/attendance.ts` to write the entire statuses record in one doc write.

2. **Component State in `AttendanceRecorder.tsx`:**
   - Maintain a `localStatuses` state for pending updates.
   - Sync `localStatuses` with Firestore updates only when the state is not dirty.
   - Set `isDirty` to `true` when changes are made.
   - Clicking "Hadir Semua" updates all students to `"hadir"` in `localStatuses` and sets `isDirty` to `true`.
   - Update "Simpan" button to call `saveAttendanceRecord` with `localStatuses`, then clear `isDirty`.
   - Show a warning if the user attempts to switch prayer tabs while `isDirty` is `true`.
