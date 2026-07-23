# Bulk Delete Students Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a bulk delete feature for student data that allows admins to select multiple students via checkboxes and delete them in a single batch operation.

**Architecture:** 
1. Database Layer: Add `deleteStudents` function in `src/lib/db/students.ts` using Firestore `writeBatch`.
2. UI Components: Update `StudentList` to render selection checkboxes.
3. UI Logic: Update `page.tsx` to handle page-level checkbox selection, keep track of selected student IDs, render a floating/top actions banner, and show a confirmation dialog before performing the deletion.

**Tech Stack:** React, Next.js App Router, Tailwind CSS, Radix UI (Checkbox), Firebase Firestore.

### Task 1: Database Layer Implementation & Test

**Files:**
- Modify: `src/lib/db/students.ts`
- Create: `src/lib/db/students.test.ts`

**Step 1: Write the failing test**
Create `src/lib/db/students.test.ts` with tests for `deleteStudents`.

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { deleteStudents } from './students';
import { writeBatch } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  const mockDelete = vi.fn();
  const mockCommit = vi.fn();
  const mockWriteBatch = vi.fn(() => ({
    delete: mockDelete,
    commit: mockCommit,
  }));
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn((db, col, id) => `doc-${id}`),
    query: vi.fn(),
    where: vi.fn(),
    writeBatch: mockWriteBatch,
  };
});

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('deleteStudents', () => {
  it('should use writeBatch to delete multiple student documents', async () => {
    const ids = ['id1', 'id2', 'id3'];
    await deleteStudents(ids);
    
    const batch = writeBatch();
    expect(writeBatch).toHaveBeenCalled();
    expect(batch.delete).toHaveBeenCalledTimes(3);
    expect(batch.commit).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/lib/db/students.test.ts`
Expected: FAIL (because `deleteStudents` is not defined in `src/lib/db/students.ts` yet).

**Step 3: Write minimal implementation**
Modify `src/lib/db/students.ts` to add and export `deleteStudents`:
```typescript
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
// ... existing imports ...

export async function deleteStudents(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach((id) => {
    batch.delete(doc(db, STUDENTS_COLLECTION, id));
  });
  await batch.commit();
}
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/lib/db/students.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/lib/db/students.ts src/lib/db/students.test.ts
git commit -m "feat: add deleteStudents db function and unit tests"
```

---

### Task 2: Update StudentList Component

**Files:**
- Modify: `src/app/dashboard/students/components/StudentList.tsx`

**Step 1: Write minimal implementation**
Modify `src/app/dashboard/students/components/StudentList.tsx` to add checkboxes for selecting students.
Update imports:
```typescript
import { Checkbox } from "@/components/ui/checkbox";
```
Update interface and component:
```typescript
interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onDelegate: (student: Student) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

export function StudentList({ 
  students, 
  onEdit, 
  onDelete, 
  onDelegate,
  selectedIds,
  onToggleSelect
}: StudentListProps) {
  // ...
```
And inside `students.map((student) => ...)`:
```tsx
          {/* Student Info */}
          <div className="flex items-center gap-5">
            <Checkbox
              checked={selectedIds.includes(student.id)}
              onCheckedChange={() => onToggleSelect(student.id)}
              className="border-emerald-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded-md h-5 w-5"
            />
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner",
              student.gender === "ikhwan" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
            )}>
```

**Step 2: Verify compiling & syntax check**
Run `npm run build` or Next.js build validation check to make sure types compile. (It might fail in page.tsx since page.tsx doesn't pass the new props yet - this is expected until page.tsx is updated).

**Step 3: Commit**
```bash
git add src/app/dashboard/students/components/StudentList.tsx
git commit -m "feat: add checkboxes to StudentList component"
```

---

### Task 3: Update Students Page Component

**Files:**
- Modify: `src/app/dashboard/students/page.tsx`

**Step 1: Write minimal implementation**
1. Import `deleteStudents` from `@/lib/db/students`.
2. Import `Checkbox` from `@/components/ui/checkbox` and `Trash2` from `lucide-react`.
3. Add page states:
   ```typescript
   const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
   const [studentIdsToDelete, setStudentIdsToDelete] = useState<string[] | null>(null);
   ```
4. Define selection handlers:
   ```typescript
   const handleToggleSelect = (id: string) => {
     setSelectedStudentIds((prev) =>
       prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
     );
   };

   const confirmBulkDelete = async () => {
     if (!studentIdsToDelete || studentIdsToDelete.length === 0) return;
     try {
       await deleteStudents(studentIdsToDelete);
       setSelectedStudentIds([]);
       loadStudents();
       toast.success(`${studentIdsToDelete.length} siswa berhasil dihapus`);
     } catch (error: any) {
       toast.error("Gagal menghapus siswa: " + error.message);
     } finally {
       setStudentIdsToDelete(null);
     }
   };
   ```
5. Reset selection when search/filters/pagination changes:
   ```typescript
   useEffect(() => {
     setSelectedStudentIds([]);
   }, [searchQuery, classFilter, genderFilter, currentPage]);
   ```
6. Pass the props down to `StudentList`:
   ```tsx
   <StudentList
     students={paginatedStudents}
     onEdit={(student) => {
       setEditingStudent(student);
       setShowForm(true);
       window.scrollTo({ top: 0, behavior: 'smooth' });
     }}
     onDelete={(id) => setStudentToDelete(id)}
     onDelegate={(student) => {
       setDelegatingStudent(student);
       setShowDelegation(true);
     }}
     selectedIds={selectedStudentIds}
     onToggleSelect={handleToggleSelect}
   />
   ```
7. Render the select-all / bulk actions bar right above the `<StudentList />`:
   ```tsx
   {paginatedStudents.length > 0 && (
     <div className="flex items-center justify-between px-6 py-3 bg-white/40 backdrop-blur-sm rounded-2xl border border-emerald-50/50">
       <div className="flex items-center gap-2">
         <Checkbox
           checked={paginatedStudents.every(s => selectedStudentIds.includes(s.id))}
           onCheckedChange={(checked) => {
             if (checked) {
               const pageIds = paginatedStudents.map(s => s.id);
               setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pageIds])));
             } else {
               const pageIds = paginatedStudents.map(s => s.id);
               setSelectedStudentIds(prev => prev.filter(id => !pageIds.includes(id)));
             }
           }}
           id="select-all-page"
           className="border-emerald-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded-md"
         />
         <label htmlFor="select-all-page" className="text-xs font-medium text-emerald-900 cursor-pointer select-none">
           Pilih Semua di Halaman Ini
         </label>
       </div>
       {selectedStudentIds.length > 0 && (
         <div className="flex items-center gap-3">
           <span className="text-xs font-semibold text-emerald-800">
             {selectedStudentIds.length} siswa terpilih
           </span>
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setSelectedStudentIds([])}
             className="text-xs text-gray-500 hover:text-emerald-900 h-8 px-2 rounded-lg"
           >
             Batal
           </Button>
           <Button
             size="sm"
             variant="destructive"
             onClick={() => setStudentIdsToDelete(selectedStudentIds)}
             className="bg-red-600 hover:bg-red-700 text-xs h-8 px-3 rounded-lg flex items-center gap-1 shadow-md shadow-red-100"
           >
             <Trash2 size={12} />
             Hapus Terpilih
           </Button>
         </div>
       )}
     </div>
   )}
   ```
8. Add the bulk delete confirmation dialog:
   ```tsx
   <AlertDialog open={!!studentIdsToDelete} onOpenChange={(open) => !open && setStudentIdsToDelete(null)}>
     <AlertDialogContent className="rounded-3xl border-emerald-50 p-8">
       <AlertDialogHeader>
         <AlertDialogTitle className="text-2xl font-serif font-bold text-red-900">Hapus Siswa Terpilih?</AlertDialogTitle>
         <AlertDialogDescription className="text-gray-600 pt-2">
           Tindakan ini akan menghapus <strong>{studentIdsToDelete?.length}</strong> data siswa terpilih secara permanen dari sistem. Anda tidak dapat membatalkan tindakan ini.
         </AlertDialogDescription>
       </AlertDialogHeader>
       <AlertDialogFooter className="pt-6">
         <AlertDialogCancel className="rounded-xl border-emerald-100">Batal</AlertDialogCancel>
         <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700 rounded-xl px-8">
           Ya, Hapus Semua
         </AlertDialogAction>
       </AlertDialogFooter>
     </AlertDialogContent>
   </AlertDialog>
   ```

**Step 2: Verify compilation and tests**
Run `npm run build` to verify there are no compilation errors.
Run unit tests `npm test` to verify no regressions.

**Step 3: Commit**
```bash
git add src/app/dashboard/students/page.tsx
git commit -m "feat: implement page level logic and bulk delete dialog"
```

---

### Task 4: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to ensure the project builds correctly with no TypeScript errors.
4. Commit.
