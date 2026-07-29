# Absen Haid & Format Nilai Angka Bulat Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mendukung opsi absen "Haid" untuk akhwat (dianggap hadir) dan mengubah tampilan serta ekspor nilai akhir laporan menjadi angka murni bulat 0-100 (bukan persentase).

**Architecture:** Memodifikasi UI table view laporan absensi untuk menghilangkan tanda persen, memperbarui file halaman laporan (`reports/page.tsx`) saat memproses ekspor CSV, serta memverifikasi logika backend agar "haid" tetap diproses secara positif.

**Tech Stack:** React, Next.js (App Router), Lucide Icons, Vitest.

---

### Task 1: Verifikasi dan Perbarui Unit Test Laporan Absensi

**Files:**
- Create: `src/lib/db/reports.test.ts`
- Modify: `src/lib/db/reports.ts:70-75`

**Step 1: Buat/Tulis Unit Test Baru untuk Mengetes Logika Absen Haid dan Skor Akhir**

Kita perlu memverifikasi bahwa:
1. Absen status "haid" dihitung sebagai kehadiran positif bagi yang berhak.
2. Tipe data statistik mengembalikan `percentage` bernilai numerik murni.

```typescript
import { describe, it, expect, vi } from "vitest";
import { getAttendanceStats } from "./reports";
import { getDocs } from "firebase/firestore";

vi.mock("firebase/firestore", () => {
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
  };
});

vi.mock("@/lib/firebase/config", () => ({
  db: {},
}));

describe("getAttendanceStats", () => {
  it("should calculate attendance percentage correctly where 'hadir' and 'haid' are treated as attended", async () => {
    // Mock students and records
    const mockStudentsSnapshot = {
      docs: [
        { id: "student-1", data: () => ({ id: "student-1", name: "Siswa 1", gender: "akhwat", classId: "7a" }) }
      ]
    };
    const mockAttendanceSnapshot = {
      docs: [
        {
          data: () => ({
            date: "2026-02-01",
            classId: "7a",
            gender: "akhwat",
            prayerType: "zuhur",
            statuses: { "student-1": "haid" }
          })
        },
        {
          data: () => ({
            date: "2026-02-01",
            classId: "7a",
            gender: "akhwat",
            prayerType: "ashar",
            statuses: { "student-1": "hadir" }
          })
        }
      ]
    };

    vi.mocked(getDocs)
      .mockResolvedValueOnce(mockStudentsSnapshot as any) // first call for students
      .mockResolvedValueOnce(mockAttendanceSnapshot as any); // second call for attendance

    const stats = await getAttendanceStats("7a", "akhwat", 2026, 2);

    expect(stats.length).toBe(1);
    expect(stats[0].attended).toBe(2); // "haid" + "hadir"
    expect(stats[0].totalPrayers).toBe(2); // 1 day * 2 prayers
    expect(stats[0].percentage).toBe(100);
  });
});
```

**Step 2: Jalankan test dan pastikan pass**

Run: `npm run test src/lib/db/reports.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/db/reports.test.ts
git commit -m "test: add test for report calculation with haid status"
```

---

### Task 2: Modifikasi UI Laporan Absensi (`AttendanceStats.tsx`)

**Files:**
- Modify: `src/app/dashboard/reports/components/AttendanceStats.tsx:47-51`, `src/app/dashboard/reports/components/AttendanceStats.tsx:110-120`

**Step 1: Ubah tampilan tabel agar tidak ada `%`**

Di file `src/app/dashboard/reports/components/AttendanceStats.tsx`:
1. Ubah Header kolom:
```typescript
// Sebelum:
<TableHead className="text-center font-bold text-emerald-900/40 uppercase text-[10px] tracking-widest">Nilai (%)</TableHead>

// Sesudah:
<TableHead className="text-center font-bold text-emerald-900/40 uppercase text-[10px] tracking-widest">Nilai</TableHead>
```

2. Ubah isi baris data:
```typescript
// Sebelum:
<span className={cn(
  "text-sm font-black",
  stat.percentage >= 80 ? "text-emerald-600" : "text-gray-600"
)}>
  {stat.percentage}%
</span>

// Sesudah:
<span className={cn(
  "text-sm font-black",
  stat.percentage >= 80 ? "text-emerald-600" : "text-gray-600"
)}>
  {stat.percentage}
</span>
```

**Step 2: Jalankan linting**

Run: `npm run lint`
Expected: PASS (tidak ada error format atau TS)

**Step 3: Commit**

```bash
git add src/app/dashboard/reports/components/AttendanceStats.tsx
git commit -m "feat: change UI table to show integer score instead of percentage"
```

---

### Task 3: Modifikasi Export CSV Laporan Halaman (`reports/page.tsx`)

**Files:**
- Modify: `src/app/dashboard/reports/page.tsx:64-75`

**Step 1: Edit fungsi `handleExport` untuk menghilangkan `%`**

Ubah bagian format penulisan properti "Persentase" menjadi "Nilai" dan bertipe data angka:
```typescript
// Sebelum:
const exportData = stats.map(s => ({
  "Nama Siswa": s.studentName,
  "Jumlah Hadir": s.attended,
  "Total Sholat": s.totalPrayers,
  "Persentase": `${s.percentage}%`,
  "Nilai": getGrade(s.percentage)
}));

// Sesudah:
const exportData = stats.map(s => ({
  "Nama Siswa": s.studentName,
  "Jumlah Hadir": s.attended,
  "Total Sholat": s.totalPrayers,
  "Nilai": s.percentage,
  "Grade": getGrade(s.percentage)
}));
```

**Step 2: Jalankan kompilasi proyek**

Run: `npm run build`
Expected: Build sukses tanpa kesalahan Type Checking

**Step 3: Commit**

```bash
git add src/app/dashboard/reports/page.tsx
git commit -m "feat: format CSV export values to plain numbers without percentage sign"
```
