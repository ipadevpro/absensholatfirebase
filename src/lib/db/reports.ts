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

  // 3. Extract unique sorted dates and Friday prayer sessions
  const uniqueDates = Array.from(new Set(records.map((r) => r.date as string))).sort();
  const jumatRecords = records.filter((r) => r.prayerType === "jumat");
  const jumatTarget = jumatRecords.length;

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
    let actualTargetPrayers = 0;

    uniqueDates.forEach((d) => {
      const dayRecords = recordsByDate[d] || [];
      if (dayRecords.length === 0) {
        dailyStatus[d] = "-";
        return;
      }

      actualTargetPrayers += dayRecords.length;

      let attendedInDay = 0;
      let hasHaid = false;
      let hasSakit = false;
      let hasIzin = false;
      let hasAlpa = false;

      const isFriday = new Date(d + "T00:00:00").getDay() === 5;
      const jumatRec = isFriday ? dayRecords.find((r) => r.prayerType === "jumat") : undefined;
      const asharRec = isFriday ? dayRecords.find((r) => r.prayerType === "ashar") : undefined;

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

      if (student.gender === "ikhwan" && isFriday && (jumatRec || asharRec)) {
        const jumatStatus = jumatRec?.statuses?.[student.id];
        const asharStatus = asharRec?.statuses?.[student.id];
        const jHadir = jumatStatus === "hadir";
        const aHadir = asharStatus === "hadir";

        if (jHadir && aHadir) {
          dailyStatus[d] = "Jum'at + Ashar";
        } else if (jHadir) {
          dailyStatus[d] = "Jum'at Saja";
        } else if (aHadir) {
          dailyStatus[d] = "Ashar Saja";
        } else if (hasSakit) {
          dailyStatus[d] = "Sakit";
        } else if (hasIzin) {
          dailyStatus[d] = "Izin";
        } else if (hasAlpa) {
          dailyStatus[d] = "Alpa";
        } else {
          dailyStatus[d] = "-";
        }
      } else {
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
      }
    });

    // Calculate Sholat Jumat Score
    let jumatAttended = 0;
    let jumatScore: number | null = null;
    if (student.gender === "ikhwan") {
      jumatRecords.forEach((r) => {
        const s = r.statuses?.[student.id];
        if (s === "hadir" || s === "haid") jumatAttended += 1;
      });
      jumatScore = jumatTarget > 0 ? Math.min(100, Math.round((jumatAttended / jumatTarget) * 100)) : null;
    }

    const score = actualTargetPrayers > 0
      ? Math.min(100, Math.round((totalAttended / actualTargetPrayers) * 100))
      : 0;

    return {
      studentId: student.id,
      studentNis: student.nis,
      studentName: student.name,
      classId,
      className,
      gender,
      dailyStatus,
      totalAttended,
      totalTarget: actualTargetPrayers,
      jumatAttended,
      jumatTarget,
      jumatScore,
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

export async function getRangeAttendanceData({
  classIds,
  gender,
  year,
  startMonth,
  endMonth,
}: {
  classIds: string[];
  gender?: string;
  year: number;
  startMonth: number;
  endMonth: number;
}): Promise<{
  monthlySummaries: MonthlyStudentSummary[];
  dailyAttendances: DailyStudentAttendance[];
  allDates: string[];
}> {
  if (classIds.length === 0) {
    return { monthlySummaries: [], dailyAttendances: [], allDates: [] };
  }

  // 1. Fetch students across classIds (chunked)
  const students: Student[] = [];
  const chunkSize = 25;
  for (let i = 0; i < classIds.length; i += chunkSize) {
    const chunk = classIds.slice(i, i + chunkSize);
    let q = query(collection(db, "students"), where("classId", "in", chunk));
    if (gender && gender !== "all") {
      q = query(collection(db, "students"), where("classId", "in", chunk), where("gender", "==", gender));
    }
    const snap = await getDocs(q);
    snap.docs.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() } as Student);
    });
  }

  // 2. Fetch all attendance records within the selected month range
  const startDateStr = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(year, endMonth, 0).getDate();
  const endDateStr = `${year}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const records: any[] = [];
  for (let i = 0; i < classIds.length; i += chunkSize) {
    const chunk = classIds.slice(i, i + chunkSize);
    let q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where("classId", "in", chunk),
      where("date", ">=", startDateStr),
      where("date", "<=", endDateStr)
    );
    if (gender && gender !== "all") {
      q = query(
        collection(db, ATTENDANCE_COLLECTION),
        where("classId", "in", chunk),
        where("gender", "==", gender),
        where("date", ">=", startDateStr),
        where("date", "<=", endDateStr)
      );
    }
    const snap = await getDocs(q);
    snap.docs.forEach((doc) => records.push(doc.data()));
  }

  // 3. Extract unique sorted dates
  const allDates = Array.from(new Set(records.map((r) => r.date as string))).sort();

  // Index records by date and month
  const recordsByDate: Record<string, any[]> = {};
  const recordsByMonth: Record<number, any[]> = {};

  records.forEach((r) => {
    if (!recordsByDate[r.date]) recordsByDate[r.date] = [];
    recordsByDate[r.date].push(r);

    const m = parseInt(r.date.split("-")[1], 10);
    if (!recordsByMonth[m]) recordsByMonth[m] = [];
    recordsByMonth[m].push(r);
  });

  // Calculate actual target prayers per class & gender per month (ADIL)
  const targetSessionsByClassGenderMonth: Record<string, number> = {};
  const jumatSessionsByClassGender: Record<string, number> = {};

  records.forEach((r) => {
    const m = parseInt(r.date.split("-")[1], 10);
    const key = `${r.classId}_${r.gender}_${m}`;
    targetSessionsByClassGenderMonth[key] = (targetSessionsByClassGenderMonth[key] || 0) + 1;

    if (r.prayerType === "jumat") {
      const jKey = `${r.classId}_${r.gender}`;
      jumatSessionsByClassGender[jKey] = (jumatSessionsByClassGender[jKey] || 0) + 1;
    }
  });

  // 4. Build Monthly and Daily Summaries per Student
  const monthlySummaries: MonthlyStudentSummary[] = [];
  const dailyAttendances: DailyStudentAttendance[] = [];

  students.forEach((student) => {
    const className = AVAILABLE_CLASSES.find((c) => c.id === student.classId)?.name || student.classId.toUpperCase();

    // A. Calculate Monthly Scores for selected month range
    const monthlyScores: Record<number, number | null> = {};
    let totalScoreSum = 0;
    let activeMonthsCount = 0;

    for (let m = startMonth; m <= endMonth; m++) {
      const target = targetSessionsByClassGenderMonth[`${student.classId}_${student.gender}_${m}`] || 0;
      if (target === 0) {
        monthlyScores[m] = null;
        continue;
      }

      const monthRecs = (recordsByMonth[m] || []).filter(
        (r) => r.classId === student.classId && r.gender === student.gender
      );

      let attended = 0;
      monthRecs.forEach((r) => {
        const s = r.statuses?.[student.id];
        // Hadir and Haid are counted as positive attendance (ADIL)
        if (s === "hadir" || s === "haid") attended += 1;
      });

      const mScore = Math.min(100, Math.round((attended / target) * 100));
      monthlyScores[m] = mScore;
      totalScoreSum += mScore;
      activeMonthsCount += 1;
    }

    const averageScore = activeMonthsCount > 0 ? Math.round(totalScoreSum / activeMonthsCount) : 0;

    // B. Calculate Sholat Jumat Score (Khusus Ikhwan)
    const jumatTarget = jumatSessionsByClassGender[`${student.classId}_${student.gender}`] || 0;
    let jumatAttended = 0;
    let jumatScore: number | null = null;

    if (student.gender === "ikhwan") {
      const allJumatRecs = records.filter(
        (r) => r.classId === student.classId && r.gender === student.gender && r.prayerType === "jumat"
      );
      allJumatRecs.forEach((r) => {
        const s = r.statuses?.[student.id];
        if (s === "hadir" || s === "haid") jumatAttended += 1;
      });

      jumatScore = jumatTarget > 0 ? Math.min(100, Math.round((jumatAttended / jumatTarget) * 100)) : (jumatTarget === 0 ? null : 0);
    }

    monthlySummaries.push({
      studentId: student.id,
      studentNis: student.nis,
      studentName: student.name,
      classId: student.classId,
      className,
      gender: student.gender,
      monthlyScores,
      jumatAttended,
      jumatTarget,
      jumatScore,
      averageScore,
      grade: getGrade(averageScore),
    });

    // C. Calculate Daily Statuses across allDates
    const dailyStatus: Record<string, string> = {};
    let studentAttendedTotal = 0;
    let studentTotalTarget = 0;

    allDates.forEach((d) => {
      const dayRecords = (recordsByDate[d] || []).filter(
        (r) => r.classId === student.classId && r.gender === student.gender
      );

      if (dayRecords.length === 0) {
        dailyStatus[d] = "-";
        return;
      }

      studentTotalTarget += dayRecords.length;

      let attendedInDay = 0;
      let hasHaid = false;
      let hasSakit = false;
      let hasIzin = false;
      let hasAlpa = false;

      const isFriday = new Date(d + "T00:00:00").getDay() === 5;
      const jumatRec = isFriday ? dayRecords.find((r) => r.prayerType === "jumat") : undefined;
      const asharRec = isFriday ? dayRecords.find((r) => r.prayerType === "ashar") : undefined;

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

      if (student.gender === "ikhwan" && isFriday && (jumatRec || asharRec)) {
        const jumatStatus = jumatRec?.statuses?.[student.id];
        const asharStatus = asharRec?.statuses?.[student.id];
        const jHadir = jumatStatus === "hadir";
        const aHadir = asharStatus === "hadir";

        if (jHadir && aHadir) {
          dailyStatus[d] = "Jum'at + Ashar";
        } else if (jHadir) {
          dailyStatus[d] = "Jum'at Saja";
        } else if (aHadir) {
          dailyStatus[d] = "Ashar Saja";
        } else if (hasSakit) {
          dailyStatus[d] = "Sakit";
        } else if (hasIzin) {
          dailyStatus[d] = "Izin";
        } else if (hasAlpa) {
          dailyStatus[d] = "Alpa";
        } else {
          dailyStatus[d] = "-";
        }
      } else {
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
      }
    });

    const overallScore = studentTotalTarget > 0
      ? Math.min(100, Math.round((studentAttendedTotal / studentTotalTarget) * 100))
      : 0;

    dailyAttendances.push({
      studentId: student.id,
      studentNis: student.nis,
      studentName: student.name,
      classId: student.classId,
      className,
      gender: student.gender,
      dailyStatus,
      totalAttended: studentAttendedTotal,
      totalTarget: studentTotalTarget,
      jumatAttended,
      jumatTarget,
      jumatScore,
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

export async function getOverallAttendanceData(
  classIds: string[],
  year: number
): Promise<{
  monthlySummaries: MonthlyStudentSummary[];
  dailyAttendances: DailyStudentAttendance[];
  allDates: string[];
}> {
  return getRangeAttendanceData({
    classIds,
    gender: "all",
    year,
    startMonth: 1,
    endMonth: 12,
  });
}
