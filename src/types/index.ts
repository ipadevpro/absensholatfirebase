export type Gender = "ikhwan" | "akhwat";

export type PrayerType = "zuhur" | "ashar" | "jumat";

export type UserRole = "guru" | "koordinator";

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  classId: string;
  createdAt: Date;
}

export interface Coordinator {
  id: string;
  uid: string;
  name: string;
  gender: Gender;
  classId: string;
  createdAt: Date;
}

export interface Class {
  id: string;
  name: string;
  grade: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  gender: Gender;
  prayerType: PrayerType;
  presentStudents: string[];
}

export interface AttendanceStats {
  studentId: string;
  studentName: string;
  totalPrayers: number;
  attended: number;
  percentage: number;
}