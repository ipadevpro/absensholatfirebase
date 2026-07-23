# Design Spec: Bulk Delete Students

## Background
Currently, the application allows admins to delete students one by one. In scenarios where multiple students need to be removed (such as graduating classes or data cleanup), doing so individually is tedious and slow. 

This design outlines the addition of a bulk delete student feature.

## Requirements
1. **Database Layer:**
   - Implement `deleteStudents(ids: string[])` in `src/lib/db/students.ts`.
   - Use Firestore Write Batches (`writeBatch`) for transactional, atomic, and efficient deletions.

2. **Frontend UI Changes:**
   - Add selection checkbox column/area next to each student in the listing (`src/app/dashboard/students/components/StudentList.tsx`).
   - Add a "Pilih Semua" (Select All) checkbox in `src/app/dashboard/students/page.tsx` to easily select all students on the current page.
   - Show a bulk action banner/section when at least one student is selected, showing:
     - Number of selected students.
     - "Hapus Terpilih" (Delete Selected) button.
     - "Batal" (Cancel Selection) button.
   - Confirm deletion using a modal dialog: "Apakah Anda yakin ingin menghapus X siswa terpilih secara permanen?"
   - Handle loading, errors, and success feedback via toasts.
   - Automatically clear the selection state after deletion.
