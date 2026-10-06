import * as XLSX from "xlsx";
import { Student, AttendanceStats } from "@/types";

export interface DailyStudentAttendance {
  studentId: string;
  studentNis?: string;
  studentName: string;
  classId: string;
  className: string;
  gender: string;
  dailyStatus: Record<string, string>; // dateStr -> status summary
  totalAttended: number;
  totalTarget: number;
  score: number; // numeric without %
  grade: string;
  jumatAttended?: number;
  jumatTarget?: number;
  jumatScore?: number | null;
}

export interface MonthlyStudentSummary {
  studentId: string;
  studentNis?: string;
  studentName: string;
  classId: string;
  className: string;
  gender: string;
  monthlyScores: Record<number, number | null>; // 1-12 -> score or null
  jumatAttended?: number;
  jumatTarget?: number;
  jumatScore?: number | null;
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
  const subTitleRow = [`Periode: ${monthName} ${year} • Nilai tanpa simbol % • Haid dihitung hadir`];
  const blankRow: any[] = [];

  // 2. Table Column Headers
  const dateHeaders = dates.map(d => {
    const parts = d.split("-");
    return parts.length === 3 ? `Tgl ${parts[2]}` : d;
  });

  const tableHeaders = [
    "No",
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Kategori",
    ...dateHeaders,
    "Total Hadir",
    "Total Target",
    "Nilai Sholat Jum'at",
    "Nilai",
    "Grade",
  ];

  // 3. Table Data Rows
  const dataRows = data.map((item, idx) => {
    const dateValues = dates.map(d => item.dailyStatus[d] || "-");
    const jumatCol = item.gender === "ikhwan"
      ? (item.jumatScore !== null && item.jumatScore !== undefined ? item.jumatScore : "-")
      : "-";

    return [
      idx + 1,
      item.studentNis || "-",
      item.studentName,
      item.className,
      item.gender === "ikhwan" ? "Ikhwan" : "Akhwat",
      ...dateValues,
      item.totalAttended,
      item.totalTarget,
      jumatCol,
      item.score, // pure numeric without %
      item.grade,
    ];
  });

  const allRows = [titleRow, subTitleRow, blankRow, tableHeaders, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  const colWidths = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 28 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 10 }, // Kategori
    ...dates.map(() => ({ wch: 10 })), // dates
    { wch: 12 }, // Total Hadir
    { wch: 12 }, // Total Target
    { wch: 20 }, // Nilai Sholat Jum'at
    { wch: 8 },  // Nilai
    { wch: 8 },  // Grade
  ];
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Rekap Bulanan");
  const fileName = `Laporan_Absen_${className}_${gender}_${monthName}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportRangeReportToXLSX({
  title,
  year,
  startMonth,
  endMonth,
  monthlySummaries,
  dailyAttendances,
  allDates,
}: {
  title: string;
  year: number;
  startMonth: number;
  endMonth: number;
  monthlySummaries: MonthlyStudentSummary[];
  dailyAttendances: DailyStudentAttendance[];
  allDates: string[];
}) {
  const wb = XLSX.utils.book_new();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const selectedMonths: number[] = [];
  for (let m = startMonth; m <= endMonth; m++) {
    selectedMonths.push(m);
  }
  const selectedMonthHeaders = selectedMonths.map(m => monthNames[m - 1]);

  let periodLabel = `${monthNames[startMonth - 1]} - ${monthNames[endMonth - 1]}`;
  if (startMonth === endMonth) {
    periodLabel = monthNames[startMonth - 1];
  } else if (startMonth === 7 && endMonth === 12) {
    periodLabel = `Semester Ganjil (${monthNames[startMonth - 1]} - ${monthNames[endMonth - 1]})`;
  } else if (startMonth === 1 && endMonth === 6) {
    periodLabel = `Semester Genap (${monthNames[startMonth - 1]} - ${monthNames[endMonth - 1]})`;
  } else if (startMonth === 1 && endMonth === 12) {
    periodLabel = `1 Tahun Penuh`;
  }

  // ==========================================
  // SHEET 1: REKAP NILAI (RENTANG BULAN / SEMESTER)
  // ==========================================
  const s1Title = [`REKAPITULASI NILAI ABSENSI SHOLAT - ${title.toUpperCase()}`];
  const s1Sub = [`Periode: ${periodLabel} ${year} • Nilai tanpa simbol % • Haid dihitung hadir`];
  const s1Blank: any[] = [];
  const s1Headers = [
    "No",
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Kategori",
    ...selectedMonthHeaders,
    "Nilai Sholat Jum'at",
    "Rata-rata Nilai",
    "Grade",
  ];

  const s1Rows = monthlySummaries.map((item, idx) => {
    const monthCols = selectedMonths.map(m => {
      const val = item.monthlyScores[m];
      return val !== null && val !== undefined ? val : "-";
    });

    const jumatCol = item.gender === "ikhwan"
      ? (item.jumatScore !== null && item.jumatScore !== undefined ? item.jumatScore : "-")
      : "-";

    return [
      idx + 1,
      item.studentNis || "-",
      item.studentName,
      item.className,
      item.gender === "ikhwan" ? "Ikhwan" : "Akhwat",
      ...monthCols,
      jumatCol,
      item.averageScore,
      item.grade,
    ];
  });

  const wsMonthly = XLSX.utils.aoa_to_sheet([s1Title, s1Sub, s1Blank, s1Headers, ...s1Rows]);
  wsMonthly["!cols"] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 28 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 10 }, // Kategori
    ...selectedMonths.map(() => ({ wch: 12 })), // Month columns
    { wch: 20 }, // Nilai Sholat Jum'at
    { wch: 15 }, // Rata-rata Nilai
    { wch: 8 },  // Grade
  ];
  XLSX.utils.book_append_sheet(wb, wsMonthly, "Rekap Nilai");

  // ==========================================
  // SHEET 2: DETAIL TANGGAL / HARIAN
  // ==========================================
  if (allDates.length > 0) {
    const s2Title = [`DETAIL HARIAN KEHADIRAN SHOLAT - ${title.toUpperCase()}`];
    const s2Sub = [`Periode: ${periodLabel} ${year} • Nilai tanpa simbol % • Haid dihitung hadir`];
    const s2Headers = [
      "No",
      "NIS",
      "Nama Siswa",
      "Kelas",
      "Kategori",
      ...allDates,
      "Total Hadir",
      "Total Target",
      "Nilai Sholat Jum'at",
      "Nilai Akhir",
      "Grade",
    ];

    const s2Rows = dailyAttendances.map((item, idx) => {
      const dateCols = allDates.map(d => item.dailyStatus[d] || "-");
      const jumatCol = item.gender === "ikhwan"
        ? (item.jumatScore !== null && item.jumatScore !== undefined ? item.jumatScore : "-")
        : "-";

      return [
        idx + 1,
        item.studentNis || "-",
        item.studentName,
        item.className,
        item.gender === "ikhwan" ? "Ikhwan" : "Akhwat",
        ...dateCols,
        item.totalAttended,
        item.totalTarget,
        jumatCol,
        item.score,
        item.grade,
      ];
    });

    const wsDaily = XLSX.utils.aoa_to_sheet([s2Title, s2Sub, s1Blank, s2Headers, ...s2Rows]);
    wsDaily["!cols"] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 28 },
      { wch: 10 },
      { wch: 10 },
      ...allDates.map(() => ({ wch: 14 })),
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 10 },
      { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDaily, "Detail Tanggal");
  }

  let fileSlug = `Bulan_${startMonth}_sd_${endMonth}`;
  if (startMonth === 7 && endMonth === 12) fileSlug = "Semester_Ganjil";
  else if (startMonth === 1 && endMonth === 6) fileSlug = "Semester_Genap";
  else if (startMonth === 1 && endMonth === 12) fileSlug = "1_Tahun";
  else if (startMonth === endMonth) fileSlug = `Bulan_${monthNames[startMonth - 1]}`;

  const safeFileName = `Laporan_Absen_Sholat_${fileSlug}_${year}.xlsx`;
  XLSX.writeFile(wb, safeFileName);
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
  exportRangeReportToXLSX({
    title,
    year,
    startMonth: 1,
    endMonth: 12,
    monthlySummaries,
    dailyAttendances,
    allDates,
  });
}

