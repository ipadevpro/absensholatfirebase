# Design Spec: Supervisor Class Assignment & Filtering

## Background
A supervisor (Pembina) can oversee multiple classes. To ensure they only see their assigned classes, Admins must be able to specify the list of assigned classes when creating a supervisor. The supervisor's dashboard, attendance, and reports views must then filter data to only include their assigned classes.

## Requirements
1. **Types Update:**
   - Update `Supervisor` interface to include `classes: string[]`.

2. **Database & Server Actions:**
   - Update `createSupervisorAccount` in `src/app/actions/supervisor.ts` to accept `classes: string[]` and save it to the supervisor's document in the `supervisors` collection.

3. **Admin Management UI:**
   - Modify `SupervisorForm.tsx` to display a checkbox list of `AVAILABLE_CLASSES` and pass the selected classes back to `onSubmit`.
   - Modify `SupervisorsList.tsx` to display a "Kelas Binaan" column listing the supervisor's assigned classes.

4. **Supervisor Views Filtering:**
   - **Dashboard Page (`src/app/dashboard/page.tsx`):**
     - Fetch the supervisor's profile to retrieve their assigned `classes`.
     - Count total students inside their assigned classes.
     - Filter "Belum Absen Hari Ini" checklist to only check their assigned classes.
     - Filter "Recent Activity" feed to only show records matching their assigned classes.
   - **Attendance Page (`src/app/dashboard/attendance/page.tsx`):**
     - Load supervisor profile.
     - Filter the "Kelas" dropdown to only display their assigned classes.
     - Auto-select the first assigned class by default.
   - **Reports Page (`src/app/dashboard/reports/page.tsx`):**
     - Load supervisor profile.
     - Filter the "Kelas" dropdown to only display their assigned classes.
     - Auto-select the first assigned class by default.
