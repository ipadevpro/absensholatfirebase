"use server";

import { adminDb } from "@/lib/firebase/admin";

export interface StudentAttendanceResult {
  success: boolean;
  status?: number;
  error?: string;
  student?: {
    id: string;
    nis: string | null;
    name: string;
    classId: string;
    gender: string;
  };
  period?: {
    year?: number;
    month?: number;
  };
  stats?: {
    totalDays: number;
    totalPrayers: number;
    attended: number;
    score: number; // numeric without %
    grade: string;
    summary: {
      hadir: number;
      haid: number;
      sakit: number;
      izin: number;
      alpa: number;
    };
  };
  history?: Array<{
    date: string;
    prayer: string;
    status: string;
  }>;
}

function calculateGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}

/**
 * Mengambil data kehadiran & nilai sholat siswa berdasarkan NIS (atau Document ID)
 * Menggunakan Firebase Admin SDK di sisi server.
 */
export async function getStudentAttendanceByNis(
  nisOrId: string,
  options?: { year?: number; month?: number }
): Promise<StudentAttendanceResult> {
  const queryTerm = String(nisOrId || "").trim();
  if (!queryTerm) {
    return {
      success: false,
      status: 400,
      error: "NIS atau ID siswa tidak boleh kosong",
    };
  }

  try {
    // 1. Cari siswa di Firestore berdasarkan field 'nis'
    let studentDoc: FirebaseFirestore.DocumentSnapshot | null = null;

    const snapByNis = await adminDb
      .collection("students")
      .where("nis", "==", queryTerm)
      .limit(1)
      .get();

    if (!snapByNis.empty) {
      studentDoc = snapByNis.docs[0];
    } else {
      // Fallback: Jika field NIS belum terisi di database, cek apakah parameter merupakan ID dokumen
      const byId = await adminDb.collection("students").doc(queryTerm).get();
      if (byId.exists) {
        studentDoc = byId;
      }
    }

    if (!studentDoc || !studentDoc.exists) {
      return {
        success: false,
        status: 404,
        error: `Siswa dengan NIS/ID '${queryTerm}' tidak ditemukan`,
      };
    }

    const sData = studentDoc.data()!;
    const student = {
      id: studentDoc.id,
      nis: sData.nis ? String(sData.nis) : null,
      name: sData.name || "",
      classId: sData.classId || "",
      gender: sData.gender || "",
    };

    // 2. Query data absensi sholat berdasarkan kelas & gender siswa
    let queryRef: FirebaseFirestore.Query = adminDb
      .collection("attendance")
      .where("classId", "==", student.classId)
      .where("gender", "==", student.gender);

    if (options?.year && options?.month) {
      const y = options.year;
      const m = String(options.month).padStart(2, "0");
      const lastDay = new Date(y, options.month, 0).getDate();
      queryRef = queryRef
        .where("date", ">=", `${y}-${m}-01`)
        .where("date", "<=", `${y}-${m}-${String(lastDay).padStart(2, "0")}`);
    } else if (options?.year) {
      const y = options.year;
      queryRef = queryRef
        .where("date", ">=", `${y}-01-01`)
        .where("date", "<=", `${y}-12-31`);
    }

    const attendanceSnap = await queryRef.get();
    const records = attendanceSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as any[];

    // 3. Hitung hari efektif & nilai kehadiran
    const uniqueDates = new Set(records.map((r) => r.date));
    const totalDays = uniqueDates.size;
    const targetPrayers = totalDays * 2;

    let attendedCount = 0;
    const summary = {
      hadir: 0,
      haid: 0,
      sakit: 0,
      izin: 0,
      alpa: 0,
    };

    const history: Array<{
      date: string;
      prayer: string;
      status: string;
    }> = [];

    // Urutkan riwayat berdasarkan tanggal
    records.sort((a, b) => a.date.localeCompare(b.date));

    records.forEach((r) => {
      const st = r.statuses?.[student.id];
      if (st) {
        if (st === "hadir") {
          attendedCount += 1;
          summary.hadir += 1;
        } else if (st === "haid") {
          // Haid dihitung hadir penuh untuk akhwat
          attendedCount += 1;
          summary.haid += 1;
        } else if (st === "sakit") {
          summary.sakit += 1;
        } else if (st === "izin") {
          summary.izin += 1;
        } else if (st === "alpa") {
          summary.alpa += 1;
        }

        history.push({
          date: r.date,
          prayer: r.prayerType,
          status: st,
        });
      }
    });

    // Nilai angka murni 0 - 100 tanpa simbol %
    const score = targetPrayers > 0
      ? Math.min(100, Math.round((attendedCount / targetPrayers) * 100))
      : 0;

    return {
      success: true,
      student,
      period: {
        year: options?.year,
        month: options?.month,
      },
      stats: {
        totalDays,
        totalPrayers: targetPrayers,
        attended: attendedCount,
        score,
        grade: calculateGrade(score),
        summary,
      },
      history,
    };
  } catch (error: any) {
    console.error("Error getStudentAttendanceByNis:", error);
    return {
      success: false,
      status: 500,
      error: error.message || "Gagal mengambil data absensi siswa",
    };
  }
}
