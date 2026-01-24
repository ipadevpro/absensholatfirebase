# Replace Alerts with Toasts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all native browser `alert()` calls with `sonner` toast notifications for a better user experience and consistent UI.

**Architecture:** Import the `toast` object from the `sonner` library and replace `alert("message")` with `toast.success("message")` or `toast.error("message")`.

**Tech Stack:** Next.js, React, Sonner (toast library).

### Task 1: Update Students Page

**Files:**
- Modify: `src/app/dashboard/students/page.tsx`

**Step 1: Import toast from sonner**

```tsx
import { toast } from "sonner";
```

**Step 2: Replace alert calls**

- Line 116: `alert("Akun koordinator berhasil dibuat!");` -> `toast.success("Akun koordinator berhasil dibuat!");`
- Line 125: `alert("Berhasil menambahkan banyak siswa!");` -> `toast.success("Berhasil menambahkan banyak siswa!");`

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/app/dashboard/students/page.tsx
git commit -m "style: replace alerts with toast in students page"
```

### Task 2: Scan for missed alerts in components

**Files:**
- Modify: `src/app/dashboard/students/components/DelegationDialog.tsx`
- Modify: `src/app/dashboard/students/components/BulkStudentDialog.tsx`
- Modify: `src/app/dashboard/coordinators/components/CoordinatorsList.tsx`

**Step 1: Replace any found alert() calls**

(Double-check these files for any `alert` that might have been missed).

**Step 2: Commit**

```bash
git add .
git commit -m "style: ensure all alerts are replaced with toasts"
```
