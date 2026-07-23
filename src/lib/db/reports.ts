import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AttendanceStats, Student } from "@/types";

const ATTENDANCE_COLLECTION = "attendance";

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

    // Percentage logic: 
    // Denominator is (Number of unique days * 2 prayers per day)
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
