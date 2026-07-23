# Design Spec: Class Cards for Students Page

## Background
Currently, the Students page loads all students across the entire school on mount, which is slow and unscalable. We will replace this with a class-centric view where classes are displayed as cards grouped by grade level. Selecting a class card will asynchronously load students only for that specific class.

## Requirements
1. **Views in `src/app/dashboard/students/page.tsx`:**
   - **Class Cards View (Default):**
     - Group `AVAILABLE_CLASSES` by grade: Grade 7, Grade 8, Grade 9.
     - Render each class as a styled clickable Card.
     - Skip loading any student records on mount (extremely fast load).
   - **Student Management View:**
     - Triggered when a class card is clicked.
     - Fetch students specifically for the selected class using `getStudentsByClass(classId)`.
     - Render the search bar, filters (Gender only, since Class is fixed), student listing, single/bulk adding dialogs, pagination, and bulk delete actions.
     - Add a "Kembali ke Daftar Kelas" (Back to Class List) button to return to the card view.
