"use client";

import { useAuth } from "@/contexts/AuthContext";
import { 
  ClipboardCheck, 
  Users, 
  UserCog, 
  BarChart3, 
  LayoutDashboard,
  ArrowRight,
  Sun,
  MoonStar,
  CheckCircle2,
  CalendarClock,
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Calendar,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getPrayersForDay } from "@/lib/utils";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, where, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Coordinator, PrayerType, Holiday } from "@/types";
import { format, subDays, isWeekend } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { getAttendanceStartDate, updateAttendanceStartDate, getHolidays, updateHolidays, isHoliday } from "@/lib/db/settings";
import { toast } from "sonner";

interface MissingRecord {
  date: string;
  prayer: PrayerType;
}

interface RecentActivity {
  id: string;
  date: string;
  classId: string;
  gender: string;
  prayerType: string;
  updatedAt?: any;
}

interface MissingAttendanceToday {
  classId: string;
  gender: "ikhwan" | "akhwat";
  prayer: PrayerType;
}

export default function DashboardPage() {
  const { role, user, profile } = useAuth();
  const [checking, setChecking] = useState(true);
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);

  // States for stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCoordinators, setTotalCoordinators] = useState(0);
  const [totalSupervisors, setTotalSupervisors] = useState(0);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [missingToday, setMissingToday] = useState<MissingAttendanceToday[]>([]);

  // Settings states
  const [attendanceStartDate, setAttendanceStartDate] = useState<string>("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [supervisorClassCount, setSupervisorClassCount] = useState(0);

  // Holiday states
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayStart, setNewHolidayStart] = useState<string>("");
  const [newHolidayEnd, setNewHolidayEnd] = useState<string>("");
  const [newHolidayDesc, setNewHolidayDesc] = useState<string>("");
  const [isSavingHoliday, setIsSavingHoliday] = useState<boolean>(false);

  // Coordinator stats
  const [coordStudentCount, setCoordStudentCount] = useState(0);
  const [coordMonthRate, setCoordMonthRate] = useState(0);
  const [coordTodayStatus, setCoordTodayStatus] = useState<{ prayer: PrayerType; filled: boolean }[]>([]);
  const [missingRecords, setMissingRecords] = useState<MissingRecord[]>([]);

  const adminLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Isi atau monitor absen sholat", color: "text-emerald-700", bg: "bg-emerald-50" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat rekapan & nilai siswa", color: "text-amber-700", bg: "bg-amber-50" },
    { href: "/dashboard/students", label: "Siswa", icon: Users, desc: "Kelola data siswa & kelas", color: "text-blue-700", bg: "bg-blue-50" },
    { href: "/dashboard/coordinators", label: "Koordinator", icon: UserCog, desc: "Delegasikan tugas absen", color: "text-purple-700", bg: "bg-purple-50" },
    { href: "/dashboard/supervisors", label: "Pembina", icon: UserCog, desc: "Kelola guru pembina", color: "text-teal-700", bg: "bg-teal-50" },
  ];

  const supervisorLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Isi atau monitor absen sholat", color: "text-emerald-700", bg: "bg-emerald-50" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat rekapan & nilai siswa", color: "text-amber-700", bg: "bg-amber-50" },
  ];

  const coordLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Mulai mengabsen sholat kelas", color: "text-emerald-700", bg: "bg-emerald-50" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat statistik kehadiran kelas", color: "text-amber-700", bg: "bg-amber-50" },
  ];

  const links = role === "admin" ? adminLinks : role === "supervisor" ? supervisorLinks : coordLinks;

  useEffect(() => {
    async function loadDashboardData() {
      if (!user || !role) {
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        if (role === "admin") {
          const [studentsSnap, coordsSnap, supervisorsSnap, startDateStr, holidaysData] = await Promise.all([
            getDocs(collection(db, "students")),
            getDocs(collection(db, "coordinators")),
            getDocs(collection(db, "supervisors")),
            getAttendanceStartDate(),
            getHolidays(),
          ]);
          setTotalStudents(studentsSnap.size);
          setTotalCoordinators(coordsSnap.size);
          setTotalSupervisors(supervisorsSnap.size);
          setAttendanceStartDate(startDateStr || "");
          setHolidays(holidaysData || []);

          try {
            const q = query(
              collection(db, "attendance"),
              orderBy("updatedAt", "desc"),
              limit(5)
            );
            const activitiesSnap = await getDocs(q);
            setRecentActivities(activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RecentActivity[]);
          } catch (activityError) {
            console.warn("Could not load recent activities with orderBy. Using fallback.", activityError);
            const fallbackQuery = query(collection(db, "attendance"), limit(10));
            const activitiesSnap = await getDocs(fallbackQuery);
            const activities = activitiesSnap.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as RecentActivity))
              .filter(a => a.updatedAt)
              .sort((a, b) => {
                const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt).getTime();
                const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt).getTime();
                return timeB - timeA;
              })
              .slice(0, 5);
            setRecentActivities(activities);
          }
        } else if (role === "supervisor" && profile) {
          const assignedClasses = profile.classes || [];
          setSupervisorClassCount(assignedClasses.length);

          // a) Fetch students count in assigned classes
          if (assignedClasses.length > 0) {
            const studentsQuery = query(
              collection(db, "students"),
              where("classId", "in", assignedClasses)
            );
            const studentsSnap = await getDocs(studentsQuery);
            setTotalStudents(studentsSnap.size);
          } else {
            setTotalStudents(0);
          }

          // b) Fetch recent activities for assigned classes
          if (assignedClasses.length > 0) {
            try {
              const q = query(
                collection(db, "attendance"),
                where("classId", "in", assignedClasses),
                orderBy("updatedAt", "desc"),
                limit(5)
              );
              const snap = await getDocs(q);
              setRecentActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecentActivity)));
            } catch (e) {
              const fallbackQ = query(collection(db, "attendance"), where("classId", "in", assignedClasses), limit(20));
              const snap = await getDocs(fallbackQ);
              const sorted = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as RecentActivity))
                .filter(a => a.updatedAt)
                .sort((a, b) => {
                  const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt).getTime();
                  const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt).getTime();
                  return timeB - timeA;
                })
                .slice(0, 5);
              setRecentActivities(sorted);
            }
          } else {
            setRecentActivities([]);
          }

          // c) Today's missing attendance monitor for assigned classes
          const todayStr = format(new Date(), "yyyy-MM-dd");
          const attendanceSnap = await getDocs(query(collection(db, "attendance"), where("date", "==", todayStr)));
          const presentRecords = new Set(attendanceSnap.docs.map(doc => doc.id));

          const missingList: MissingAttendanceToday[] = [];
          assignedClasses.forEach((classId: string) => {
            const cls = AVAILABLE_CLASSES.find(c => c.id === classId);
            if (cls) {
              (["ikhwan", "akhwat"] as const).forEach(gender => {
                const expectedPrayers = getPrayersForDay(gender, new Date());
                expectedPrayers.forEach(prayer => {
                  const docId = `${todayStr}_${cls.id}_${gender}_${prayer}`;
                  if (!presentRecords.has(docId)) {
                    missingList.push({
                      classId: cls.id,
                      gender,
                      prayer
                    });
                  }
                });
              });
            }
          });
          setMissingToday(missingList);
        } else if (role === "coordinator" && profile) {
          setCoordinator(profile);

          // 2. Count class students
          const classStudentsQuery = query(
            collection(db, "students"),
            where("classId", "==", profile.classId),
            where("gender", "==", profile.gender)
          );
          const classStudentsSnap = await getDocs(classStudentsQuery);
          setCoordStudentCount(classStudentsSnap.size);

          // 3. Today's attendance status
          const todayStr = format(new Date(), "yyyy-MM-dd");
          const expectedPrayers = getPrayersForDay(profile.gender, new Date());
          const todayStatus: { prayer: PrayerType; filled: boolean }[] = [];

          for (const prayer of expectedPrayers) {
            const docId = `${todayStr}_${profile.classId}_${profile.gender}_${prayer}`;
            const record = await getDoc(doc(db, "attendance", docId));
            todayStatus.push({
              prayer,
              filled: record.exists()
            });
          }
          setCoordTodayStatus(todayStatus);

          // 4. Monthly Attendance Rate
          const start = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
          const end = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");
          const monthlyQuery = query(
            collection(db, "attendance"),
            where("classId", "==", profile.classId),
            where("gender", "==", profile.gender),
            where("date", ">=", start),
            where("date", "<=", end)
          );
          const monthlySnap = await getDocs(monthlyQuery);
          const monthlyRecords = monthlySnap.docs.map(d => d.data());

          let totalHadirCount = 0;
          const totalPossiblePrayers = monthlyRecords.length * classStudentsSnap.size;

          monthlyRecords.forEach(record => {
            if (record.statuses) {
              classStudentsSnap.docs.forEach(stDoc => {
                const status = record.statuses[stDoc.id];
                if (status === "hadir" || status === "haid") {
                  totalHadirCount += 1;
                }
              });
            }
          });

          const rate = totalPossiblePrayers > 0 
            ? Math.round((totalHadirCount / totalPossiblePrayers) * 100)
            : 0;
          setCoordMonthRate(rate);

          // 5. Check last 5 school days for tasks
          const [startDateStr, holidaysData] = await Promise.all([
            getAttendanceStartDate(),
            getHolidays(),
          ]);
          const missing: MissingRecord[] = [];
          const today = new Date();
          
          for (let i = 0; i < 5; i++) {
            const date = subDays(today, i);
            if (isWeekend(date)) continue;

            const dateStr = format(date, "yyyy-MM-dd");
            if (startDateStr && dateStr < startDateStr) continue;
            if (isHoliday(dateStr, holidaysData)) continue;

            const expectedPrayersForDay = getPrayersForDay(profile.gender, date);

            for (const prayer of expectedPrayersForDay) {
              const docId = `${dateStr}_${profile.classId}_${profile.gender}_${prayer}`;
              const record = await getDoc(doc(db, "attendance", docId));
              
              if (!record.exists()) {
                missing.push({ date: dateStr, prayer });
              }
            }
          }
          setMissingRecords(missing);
        }
      } catch (e) {
        console.error("Error loading dashboard data:", e);
      } finally {
        setChecking(false);
      }
    }

    loadDashboardData();
  }, [user, role, profile]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 min-h-full">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-primary p-6 md:p-8 text-primary-foreground shadow-sm">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm border border-white/15">
            <MoonStar size={13} className="text-secondary" />
            <span>Assalamu&apos;alaikum</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug">
              Selamat Datang,{" "}
              <span className="text-emerald-100 font-bold">
                {role === "coordinator" 
                  ? coordinator?.name || "Koordinator" 
                  : role === "supervisor" 
                    ? "Guru Pembina" 
                    : "Guru Admin"}
              </span>
            </h1>
            <p className="text-emerald-100/80 text-xs md:text-sm mt-1.5 leading-relaxed max-w-xl">
              &quot;Sesungguhnya sholat itu mencegah dari (perbuatan) keji dan mungkar.&quot;{" "}
              <span className="opacity-70">— QS. Al-Ankabut: 45</span>
            </p>
          </div>
        </div>
      </section>

      {/* --- ROLE BASED DISPLAY --- */}

      {/* 1. COORDINATOR EXTRA STATISTICS */}
      {role === "coordinator" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Siswa Saya</p>
                {checking ? (
                  <Skeleton className="h-8 w-16 my-0.5" />
                ) : (
                  <p className="tabular-nums font-bold text-2xl text-foreground mt-1.5">
                    {coordStudentCount} <span className="text-sm font-normal text-muted-foreground">Siswa</span>
                  </p>
                )}
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
                <Users size={20} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">
              Kategori: <span className="font-semibold text-foreground capitalize">{coordinator?.gender || "-"}</span> • Kelas {AVAILABLE_CLASSES.find(c => c.id === coordinator?.classId)?.name || "-"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status Absensi Hari Ini</p>
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <ClipboardCheck size={20} />
                </div>
              </div>
              <div className="space-y-2">
                {checking ? (
                  <div className="space-y-2 py-1">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : coordTodayStatus.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">Tidak ada jadwal sholat hari ini</p>
                ) : (
                  coordTodayStatus.map((status, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="capitalize font-medium text-foreground">
                        {status.prayer === "jumat" ? "Jum'at" : status.prayer}
                      </span>
                      {status.filled ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/50">
                          Selesai
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200/50">
                          Belum
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            {!checking && coordTodayStatus.some(s => !s.filled) && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <Link href="/dashboard/attendance" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                  Isi Absensi Hari Ini <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kehadiran Bulan Ini</p>
                {checking ? (
                  <Skeleton className="h-8 w-16 my-0.5" />
                ) : (
                  <p className="tabular-nums font-bold text-2xl text-foreground mt-1.5">{coordMonthRate}%</p>
                )}
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700">
                <BarChart3 size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Rata-rata kelas</span>
                {checking ? (
                  <Skeleton className="h-3.5 w-8" />
                ) : (
                  <span className="font-semibold text-foreground">{coordMonthRate}%</span>
                )}
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full transition-all rounded-full" style={{ width: `${checking ? 0 : coordMonthRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN SUMMARY STATS */}
      {role === "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Siswa</p>
              {checking ? (
                <Skeleton className="h-8 w-16 my-0.5" />
              ) : (
                <p className="tabular-nums font-bold text-2xl text-foreground mt-1">{totalStudents}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-700">
              <Users size={22} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Koordinator</p>
              {checking ? (
                <Skeleton className="h-8 w-16 my-0.5" />
              ) : (
                <p className="tabular-nums font-bold text-2xl text-foreground mt-1">{totalCoordinators}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-700">
              <UserCog size={22} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Pembina</p>
              {checking ? (
                <Skeleton className="h-8 w-16 my-0.5" />
              ) : (
                <p className="tabular-nums font-bold text-2xl text-foreground mt-1">{totalSupervisors}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-teal-50 text-teal-700">
              <Users size={22} />
            </div>
          </div>
        </div>
      )}

      {/* 3. SUPERVISOR SUMMARY STATS */}
      {role === "supervisor" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Siswa Binaan</p>
              {checking ? (
                <Skeleton className="h-8 w-16 my-0.5" />
              ) : (
                <p className="tabular-nums font-bold text-2xl text-foreground mt-1">{totalStudents}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-700">
              <Users size={22} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kelas Binaan</p>
              {checking ? (
                <Skeleton className="h-8 w-16 my-0.5" />
              ) : (
                <p className="tabular-nums font-bold text-2xl text-foreground mt-1">
                  {supervisorClassCount} <span className="text-sm font-normal text-muted-foreground">Kelas</span>
                </p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-700">
              <LayoutDashboard size={22} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Belum Absen Hari Ini</p>
              {checking ? (
                <Skeleton className="h-8 w-16 my-0.5" />
              ) : (
                <p className="tabular-nums font-bold text-2xl text-foreground mt-1">
                  {missingToday.length} <span className="text-sm font-normal text-muted-foreground">Jadwal</span>
                </p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>
      )}

      {/* 4. MISSING ATTENDANCE TODAY (FOR SUPERVISORS) */}
      {role === "supervisor" && (
        <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 text-amber-700 p-2 rounded-lg">
                <AlertTriangle size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Daftar Kelas Belum Absen Hari Ini
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monitor pengisian absensi sholat oleh koordinator hari ini.
                </p>
              </div>
            </div>
            {!checking && missingToday.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                {missingToday.length} Belum Diabsen
              </span>
            )}
          </CardHeader>
          <CardContent className="p-5">
            {checking ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
                    <div className="space-y-1.5 flex-1 mr-3">
                      <Skeleton className="h-4 w-28 max-w-full" />
                      <Skeleton className="h-3 w-36 max-w-full" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
                  </div>
                ))}
              </div>
            ) : missingToday.length === 0 ? (
              <div className="flex items-center gap-3 text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 p-4 rounded-xl">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <p className="text-sm font-medium">Luar biasa! Semua kelas binaan sudah melakukan absensi hari ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {missingToday.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60 hover:border-amber-300/80 hover:bg-amber-50/20 transition-colors">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">
                        Kelas {AVAILABLE_CLASSES.find(c => c.id === item.classId)?.name || item.classId}
                      </h4>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {item.gender} • Sholat {item.prayer === "jumat" ? "Jum'at" : item.prayer}
                      </p>
                    </div>
                    <Link href={`/dashboard/attendance?date=${format(new Date(), "yyyy-MM-dd")}&prayer=${item.prayer}`}>
                      <Button size="sm" variant="outline" className="text-xs text-amber-700 bg-amber-50/80 border-amber-200 hover:bg-amber-100 h-8 rounded-lg font-medium">
                        Bantu Absen
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. ATTENDANCE START DATE SETTING (FOR ADMINS) */}
      {role === "admin" && (
        <Card className="rounded-xl border border-border bg-card shadow-sm p-5 md:p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">Pengaturan Tanggal Mulai Absensi</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Atur tanggal mulai kalkulasi absen. Jadwal sebelum tanggal ini akan diabaikan pada rekap dan peringatan koordinator.
            </p>
          </CardHeader>
          <CardContent className="p-0 flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-1 w-full">
              <label className="text-xs font-medium text-foreground">Tanggal Mulai</label>
              {checking ? (
                <Skeleton className="h-10 w-full sm:w-64" />
              ) : (
                <input
                  type="date"
                  value={attendanceStartDate}
                  onChange={(e) => setAttendanceStartDate(e.target.value)}
                  className="w-full sm:w-64 h-9 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              )}
            </div>
            {checking ? (
              <Skeleton className="h-9 w-full sm:w-36 shrink-0" />
            ) : (
              <Button
                onClick={async () => {
                  setIsSavingSettings(true);
                  try {
                    await updateAttendanceStartDate(attendanceStartDate);
                    toast.success("Tanggal mulai absensi berhasil diperbarui");
                  } catch (err: any) {
                    toast.error("Gagal memperbarui pengaturan: " + err.message);
                  } finally {
                    setIsSavingSettings(false);
                  }
                }}
                disabled={isSavingSettings}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-5 h-9 text-xs font-medium w-full sm:w-auto shrink-0"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Pengaturan"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5b. HOLIDAY SETTINGS (FOR ADMINS) */}
      {role === "admin" && (
        <Card className="rounded-xl border border-border bg-card shadow-sm p-5 md:p-6 space-y-4">
          <CardHeader className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold text-foreground">Pengaturan Tanggal Libur Sekolah</CardTitle>
              {holidays.length > 0 && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/80 self-start sm:self-auto">
                  {holidays.length} Jadwal Libur
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Atur tanggal atau rentang tanggal libur. Pada tanggal ini, absensi dikunci bagi koordinator dan tidak dihitung sebagai tugas yang terlewat.
            </p>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {/* Input Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 items-end p-3.5 rounded-lg border border-border/70 bg-muted/20">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Tanggal Mulai</label>
                <input
                  type="date"
                  value={newHolidayStart}
                  onChange={(e) => setNewHolidayStart(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Tanggal Selesai (Opsional)</label>
                <input
                  type="date"
                  value={newHolidayEnd}
                  min={newHolidayStart}
                  onChange={(e) => setNewHolidayEnd(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Keterangan Libur</label>
                <input
                  type="text"
                  value={newHolidayDesc}
                  onChange={(e) => setNewHolidayDesc(e.target.value)}
                  placeholder="Contoh: Libur Idul Fitri"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="md:col-span-1">
                <Button
                  onClick={async () => {
                    if (!newHolidayStart) {
                      toast.error("Pilih tanggal mulai libur");
                      return;
                    }
                    const end = newHolidayEnd && newHolidayEnd >= newHolidayStart ? newHolidayEnd : newHolidayStart;
                    const newEntry: Holiday = {
                      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                      startDate: newHolidayStart,
                      endDate: end,
                      description: newHolidayDesc.trim() || undefined,
                    };
                    const updated = [...holidays, newEntry].sort((a, b) => a.startDate.localeCompare(b.startDate));
                    setIsSavingHoliday(true);
                    try {
                      await updateHolidays(updated);
                      setHolidays(updated);
                      setNewHolidayStart("");
                      setNewHolidayEnd("");
                      setNewHolidayDesc("");
                      toast.success("Tanggal libur berhasil ditambahkan");
                    } catch (err: any) {
                      toast.error("Gagal menambahkan hari libur: " + err.message);
                    } finally {
                      setIsSavingHoliday(false);
                    }
                  }}
                  disabled={isSavingHoliday || !newHolidayStart}
                  className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg"
                >
                  {isSavingHoliday ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Tambah"}
                </Button>
              </div>
            </div>

            {/* List of holidays */}
            {checking ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : holidays.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 italic border border-dashed rounded-lg bg-card/40">
                Belum ada tanggal libur yang diatur.
              </p>
            ) : (
              <div className="divide-y divide-border/60 border rounded-lg overflow-hidden bg-background">
                {holidays.map((h) => {
                  const isRange = h.endDate && h.endDate !== h.startDate;
                  return (
                    <div key={h.id} className="flex items-center justify-between p-3 text-xs hover:bg-muted/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                        <div className="flex items-center gap-1.5 font-medium text-foreground shrink-0">
                          <Calendar className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <span>
                            {format(new Date(h.startDate), "d MMM yyyy", { locale: idLocale })}
                            {isRange && ` – ${format(new Date(h.endDate), "d MMM yyyy", { locale: idLocale })}`}
                          </span>
                        </div>
                        {h.description && (
                          <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded text-[11px] font-normal truncate max-w-xs">
                            {h.description}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const updated = holidays.filter((item) => item.id !== h.id);
                          try {
                            await updateHolidays(updated);
                            setHolidays(updated);
                            toast.success("Tanggal libur berhasil dihapus");
                          } catch (err: any) {
                            toast.error("Gagal menghapus hari libur: " + err.message);
                          }
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                        title="Hapus hari libur"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 6. RECENT ACTIVITY (FOR ADMINS) */}
      {role === "admin" && (
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardHeader className="p-5 pb-3 flex flex-row items-center gap-3 border-b border-border/50">
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg">
              <Clock size={18} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Aktivitas Terbaru</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Catatan pengisian absensi sholat terbaru di sekolah.</p>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {checking ? (
              <div className="divide-y divide-border/60">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <Skeleton className="h-4 w-40 max-w-full" />
                        <Skeleton className="h-3 w-56 max-w-full" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-12 rounded-md shrink-0" />
                  </div>
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center">Belum ada aktivitas pengisian absensi.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {recentActivities.map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg shrink-0">
                        <RefreshCw size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs md:text-sm text-foreground truncate">
                          Absensi {act.prayerType === "jumat" ? "Jum'at" : act.prayerType} diisi
                        </h4>
                        <p className="text-[11px] md:text-xs text-muted-foreground truncate mt-0.5">
                          Kelas {AVAILABLE_CLASSES.find(c => c.id === act.classId)?.name || act.classId} ({act.gender}) • {act.date ? format(new Date(act.date), "dd MMMM yyyy", { locale: idLocale }) : "-"}
                        </p>
                      </div>
                    </div>
                    {act.updatedAt && (
                      <span className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-1 rounded-md shrink-0 tabular-nums">
                        {act.updatedAt.toDate ? format(act.updatedAt.toDate(), "HH:mm") : format(new Date(act.updatedAt), "HH:mm")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 7. MISSING ATTENDANCE ALERT / QUICK ACTION (FOR COORDINATORS) */}
      {role === "coordinator" && (checking || missingRecords.length > 0) && (
        <Card className="rounded-xl border border-amber-200/80 bg-amber-50/30 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            {checking ? (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="bg-amber-100 text-amber-700 p-2.5 rounded-lg shrink-0 mt-0.5 md:mt-0">
                    <CalendarClock size={20} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48 max-w-full" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="bg-amber-100 text-amber-700 p-2.5 rounded-lg shrink-0 mt-0.5 md:mt-0">
                    <CalendarClock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Tugas Pengisian Absensi Menanti</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Terdapat <span className="font-semibold text-amber-700">{missingRecords.length}</span> jadwal sholat yang belum diabsen dalam beberapa hari terakhir.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {missingRecords.slice(0, 3).map((record, i) => (
                    <Link 
                      key={i} 
                      href={`/dashboard/attendance?date=${record.date}&prayer=${record.prayer}`}
                    >
                      <Button size="sm" variant="outline" className="text-xs h-8 rounded-lg border-border hover:bg-accent capitalize">
                        {format(new Date(record.date), "EEE", { locale: idLocale })} • {record.prayer === 'jumat' ? "Jum'at" : record.prayer}
                      </Button>
                    </Link>
                  ))}
                  {missingRecords.length > 3 && (
                    <span className="text-xs text-muted-foreground px-1">+{missingRecords.length - 3} lainnya</span>
                  )}
                  <Link href={`/dashboard/attendance?date=${missingRecords[0].date}&prayer=${missingRecords[0].prayer}`} className="ml-auto md:ml-2">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 h-8 text-xs font-medium">
                      Lengkapi Sekarang
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 8. NO MISSING ATTENDANCE (SUCCESS STATE FOR COORDINATORS) */}
      {role === "coordinator" && !checking && missingRecords.length === 0 && (
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-4 flex items-center gap-3 text-emerald-800 shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <p className="text-xs md:text-sm font-medium">Alhamdulillah, seluruh jadwal sholat pekan ini sudah diabsen lengkap!</p>
        </div>
      )}

      {/* 9. QUICK NAVIGATION GRID */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Akses Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="group">
                <Card className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-emerald-200 hover:bg-accent/30 transition-all duration-200 h-full flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={cn("p-2.5 rounded-lg shrink-0", link.bg, link.color)}>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{link.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {link.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" size={16} />
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 10. SUBTLE INFORMATION NOTE */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 flex items-center gap-3 text-muted-foreground">
        <div className="p-2 rounded-lg bg-background text-foreground shrink-0 border border-border/60">
          <Sun size={16} className="text-amber-500" />
        </div>
        <p className="text-xs leading-relaxed">
          <strong className="font-semibold text-foreground">Amanah Monitoring:</strong> Gunakan aplikasi ini dengan jujur dan disiplin untuk mendukung kualitas ibadah berjamaah siswa di lingkungan sekolah.
        </p>
      </div>
    </div>
  );
}
