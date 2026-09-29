import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AttendanceStats, Student } from "@/types";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { DailyStudentAttendance, MonthlyStudentSummary } from "@/lib/exportExcel";

const ATTENDANCE_COLLECTION = "attendance";

export function getGrade(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "E";
}

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
}

export async function getAttendanceStats(
  classId: string,
  gender: string,
  year: number,
  month: number
): Promise<AttendanceStats[]> {
  const { start, end } = getMonthRange(year, month);

  // 1. Fetch Students
  const studentsQuery = query(
    collection(db, "students"),
    where("classId", "==", classId),
    where("gender", "==", gender)
  );
  const studentsSnapshot = await getDocs(studentsQuery);
  const students = studentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Student[];

  // 2. Fetch Attendance Records
  const attendanceQuery = query(
    collection(db, ATTENDANCE_COLLECTION),
    where("classId", "==", classId),
    where("gender", "==", gender),
    where("date", ">=", start),
    where("date", "<=", end)
  );
  const attendanceSnapshot = await getDocs(attendanceQuery);
  const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data());

  // 3. Count Unique Days that have at least one record
  const uniqueDates = new Set(attendanceRecords.map(r => r.date));
  const totalDaysRecorded = uniqueDates.size;

  // 4. Calculate Stats per Student
  const stats: AttendanceStats[] = students.map((student) => {
    let attendedCount = 0;

    attendanceRecords.forEach((record) => {
      if (record.statuses) {
        const status = record.statuses[student.id];
        // Hadir and Haid are counted as positive attendance
        if (status === "hadir" || status === "haid") {
          attendedCount += 1;
        }
      } else if (record.presentStudents && record.presentStudents.includes(student.id)) {
        // Fallback for legacy format
        attendedCount += 1;
      }
    });

    const targetPrayers = totalDaysRecorded * 2;
    const percentage = targetPrayers > 0 
      ? Math.min(100, Math.round((attendedCount / targetPrayers) * 100)) 
      : 0;

    return {
      studentId: student.id,
      studentName: student.name,
      totalPrayers: targetPrayers,
      attended: attendedCount,
      percentage,
    };
  });

  return stats.sort((a, b) => b.percentage - a.percentage);
}

export async function getDetailedMonthlyData(
  classId: string,
  gender: string,
  year: number,
  month: number
): Promise<{
  className: string;
  dates: string[];
  data: DailyStudentAttendance[];
  stats: AttendanceStats[];
}> {
  const { start, end } = getMonthRange(year, month);
  const className = AVAILABLE_CLASSES.find((c) => c.id === classId)?.name || classId.toUpperCase();

  // 1. Fetch Students
  const studentsQuery = query(
    collection(db, "students"),
    where("classId", "==", classId),
    where("gender", "==", gender)
  );
  const studentsSnapshot = await getDocs(studentsQuery);
  const students = studentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Student[];

  // 2. Fetch Attendance Records
  const attendanceQuery = query(
    collection(db, ATTENDANCE_COLLECTION),
    where("classId", "==", classId),
    where("gender", "==", gender),
    where("date", ">=", start),
    where("date", "<=", end)
  );
  const attendanceSnapshot = await getDocs(attendanceQuery);
  const records = attendanceSnapshot.docs.map((doc) => doc.data());

  // 3. Extract unique sorted dates
  const uniqueDates = Array.from(new Set(records.map((r) => r.date as string))).sort();
  const totalDays = uniqueDates.length;
  const targetPrayers = totalDays * 2;

  // 4. Map records by date
  const recordsByDate: Record<string, any[]> = {};
  records.forEach((r) => {
    if (!recordsByDate[r.date]) recordsByDate[r.date] = [];
    recordsByDate[r.date].push(r);
  });

  // 5. Build daily attendance per student
  const dailyData: DailyStudentAttendance[] = students.map((student) => {
    const dailyStatus: Record<string, string> = {};
    let totalAttended = 0;

    uniqueDates.forEach((d) => {
      const dayRecords = recordsByDate[d] || [];
      let attendedInDay = 0;
      let hasHaid = false;
      let hasSakit = false;
      let hasIzin = false;
      let hasAlpa = false;

      dayRecords.forEach((r) => {
        const s = r.statuses?.[student.id];
        if (s === "hadir") attendedInDay += 1;
        else if (s === "haid") {
          attendedInDay += 1;
          hasHaid = true;
        } else if (s === "sakit") hasSakit = true;
        else if (s === "izin") hasIzin = true;
        else if (s === "alpa") hasAlpa = true;
      });

      totalAttended += attendedInDay;

      if (dayRecords.length === 0) {
        dailyStatus[d] = "-";
      } else if (attendedInDay === dayRecords.length) {
        dailyStatus[d] = hasHaid ? "Haid" : "Hadir";
      } else if (attendedInDay > 0) {
        dailyStatus[d] = `${attendedInDay} Sholat`;
      } else if (hasSakit) {
        dailyStatus[d] = "Sakit";
      } else if (hasIzin) {
        dailyStatus[d] = "Izin";
      } else if (hasAlpa) {
        dailyStatus[d] = "Alpa";
      } else {
        dailyStatus[d] = "-";
      }
    });

    const score = targetPrayers > 0
      ? Math.min(100, Math.round((totalAttended / targetPrayers) * 100))
      : 0;

    return {
      studentId: student.id,
      studentName: student.name,
      classId,
      className,
      gender,
      dailyStatus,
      totalAttended,
      totalTarget: targetPrayers,
      score,
      grade: getGrade(score),
    };
  });

  dailyData.sort((a, b) => b.score - a.score || a.studentName.localeCompare(b.studentName));

  const stats: AttendanceStats[] = dailyData.map((d) => ({
    studentId: d.studentId,
    studentName: d.studentName,
    totalPrayers: d.totalTarget,
    attended: d.totalAttended,
    percentage: d.score,
  }));

  return {
    className,
    dates: uniqueDates,
    data: dailyData,
    stats,
  };
}

export async function getOverallAttendanceData(
  classIds: string[],
  year: number
): Promise<{
  monthlySummaries: MonthlyStudentSummary[];
  dailyAttendances: DailyStudentAttendance[];
  allDates: string[];
}> {
  if (classIds.length === 0) {
    return { monthlySummaries: [], dailyAttendances: [], allDates: [] };
  }

  // 1. Fetch all students across classIds (chunk in groups of 30 if needed)
  const students: Student[] = [];
  const chunkSize = 25;
  for (let i = 0; i < classIds.length; i += chunkSize) {
    const chunk = classIds.slice(i, i + chunkSize);
    const q = query(collection(db, "students"), where("classId", "in", chunk));
    const snap = await getDocs(q);
    snap.docs.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() } as Student);
    });
  }

  // 2. Fetch all attendance records for these classes within the year
  const startYear = `${year}-01-01`;
  const endYear = `${year}-12-31`;
  const records: any[] = [];

  for (let i = 0; i < classIds.length; i += chunkSize) {
    const chunk = classIds.slice(i, i + chunkSize);
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where("classId", "in", chunk),
      where("date", ">=", startYear),
      where("date", "<=", endYear)
    );
    const snap = await getDocs(q);
    snap.docs.forEach((doc) => records.push(doc.data()));
  }

  // 3. Collect unique sorted dates across the entire year
  const allDates = Array.from(new Set(records.map((r) => r.date as string))).sort();

  // Index records by date
  const recordsByDate: Record<string, any[]> = {};
  // Index records by month (1-12)
  const recordsByMonth: Record<number, any[]> = {};

  records.forEach((r) => {
    if (!recordsByDate[r.date]) recordsByDate[r.date] = [];
    recordsByDate[r.date].push(r);

    const m = parseInt(r.date.split("-")[1], 10);
    if (!recordsByMonth[m]) recordsByMonth[m] = [];
    recordsByMonth[m].push(r);
  });

  // Unique days per month
  const uniqueDaysPerMonth: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    const monthRecs = recordsByMonth[m] || [];
    uniqueDaysPerMonth[m] = new Set(monthRecs.map((r) => r.date)).size;
  }

  const overallTotalDays = allDates.length;
  const overallTargetPrayers = overallTotalDays * 2;

  // 4. Build Monthly and Daily Summaries per Student
  const monthlySummaries: MonthlyStudentSummary[] = [];
  const dailyAttendances: DailyStudentAttendance[] = [];

  students.forEach((student) => {
    const className = AVAILABLE_CLASSES.find((c) => c.id === student.classId)?.name || student.classId.toUpperCase();

    // A. Calculate Monthly Scores
    const monthlyScores: Record<number, number | null> = {};
    let totalScoreSum = 0;
    let activeMonthsCount = 0;

    for (let m = 1; m <= 12; m++) {
      const monthDays = uniqueDaysPerMonth[m] || 0;
      if (monthDays === 0) {
        monthlyScores[m] = null;
        continue;
      }

      const target = monthDays * 2;
      const monthRecs = (recordsByMonth[m] || []).filter(
        (r) => r.classId === student.classId && r.gender === student.gender
      );

      let attended = 0;
      monthRecs.forEach((r) => {
        const s = r.statuses?.[student.id];
        if (s === "hadir" || s === "haid") attended += 1;
      });

      const mScore = Math.min(100, Math.round((attended / target) * 100));
      monthlyScores[m] = mScore;
      totalScoreSum += mScore;
      activeMonthsCount += 1;
    }

    const averageScore = activeMonthsCount > 0 ? Math.round(totalScoreSum / activeMonthsCount) : 0;

    monthlySummaries.push({
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      className,
      gender: student.gender,
      monthlyScores,
      averageScore,
      grade: getGrade(averageScore),
    });

    // B. Calculate Daily Statuses across allDates
    const dailyStatus: Record<string, string> = {};
    let studentAttendedTotal = 0;

    allDates.forEach((d) => {
      const dayRecords = (recordsByDate[d] || []).filter(
        (r) => r.classId === student.classId && r.gender === student.gender
      );

      if (dayRecords.length === 0) {
        dailyStatus[d] = "-";
        return;
      }

      let attendedInDay = 0;
      let hasHaid = false;
      let hasSakit = false;
      let hasIzin = false;
      let hasAlpa = false;

      dayRecords.forEach((r) => {
        const s = r.statuses?.[student.id];
        if (s === "hadir") attendedInDay += 1;
        else if (s === "haid") {
          attendedInDay += 1;
          hasHaid = true;
        } else if (s === "sakit") hasSakit = true;
        else if (s === "izin") hasIzin = true;
        else if (s === "alpa") hasAlpa = true;
      });

      studentAttendedTotal += attendedInDay;

      if (attendedInDay === dayRecords.length) {
        dailyStatus[d] = hasHaid ? "Haid" : "Hadir";
      } else if (attendedInDay > 0) {
        dailyStatus[d] = `${attendedInDay} Sholat`;
      } else if (hasSakit) {
        dailyStatus[d] = "Sakit";
      } else if (hasIzin) {
        dailyStatus[d] = "Izin";
      } else if (hasAlpa) {
        dailyStatus[d] = "Alpa";
      } else {
        dailyStatus[d] = "-";
      }
    });

    const overallScore = overallTargetPrayers > 0
      ? Math.min(100, Math.round((studentAttendedTotal / overallTargetPrayers) * 100))
      : 0;

    dailyAttendances.push({
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      className,
      gender: student.gender,
      dailyStatus,
      totalAttended: studentAttendedTotal,
      totalTarget: overallTargetPrayers,
      score: overallScore,
      grade: getGrade(overallScore),
    });
  });

  monthlySummaries.sort((a, b) => b.averageScore - a.averageScore || a.studentName.localeCompare(b.studentName));
  dailyAttendances.sort((a, b) => b.score - a.score || a.studentName.localeCompare(b.studentName));

  return {
    monthlySummaries,
    dailyAttendances,
    allDates,
  };
}
