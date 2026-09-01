# 🕌 Absen Sholat — SMP PGII 1 Bandung

[![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Vitest](https://img.shields.io/badge/Vitest-40_Passed-6E9F18?logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Aplikasi web modern berbasis **Mobile-First Progressive Web App (PWA)** untuk memonitor, mencatat, dan merekapitulasi kehadiran ibadah sholat berjamaah siswa di lingkungan **SMP PGII 1 Bandung**.

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Arsitektur & Hak Akses (RBAC)](#-arsitektur--hak-akses-rbac)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Struktur Proyek](#-struktur-proyek)
- [Panduan Instalasi & Menjalankan Lokal](#-panduan-instalasi--menjalankan-lokal)
- [Konfigurasi Environment Variables](#-konfigurasi-environment-variables)
- [Pengujian (Testing & Verification)](#-pengujian-testing--verification)
- [Pengembang & Kredit](#-pengembang--kredit)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

### 1. 📱 Mobile-First & Touch Ergonomics
- **Safe Area Insets**: Dukungan penuh untuk iOS notch dan home indicator bar (`env(safe-area-inset-bottom)`).
- **Tactile Feedback**: Animasi micro-interaction responsif (`active:scale-95`, `touch-manipulation`) untuk respon sentuhan instan tanpa delay 300ms.
- **Pencegahan Auto-Zoom iOS**: Penyesuaian font formulir otomatis untuk menghindari layar melompat saat fokus pada input.
- **Tabel Responsif Horizontal**: Tabel data koordinator, pembina, dan rekapitulasi dapat digeser mulus di layar seluler dengan momentum scroll native.

### 2. ⚡ Performa & Granular Skeleton Loading
- **Zero Full-Page Blocking Loaders**: Header, navbar, dan struktur halaman tampil instan (0ms).
- **Role Discovery Paralel**: Kueri autentikasi Firestore dieksekusi bersamaan dengan `Promise.all`.
- **Client-Side SWR Caching**: Caching profil & role berbasis `localStorage` untuk navigasi antarhalaman yang instan.
- **Granular Data Skeletons**: Skeleton loading hanya aktif pada data yang sedang diambil dari server.

### 3. 🕋 Presensi Ibadah Lengkap & Fleksibel
- **Jadwal Sholat**: Mendukung pencatatan sholat Zuhur, Ashar, dan Sholat Jum'at.
- **Kategori Ikhwan & Akhwat**: Dukungan khusus status **Haid (HD)** bagi siswi akhwat yang otomatis terhitung hadir.
- **Aksi Cepat & Sticky Bar**: Tombol "Hadir Semua", indikator progress bar real-time, dan sticky counter status.
- **Peringatan Unsaved Changes**: Konfirmasi berbasis Radix Dialog saat pengguna berpindah tab tanpa menyimpan data.

### 4. 👥 Manajemen Pengguna & Delegasi
- **Manajemen Siswa**: Pengelompokan kelas (7A - 9H), pencarian nama siswa, filter kategori, pagination responsif, dan bulk actions.
- **Bulk Upload Excel / Spreadsheet**: Tambahkan ratusan siswa sekaligus melalui mode tabel atau copy-paste langsung dari Microsoft Excel / Google Sheets.
- **Delegasi Koordinator**: Konversi data siswa menjadi akun login koordinator secara instan melalui server actions Firebase Admin.
- **Manajemen Pembina**: Pengelolaan akun guru pembina dengan penugasan banyak kelas binaan sekaligus.

### 5. 📊 Rekapitulasi Nilai & Ekspor Laporan
- **Perhitungan Nilai Otomatis**: Persentase kehadiran dan konversi Grade otomatis (A, B, C, D, E).
- **Peringkat & Penghargaan**: Indikator juara visual (Piala Emas Juara 1, Medali Juara 2, Juara 3).
- **Ekspor CSV**: Unduh rekapitulasi nilai kehadiran kelas ke file CSV dengan satu klik.
- **Pengaturan Tanggal Mulai**: Fitur admin untuk menentukan batas tanggal awal kalkulasi absensi.

---

## 🔐 Arsitektur & Hak Akses (RBAC)

Aplikasi menerapkan Role-Based Access Control ketat dengan 3 tingkatan pengguna:

| Fitur | 👑 Admin (Guru) | 🧑‍🏫 Pembina | 🎓 Koordinator (Siswa) |
| :--- | :---: | :---: | :---: |
| **Dashboard Ringkasan** | Seluruh Sekolah | Kelas Binaan | Kelas & Kategori Sendiri |
| **Isi / Edit Absensi** | Semua Kelas | Kelas Binaan | Kelas Sendiri |
| **Lihat Laporan & Nilai** | Semua Kelas | Kelas Binaan | Kelas Sendiri |
| **Ekspor CSV Laporan** | ✅ | ✅ | ❌ |
| **Manajemen Siswa & Bulk Upload** | ✅ | ❌ | ❌ |
| **Delegasi Akun Koordinator** | ✅ | ❌ | ❌ |
| **Manajemen Guru Pembina** | ✅ | ❌ | ❌ |
| **Atur Tanggal Mulai Absensi** | ✅ | ❌ | ❌ |

---

## 🛠 Teknologi yang Digunakan

- **Frontend Core:** [Next.js 16 (App Router)](https://nextjs.org/) + [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Tailwind Animate](https://github.com/jamiebuilds/tailwindcss-animate)
- **Komponen UI:** [Radix UI](https://www.radix-ui.com/) (Dialog, AlertDialog, Select, Tabs, Checkbox, Label) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Auth:** [Firebase v10 Client SDK](https://firebase.google.com/) (Auth, Firestore) + [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- **Notifikasi Toast:** [Sonner](https://sonner.emilkowal.ski/)
- **Ikonografi:** [Lucide React](https://lucide.dev/)
- **Manipulasi Waktu:** [date-fns](https://date-fns.org/) dengan locale Indonesia (`id`)
- **Unit Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + [JSDOM](https://github.com/jsdom/jsdom)

---

## 📂 Struktur Proyek

```bash
absensholatbaru/
├── src/
│   ├── app/                                # Next.js App Router
│   │   ├── actions/                        # Server Actions (Firebase Admin Auth)
│   │   │   └── coordinator.ts
│   │   ├── dashboard/                      # Dashboard Layout & Sub-halaman
│   │   │   ├── attendance/                 # Modul Pencatatan Absensi
│   │   │   │   └── components/
│   │   │   │       ├── AttendanceList.tsx
│   │   │   │       └── AttendanceRecorder.tsx
│   │   │   ├── coordinators/               # Modul Manajemen Koordinator
│   │   │   │   └── components/
│   │   │   ├── reports/                    # Modul Rekapitulasi & Nilai
│   │   │   │   └── components/
│   │   │   │       └── AttendanceStats.tsx
│   │   │   ├── students/                   # Modul Manajemen Data Siswa
│   │   │   │   └── components/
│   │   │   │       ├── BulkStudentDialog.tsx
│   │   │   │       ├── DelegationDialog.tsx
│   │   │   │       ├── StudentForm.tsx
│   │   │   │       └── StudentList.tsx
│   │   │   ├── supervisors/                # Modul Manajemen Pembina
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── login/                          # Halaman Login Autentikasi
│   │   ├── globals.css                     # Global Design Tokens & Mobile Utilities
│   │   └── layout.tsx
│   ├── components/
│   │   ├── auth/                           # ProtectedRoute & Auth Guards
│   │   ├── layout/                         # Header, Sidebar, MobileNav, InstallPrompt
│   │   └── ui/                             # Komponen Primitif (Button, Card, Table, Skeleton, Dialog)
│   ├── contexts/                           # AuthContext (SWR Caching & RBAC)
│   ├── lib/
│   │   ├── db/                             # Firestore CRUD Data Access Layer
│   │   │   ├── attendance.ts
│   │   │   ├── coordinators.ts
│   │   │   ├── reports.ts
│   │   │   ├── settings.ts
│   │   │   ├── students.ts
│   │   │   └── supervisors.ts
│   │   ├── firebase/                       # Inisialisasi Firebase Client & Admin
│   │   ├── constants.ts                    # Daftar Kelas (7A-9H) & Konfigurasi
│   │   └── utils.ts                        # Helper ClassNames & Jadwal Sholat
│   └── types/                              # Definisi TypeScript Interface
├── public/                                 # PWA Manifest & Aset Statis
├── vitest.config.ts                        # Konfigurasi Pengujian Vitest
├── tailwind.config.ts                      # Konfigurasi Tailwind CSS
└── package.json
```

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) v18.0 atau lebih baru
- npm / pnpm / yarn
- Akun & Proyek [Firebase](https://console.firebase.google.com/)

### Langkah Instalasi

1. **Clone repository:**
   ```bash
   git clone https://github.com/ipadevpro/absensholatfirebase.git
   cd absensholatfirebase
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Salin dan isi environment variables:**
   ```bash
   cp .env.example .env.local
   ```

4. **Jalankan development server:**
   ```bash
   npm run dev
   ```

5. Buka peramban di `http://localhost:3000`.

---

## 🔑 Konfigurasi Environment Variables

Buat file `.env.local` di root proyek dengan konfigurasi Firebase berikut:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Untuk pembuatan akun server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

---

## 🧪 Pengujian (Testing & Verification)

Proyek dilengkapi dengan pengujian unit & integrasi menggunakan **Vitest** dan **React Testing Library**:

```bash
# Menjalankan seluruh test suite
npm test -- --run

# Menjalankan test dalam mode watch
npm test

# Menjalankan build produksi Next.js
npm run build
```

Hasil verifikasi:
- **14 Test Files Passed** (40/40 tests)
- **Production Build Clean** (10/10 routes compiled)

---

## 👨‍💻 Pengembang & Kredit

- **Pengembang**: [Devi Saidulloh, S.Pd., Gr.](mailto:devisaidulloh33@guru.smp.belajar.id) (`ipadevpro`)
- **Institusi**: **SMP PGII 1 Bandung**
- **Dukungan Desain & Performa**: Mobile-First Tailwind CSS & Radix UI Primitives

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
