# Design Spec: Role-Based Dashboard Differentiation

## Background
Currently, the dashboard displays quick links and a welcome banner but does not show statistics or recent activity. To make the dashboard actionable, we will customize the view for each role:
1. **Admin:** Overall statistics (Total Students, Coordinators, Supervisors) and recent activity feed.
2. **Coordinator:** Stats for their delegated class and category (Total Class Students, Today's status for Zuhur/Ashar/Jumat, and Current Month Attendance Rate).
3. **Supervisor (Pembina):** Overall statistics, and a list of classes/prayers that have not recorded attendance today (directly facilitating monitoring).

## Data Changes
We will update `updateStudentStatus` in `src/lib/db/attendance.ts` to save an `updatedAt: new Date()` timestamp in each attendance record. This allows querying the latest activity.

## UI Design & Components
- **Overall Stats Cards:** Grid of 3-4 cards displaying key counts.
- **Recent Activity Feed:** List of recent updates to attendance records.
- **Missing Attendance Monitor (Supervisor):** Check all combinations of class + gender + expected prayers for today. Cross-reference with today's Firestore records and list the ones missing.
- **My Class Status (Coordinator):** Detail stats on the coordinator's specific class.
