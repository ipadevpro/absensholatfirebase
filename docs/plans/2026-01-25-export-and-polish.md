# Export Reports & UI Polishing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add the ability to export attendance reports to CSV/Excel and polish the UI with toast notifications and a "Add to Home Screen" prompt for the PWA.

**Architecture:** Use client-side CSV generation for exports. Implement a global Toast provider using `sonner` or a custom shadcn implementation. Add a custom PWA install prompt.

**Tech Stack:** `lucide-react`, `date-fns`, `sonner` (or custom toast), `xlsx` (optional for Excel, or just CSV).

---

## UI Feedback & Notifications

### Task 1: Setup Toast Notifications

**Files:**
- Create: `src/components/ui/sonner.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `package.json`

**Step 1: Install sonner**

```bash
npm install sonner
```

**Step 2: Create sonner component**

```typescript
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toaster]:text-muted-foreground",
          actionButton:
            "group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground",
          cancelButton:
            "group-[.toaster]:bg-muted group-[.toaster]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

**Step 3: Add to layout**

```typescript
// app/layout.tsx
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add toast notifications with sonner"
```

---

### Task 2: Replace Alerts with Toasts

**Files:**
- Modify: `src/app/dashboard/students/page.tsx`
- Modify: `src/app/dashboard/students/components/DelegationDialog.tsx`
- Modify: `src/app/dashboard/students/components/BulkStudentDialog.tsx`

**Step 1: Update StudentsPage**

```typescript
import { toast } from "sonner"
// Replace alert() with toast.success()
```

**Step 2: Update Dialogs**

```typescript
// Use toast.success("Berhasil...") instead of alerts or simple state
```

**Step 3: Commit**

```bash
git add src/app/dashboard/students/
git commit -m "style: replace alerts with toast notifications"
```

---

## Export Functionality

### Task 3: Implement CSV Export for Reports

**Files:**
- Create: `src/lib/export.ts`
- Modify: `src/app/dashboard/reports/page.tsx`

**Step 1: Create export utility**

```typescript
export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => 
    Object.values(row).map(value => `"${value}"`).join(",")
  );
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

**Step 2: Add Export Button to Reports Page**

```typescript
import { exportToCSV } from "@/lib/export";
import { Download } from "lucide-react";

// In ReportsPage:
const handleExport = () => {
  const exportData = stats.map(s => ({
    Nama: s.studentName,
    Hadir: s.attended,
    Total: s.totalPrayers,
    Persentase: `${s.percentage}%`,
    Nilai: getGrade(s.percentage)
  }));
  exportToCSV(exportData, `Laporan_Absen_${classId}_${month}_${year}`);
};

// Add <Button onClick={handleExport} variant="outline"><Download /> Export CSV</Button>
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add CSV export for attendance reports"
```

---

## PWA Enhancement

### Task 4: Custom Install Prompt

**Files:**
- Create: `src/components/layout/InstallPrompt.tsx`
- Modify: `src/app/dashboard/layout.tsx`

**Step 1: Create InstallPrompt component**

```typescript
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white p-4 rounded-xl shadow-2xl border border-green-100 z-[60] flex items-center justify-between md:max-w-sm md:left-auto md:right-4">
      <div className="flex items-center gap-3">
        <div className="bg-green-100 p-2 rounded-lg text-green-600">
          <Smartphone size={20} />
        </div>
        <div>
          <p className="font-bold text-sm">Pasang Aplikasi</p>
          <p className="text-xs text-muted-foreground">Akses lebih cepat dari Home Screen</p>
        </div>
      </div>
      <Button size="sm" onClick={handleInstall}>Install</Button>
    </div>
  );
}
```

**Step 2: Add to Dashboard Layout**

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add PWA install prompt"
```

---

## Summary

This plan covers:
1. Setting up `sonner` for professional notifications.
2. Adding CSV export for attendance reports.
3. Adding a custom PWA install prompt for better mobile adoption.

**Total Tasks:** 4

---

**Plan complete and saved to `docs/plans/2026-01-25-export-and-polish.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
