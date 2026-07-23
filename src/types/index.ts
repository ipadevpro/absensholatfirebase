export type Gender = "ikhwan" | "akhwat";

export type PrayerType = "zuhur" | "ashar" | "jumat";

export type UserRole = "admin" | "coordinator" | "supervisor" | null;

export interface Supervisor {
  id: string;
  uid: string;
  name: string;
  classes: string[];
  createdAt: Date;
}

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

export type AttendanceStatus = "hadir" | "sakit" | "izin" | "alpa" | "haid";

export interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  gender: Gender;
  prayerType: PrayerType;
  statuses: Record<string, AttendanceStatus>;
}

export interface AttendanceStats {
  studentId: string;
  studentName: string;
  totalPrayers: number;
  attended: number;
  percentage: number;
}