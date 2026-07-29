# Design: Penambahan Absen Haid & Format Nilai Angka Bulat (Skala 1-100)

**Tanggal:** 2026-02-14 (atau tanggal saat ini)
**Status:** Validated

---

## 1. Tujuan
Mendukung opsi absen "Haid" untuk siswi akhwat, di mana kehadiran haid ini dihitung sebagai kehadiran penuh (tidak mengurangi nilai). Selain itu, format nilai akhir siswa pada laporan dan ekspor CSV diubah dari bentuk persentase (misal `90%`) menjadi angka murni skala 1-100 (misal `90`).

---

## 2. Analisis Kode Saat Ini
1. **AttendanceStatus & Jenis Kelamin**:
   Di `src/types/index.ts`, `"haid"` sudah didefinisikan sebagai bagian dari tipe `AttendanceStatus`:
   ```typescript
   export type AttendanceStatus = "hadir" | "sakit" | "izin" | "alpa" | "haid";
   ```
   Dan pada `src/app/dashboard/attendance/components/AttendanceList.tsx`, opsi `"haid"` dibatasi hanya untuk gender `"akhwat"`.

2. **Perhitungan Kehadiran (Logika Haid)**:
   Di `src/lib/db/reports.ts` fungsi `getAttendanceStats` sudah menghitung `"haid"` sebagai kehadiran:
   ```typescript
   if (status === "hadir" || status === "haid") {
     attendedCount += 1;
   }
   ```
   Ini memenuhi kebutuhan **Opsi A** (Haid dianggap hadir/mendapat poin penuh).

3. **Format Nilai Persentase**:
   Saat ini, nilai ditampilkan dengan simbol `%` di UI tabel laporan (`AttendanceStats.tsx`) dan diekspor ke CSV dengan format `${s.percentage}%` di `src/app/dashboard/reports/page.tsx`.

---

## 3. Rencana Perubahan

### A. Modifikasi Komponen Laporan Tabel (`src/app/dashboard/reports/components/AttendanceStats.tsx`)
1. Mengubah header kolom dari **"Nilai (%)"** menjadi **"Nilai"**.
2. Mengubah render sel nilai dari `{stat.percentage}%` menjadi `{stat.percentage}` (menghilangkan karakter `%`).

### B. Modifikasi Ekspor CSV Halaman Laporan (`src/app/dashboard/reports/page.tsx`)
1. Di dalam handler `handleExport`, ubah properti `"Persentase"` menjadi `"Nilai"` dan nilainya cukup `s.percentage` tanpa append `%`.
   ```typescript
   // Sebelum:
   "Persentase": `${s.percentage}%`,
   
   // Sesudah:
   "Nilai": s.percentage,
   ```

---

## 4. Rencana Pengujian
1. Verifikasi UI tabel Laporan: pastikan kolom nilai tidak lagi menampilkan tanda `%`.
2. Lakukan unduhan/ekspor CSV dari halaman laporan dan pastikan kolom "Nilai" berisi angka numerik biasa (misal `95` bukan `95%`).
3. Pastikan pengisian absen "Haid" untuk akhwat berfungsi dan berkontribusi terhadap kehadiran secara positif.
