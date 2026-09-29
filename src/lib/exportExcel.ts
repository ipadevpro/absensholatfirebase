import * as XLSX from "xlsx";
import { Student, AttendanceStats } from "@/types";

export interface DailyStudentAttendance {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  gender: string;
  dailyStatus: Record<string, string>; // dateStr -> status summary
  totalAttended: number;
  totalTarget: number;
  score: number; // numeric without %
  grade: string;
}

export interface MonthlyStudentSummary {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  gender: string;
  monthlyScores: Record<number, number | null>; // 1-12 -> score or null
  averageScore: number; // numeric without %
  grade: string;
}

export function exportMonthlyReportToXLSX({
  className,
  gender,
  monthName,
  year,
  dates,
  data,
}: {
  className: string;
  gender: string;
  monthName: string;
  year: number;
  dates: string[];
  data: DailyStudentAttendance[];
}) {
  const wb = XLSX.utils.book_new();

  // 1. Prepare Header Rows
  const titleRow = [`LAPORAN ABSENSI SHOLAT BERJAMAAH - KELAS ${className.toUpperCase()} (${gender.toUpperCase()})`];
  const subTitleRow = [`Periode: ${monthName} ${year}`];
  const blankRow: any[] = [];

  // 2. Table Column Headers
  // Format date header to compact "Tgl DD" (e.g. "Tgl 01", "Tgl 02")
  const dateHeaders = dates.map(d => {
    const parts = d.split("-");
    return parts.length === 3 ? `Tgl ${parts[2]}` : d;
  });

  const tableHeaders = [
    "No",
    "Nama Siswa",
    "Kelas",
    "Kategori",
    ...dateHeaders,
    "Total Hadir",
    "Total Target",
    "Nilai",
    "Grade",
  ];

  // 3. Table Data Rows
  const dataRows = data.map((item, idx) => {
    const dateValues = dates.map(d => item.dailyStatus[d] || "-");
    return [
      idx + 1,
      item.studentName,
      item.className,
      item.gender === "ikhwan" ? "Ikhwan" : "Akhwat",
      ...dateValues,
      item.totalAttended,
      item.totalTarget,
      item.score, // pure numeric without %
      item.grade,
    ];
  });

  const allRows = [titleRow, subTitleRow, blankRow, tableHeaders, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Column width hints
  const colWidths = [
    { wch: 5 },  // No
    { wch: 28 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 10 }, // Kategori
    ...dates.map(() => ({ wch: 9 })), // dates
    { wch: 12 }, // Total Hadir
    { wch: 12 }, // Total Target
    { wch: 8 },  // Nilai
    { wch: 8 },  // Grade
  ];
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Rekap Bulanan");
  const fileName = `Laporan_Absen_${className}_${gender}_${monthName}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportComprehensiveReportToXLSX({
  title,
  year,
  monthlySummaries,
  dailyAttendances,
  allDates,
}: {
  title: string;
  year: number;
  monthlySummaries: MonthlyStudentSummary[];
  dailyAttendances: DailyStudentAttendance[];
  allDates: string[];
}) {
  const wb = XLSX.utils.book_new();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // ==========================================
  // SHEET 1: REKAP BULANAN
  // ==========================================
  const s1Title = [`REKAPITULASI KESELURUHAN ABSENSI SHOLAT - ${title.toUpperCase()}`];
  const s1Sub = [`Tahun: ${year} • Nilai tanpa simbol %`];
  const s1Blank: any[] = [];
  const s1Headers = [
    "No",
    "Nama Siswa",
    "Kelas",
    "Kategori",
    ...monthNames,
    "Rata-rata Nilai",
    "Grade",
  ];

  const s1Rows = monthlySummaries.map((item, idx) => {
    const monthCols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
      const val = item.monthlyScores[m];
      return val !== null && val !== undefined ? val : "-";
    });

    return [
      idx + 1,
      item.studentName,
      item.className,
      item.gender === "ikhwan" ? "Ikhwan" : "Akhwat",
      ...monthCols,
      item.averageScore, // numeric without %
      item.grade,
    ];
  });

  const wsMonthly = XLSX.utils.aoa_to_sheet([s1Title, s1Sub, s1Blank, s1Headers, ...s1Rows]);
  wsMonthly["!cols"] = [
    { wch: 5 },  // No
    { wch: 28 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 10 }, // Kategori
    ...monthNames.map(() => ({ wch: 10 })), // 12 months
    { wch: 15 }, // Rata-rata Nilai
    { wch: 8 },  // Grade
  ];
  XLSX.utils.book_append_sheet(wb, wsMonthly, "Rekap Bulanan");

  // ==========================================
  // SHEET 2: DETAIL TANGGAL
  // ==========================================
  if (allDates.length > 0) {
    const s2Title = [`DETAIL HARIAN KEHADIRAN SHOLAT - ${title.toUpperCase()}`];
    const s2Sub = [`Tahun: ${year} • Nilai tanpa simbol %`];
    const s2Headers = [
      "No",
      "Nama Siswa",
      "Kelas",
      "Kategori",
      ...allDates,
      "Total Hadir",
      "Total Target",
      "Nilai",
      "Grade",
    ];

    const s2Rows = dailyAttendances.map((item, idx) => {
      const dateCols = allDates.map(d => item.dailyStatus[d] || "-");
      return [
        idx + 1,
        item.studentName,
        item.className,
        item.gender === "ikhwan" ? "Ikhwan" : "Akhwat",
        ...dateCols,
        item.totalAttended,
        item.totalTarget,
        item.score, // numeric without %
        item.grade,
      ];
    });

    const wsDaily = XLSX.utils.aoa_to_sheet([s2Title, s2Sub, s1Blank, s2Headers, ...s2Rows]);
    wsDaily["!cols"] = [
      { wch: 5 },
      { wch: 28 },
      { wch: 10 },
      { wch: 10 },
      ...allDates.map(() => ({ wch: 12 })),
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDaily, "Detail Tanggal");
  }

  const safeFileName = `Laporan_Keseluruhan_Absen_Sholat_${year}.xlsx`;
  XLSX.writeFile(wb, safeFileName);
}
