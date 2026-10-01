# 📖 Panduan Integrasi API Nilai & Absensi Sholat Siswa (Untuk Developer & AI Agent)

Panduan ini ditujukan bagi pengembang (developer) maupun **AI Coding Agent** (Cursor, Claude Code, Copilot, ChatGPT, v0, dll) yang ingin menghubungkan aplikasi web/backend lain ke sistem Absensi Sholat.

---

## 🔑 Informasi Kredensial & Autentikasi

- **Base URL**: `https://[DOMAIN-ABSEN-SHOLAT]` (misal: `https://absensholatpgii.vercel.app` atau `http://localhost:3000` saat development)
- **API Key**: `sholat-api-key-2026`
- **CORS Status**: ✅ Diizinkan dari semua domain (`Access-Control-Allow-Origin: *`)

### Cara Mengirimkan API Key:
Pilih salah satu metode berikut (diutamakan menggunakan Header):

1. **Header `x-api-key` (Direkomendasikan)**:
   ```http
   x-api-key: sholat-api-key-2026
   ```
2. **Header `Authorization` (Bearer)**:
   ```http
   Authorization: Bearer sholat-api-key-2026
   ```
3. **Query Parameter `apiKey`**:
   ```http
   ?nis=12345&apiKey=sholat-api-key-2026
   ```

---

## 📡 Endpoint: Ambil Data Absensi & Nilai Siswa

- **Method**: `GET`
- **Path**: `/api/students/attendance`

### Query Parameters

| Parameter | Tipe | Wajib? | Deskripsi | Contoh |
| :--- | :--- | :--- | :--- | :--- |
| `nis` | `string` | **Ya** | Nomor Induk Siswa. *(Jika siswa belum punya NIS, bisa diisi dengan Firestore Student Document ID)*. | `212207001` |
| `apiKey` | `string` | Opsional | API Key jika tidak dikirim via HTTP Header. | `sholat-api-key-2026` |
| `year` | `number` | Opsional | Filter tahun rekapan absensi (default: semua data). | `2026` |
| `month` | `number` | Opsional | Filter bulan rekapan (1 - 12) (default: semua data). | `9` |

---

## 📋 Response Schema (JSON)

### 1. HTTP 200 (Sukses)
```json
{
  "success": true,
  "student": {
    "id": "A8kL90PqZ",
    "nis": "212207001",
    "name": "Ahmad Fauzi",
    "classId": "7a",
    "gender": "ikhwan"
  },
  "stats": {
    "totalDays": 20,
    "totalPrayers": 40,
    "attended": 38,
    "score": 95,
    "grade": "A",
    "summary": {
      "hadir": 36,
      "haid": 2,
      "sakit": 1,
      "izin": 1,
      "alpa": 0
    }
  },
  "records": [
    {
      "id": "2026-09-01_7a_ikhwan_zuhur",
      "date": "2026-09-01",
      "prayerType": "zuhur",
      "status": "hadir"
    }
  ]
}
```

### Keterangan Field Nilai (`stats`):
- `attended`: Jumlah sholat yang dihadiri (`hadir` + `haid` dihitung hadir).
- `score`: Angka nilai murni `0` - `100` **tanpa simbol %** (siap diolah/disimpan ke database nilai rapor).
- `grade`: Predikat huruf:
  - `A`: 85 - 100
  - `B`: 75 - 84
  - `C`: 65 - 74
  - `D`: 50 - 64
  - `E`: < 50

### 2. HTTP 401 (Unauthorized - API Key Salah / Kosong)
```json
{
  "success": false,
  "error": "Unauthorized: API Key tidak valid atau tidak disertakan. Sertakan header 'x-api-key: sholat-api-key-2026' atau parameter query '?apiKey=sholat-api-key-2026'."
}
```

### 3. HTTP 404 (Siswa Tidak Ditemukan)
```json
{
  "success": false,
  "status": 404,
  "error": "Siswa dengan NIS \"99999\" tidak ditemukan"
}
```

---

## 🤖 Prompt Template untuk AI Agent Lain

Jika Anda meminta AI Agent di proyek lain untuk mengintegrasikan data ini, gunakan instruksi berikut:

```text
Tolong buatkan fungsi/komponen untuk mengambil data nilai dan absensi sholat siswa dari API eksternal:
- Endpoint: https://[DOMAIN_ABSEN_SHOLAT]/api/students/attendance
- Method: GET
- Headers: 
  "x-api-key": "sholat-api-key-2026"
- Query Params:
  nis: [nis_siswa]
  year: [tahun] (opsional)
  month: [bulan] (opsional)

Simpan dan tampilkan nilai angka (data.stats.score) dan predikat (data.stats.grade), serta rincian kehadiran (data.stats.summary.hadir, dll). Tangani status loading, error 404 jika siswa tidak ditemukan, dan error 401 jika API key invalid.
```

---

## 💻 Contoh Implementasi Kode

### A. TypeScript / Next.js / React (Client atau Server Component)
```typescript
interface StudentAttendanceResponse {
  success: boolean;
  student: {
    id: string;
    nis?: string;
    name: string;
    classId: string;
    gender: 'ikhwan' | 'akhwat';
  };
  stats: {
    totalDays: number;
    totalPrayers: number;
    attended: number;
    score: number; // Nilai angka 0 - 100
    grade: 'A' | 'B' | 'C' | 'D' | 'E';
    summary: {
      hadir: number;
      haid: number;
      sakit: number;
      izin: number;
      alpa: number;
    };
  };
  records: Array<{
    id: string;
    date: string;
    prayerType: 'subuh' | 'zuhur' | 'ashar' | 'maghrib' | 'isya' | 'dhuha' | 'tahajjud';
    status: 'hadir' | 'haid' | 'sakit' | 'izin' | 'alpa';
  }>;
}

export async function fetchStudentScore(nis: string, year?: number, month?: number): Promise<StudentAttendanceResponse> {
  const BASE_URL = process.env.NEXT_PUBLIC_SHOLAT_API_URL || "https://[DOMAIN_ABSEN_SHOLAT]";
  const API_KEY = "sholat-api-key-2026";

  const url = new URL(`${BASE_URL}/api/students/attendance`);
  url.searchParams.set("nis", nis);
  if (year) url.searchParams.set("year", year.toString());
  if (month) url.searchParams.set("month", month.toString());

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    // cache: "no-store", // opsional di Next.js App Router
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Gagal mengambil data absensi siswa");
  }

  return data;
}
```

---

### B. Node.js (Fetch / Axios)
```javascript
import axios from "axios";

async function getStudentAttendance(nis) {
  try {
    const res = await axios.get("https://[DOMAIN_ABSEN_SHOLAT]/api/students/attendance", {
      params: { nis },
      headers: { "x-api-key": "sholat-api-key-2026" }
    });
    console.log("Nilai Siswa:", res.data.stats.score);
    return res.data;
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
```

---

### C. Python (Requests)
```python
import requests

def get_student_score(nis: str, base_url: str = "https://[DOMAIN_ABSEN_SHOLAT]"):
    headers = {
        "x-api-key": "sholat-api-key-2026"
    }
    params = {
        "nis": nis
    }
    response = requests.get(f"{base_url}/api/students/attendance", headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Nama: {data['student']['name']}")
        print(f"Nilai: {data['stats']['score']} (Grade {data['stats']['grade']})")
        return data
    else:
        print("Error:", response.json().get("error"))
        return None
```

---

### D. PHP (cURL)
```php
<?php
$nis = "212207001";
$url = "https://[DOMAIN_ABSEN_SHOLAT]/api/students/attendance?nis=" . urlencode($nis);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "x-api-key: sholat-api-key-2026",
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
if ($httpCode === 200 && $result['success']) {
    echo "Nilai: " . $result['stats']['score'];
} else {
    echo "Gagal: " . ($result['error'] ?? 'Terjadi kesalahan');
}
?>
```

---

### E. Google Apps Script (Spreadsheet Automations)
```javascript
function getAttendanceByNis(nis) {
  var url = "https://[DOMAIN_ABSEN_SHOLAT]/api/students/attendance?nis=" + encodeURIComponent(nis);
  var options = {
    method: "get",
    headers: {
      "x-api-key": "sholat-api-key-2026"
    },
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() === 200 && json.success) {
    return json.stats.score; // Mengembalikan nilai angka untuk cell spreadsheet
  } else {
    return "Error: " + (json.error || "Data tidak ditemukan");
  }
}
```
