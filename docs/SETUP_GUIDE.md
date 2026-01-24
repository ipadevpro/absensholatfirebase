# Panduan Setup Awal & Login - Absen Sholat

Dokumen ini menjelaskan cara mengonfigurasi user pertama agar bisa login ke aplikasi.

## 1. Konfigurasi Firebase Auth
Aplikasi menggunakan Email & Password. Pastikan metode ini sudah aktif:
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Masuk ke **Authentication** > **Sign-in method**.
3. Aktifkan **Email/Password**.

## 2. Membuat User Admin (Guru) Pertama
Karena aplikasi ini tertutup, user harus didaftarkan secara manual atau melalui sistem admin.

### Langkah 1: Daftarkan User
1. Di **Authentication** > **Users**, klik **Add User**.
2. Masukkan email dan password.
3. Salin (Copy) **UID** user tersebut.

### Langkah 2: Berikan Akses Admin di Firestore
Aplikasi mengecek role berdasarkan koleksi di Firestore.
1. Masuk ke **Firestore Database**.
2. Buat koleksi bernama `admins`.
3. Klik **Add Document**.
4. Pada bagian **Document ID**, masukkan **UID** yang Anda salin tadi (JANGAN gunakan Auto-ID).
5. Klik Save.

## 3. Struktur Koleksi Database
Agar aplikasi berjalan lancar, pastikan struktur Firestore mengikuti pola ini:

### Koleksi `admins`
Digunakan untuk mengecek apakah user adalah Guru.
- **Document ID**: User UID
- **Fields**: (Bebas, misal `name: "Nama Guru"`)

### Koleksi `coordinators`
Digunakan untuk siswa yang didelegasikan mengabsen.
- **Document ID**: User UID
- **Fields**:
  - `name`: string
  - `uid`: string (harus sama dengan Document ID)
  - `classId`: string (contoh: `7a`, `8b`)
  - `gender`: string (`ikhwan` atau `akhwat`)
  - `createdAt`: server timestamp

### Koleksi `students`
Data siswa yang akan diabsen.
- **Document ID**: Auto-ID
- **Fields**:
  - `name`: string
  - `classId`: string
  - `gender`: string (`ikhwan` atau `akhwat`)

## 4. Cara Login
1. Jalankan aplikasi (`npm run dev`).
2. Masuk ke halaman `/login`.
3. Gunakan email dan password yang telah didaftarkan di Firebase Auth.
4. Jika UID Anda terdaftar di koleksi `admins` atau `coordinators`, Anda akan diarahkan ke Dashboard.
