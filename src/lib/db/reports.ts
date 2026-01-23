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

  const studentsQuery = query(
    collection(db, "students"),
    where("classId", "==", classId)
  );
  const studentsSnapshot = await getDocs(studentsQuery);
  const students = studentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Student[];

  const attendanceQuery = query(
    collection(db, ATTENDANCE_COLLECTION),
    where("classId", "==", classId),
    where("gender", "==", gender),
    where("date", ">=", start),
    where("date", "<=", end)
  );
  const attendanceSnapshot = await getDocs(attendanceQuery);
  const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data());

  const stats: AttendanceStats[] = students.map((student) => {
    let totalPrayers = 0;
    let attended = 0;

    attendanceRecords.forEach((record) => {
      // Each attendance record represents ONE prayer session
      const prayersThisDay = 1;

      totalPrayers += prayersThisDay;

      if (record.presentStudents && record.presentStudents.includes(student.id)) {
        attended += prayersThisDay;
      }
    });

    const percentage = totalPrayers > 0 ? Math.round((attended / totalPrayers) * 100) : 0;

    return {
      studentId: student.id,
      studentName: student.name,
      totalPrayers,
      attended,
      percentage,
    };
  });

  return stats.sort((a, b) => b.percentage - a.percentage);
}
