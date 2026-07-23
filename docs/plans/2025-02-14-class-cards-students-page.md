# Class-Centric Students Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Modify the Students management page to show class cards grouped by grade level. Clicking a card loads and manages students only for that class, making initial loading instant and sub-queries highly optimized.

**Architecture:**
- DB: Import `getStudentsByClass` in the page component.
- UI state: Add `selectedClassId: string | null` state in `src/app/dashboard/students/page.tsx`.
- Views:
  - If `selectedClassId` is `null`, display class cards sorted and grouped by grade (Grade 7, Grade 8, Grade 9) as cards.
  - If `selectedClassId` is not `null`, display the existing student listing and management elements, filtered specifically for this class. Add a "Kembali ke Daftar Kelas" button at the top.

**Tech Stack:** React, Tailwind CSS, Lucide icons, Firebase Firestore.

---

### Task 1: Update Students Page Component

**Files:**
- Modify: `src/app/dashboard/students/page.tsx`

**Step 1: Write implementation**
Modify `src/app/dashboard/students/page.tsx`:
1. Import `getStudentsByClass` from `@/lib/db/students` (alongside existing db imports).
2. Add states:
   ```typescript
   const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
   ```
3. Update `loadStudents`:
   - If `selectedClassId` is set, load only students for that class:
     ```typescript
     const loadStudents = async () => {
       if (!selectedClassId) return;
       setIsLoading(true);
       try {
         const data = await getStudentsByClass(selectedClassId);
         setStudents(data);
       } catch (error: any) {
         toast.error("Gagal memuat data siswa: " + error.message);
       } finally {
         setIsLoading(false);
       }
     };
     ```
   - Update `useEffect` that triggers `loadStudents()` to run when `selectedClassId` changes:
     ```typescript
     useEffect(() => {
       if (role === "admin" && selectedClassId) {
         loadStudents();
       }
     }, [role, selectedClassId]);
     ```
4. Group classes by grade in helper structure:
   ```typescript
   const classesByGrade = useMemo(() => {
     const groups: Record<number, typeof AVAILABLE_CLASSES> = { 7: [], 8: [], 9: [] };
     AVAILABLE_CLASSES.forEach(cls => {
       // id format like "7a", "8b"
       const grade = parseInt(cls.id.charAt(0));
       if (groups[grade]) {
         groups[grade].push(cls);
       }
     });
     return groups;
   }, []);
   ```
5. Modify return JSX:
   - If `selectedClassId === null`, render directory of classes:
     - Header "Manajemen Siswa" and desc.
     - Section for each grade (7, 8, 9) containing a grid of cards:
       - Each card is styled with hover transition effects: `group p-6 bg-white border border-emerald-50 rounded-[2rem] hover:shadow-xl hover:border-emerald-200 cursor-pointer`
       - Shows Class Name (e.g. `Kelas 7-A`) and a decoration icon (e.g. `GraduationCap` or `Users`).
       - Click handler sets `setSelectedClassId(cls.id)`.
   - If `selectedClassId !== null`:
     - Show a top "Kembali ke Daftar Kelas" button with a left arrow icon.
     - Display class-specific title (e.g., `Siswa Kelas ${selectedClassId.toUpperCase()}`).
     - Search and gender filter specifically for this class.
     - Add Student / Bulk Add Student: Automatically pre-fill the form's `classId` field to `selectedClassId` to simplify adding!
6. Update adding handles:
   - When adding a student, pass `classId: selectedClassId` implicitly if not provided by form.

**Step 2: Commit**
```bash
git add src/app/dashboard/students/page.tsx
git commit -m "feat: implement class cards directory and async student loading on students page"
```

---

### Task 2: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit & Push to Github.
