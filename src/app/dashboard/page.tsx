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
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getPrayersForDay } from "@/lib/utils";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, where, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Coordinator, PrayerType, Student, Supervisor } from "@/types";
import { format, subDays, isWeekend } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AVAILABLE_CLASSES } from "@/lib/constants";

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
  const { role, user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);

  // States for stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCoordinators, setTotalCoordinators] = useState(0);
  const [totalSupervisors, setTotalSupervisors] = useState(0);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [missingToday, setMissingToday] = useState<MissingAttendanceToday[]>([]);

  // Coordinator stats
  const [coordStudentCount, setCoordStudentCount] = useState(0);
  const [coordMonthRate, setCoordMonthRate] = useState(0);
  const [coordTodayStatus, setCoordTodayStatus] = useState<{ prayer: PrayerType; filled: boolean }[]>([]);
  const [missingRecords, setMissingRecords] = useState<MissingRecord[]>([]);

  const adminLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Isi atau monitor absen sholat", color: "text-emerald-600", bg: "bg-emerald-50" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat rekapan & nilai siswa", color: "text-amber-600", bg: "bg-amber-50" },
    { href: "/dashboard/students", label: "Siswa", icon: Users, desc: "Kelola data siswa & kelas", color: "text-blue-600", bg: "bg-blue-50" },
    { href: "/dashboard/coordinators", label: "Koordinator", icon: UserCog, desc: "Delegasikan tugas absen", color: "text-purple-600", bg: "bg-purple-50" },
    { href: "/dashboard/supervisors", label: "Pembina", icon: UserCog, desc: "Kelola guru pembina", color: "text-teal-600", bg: "bg-teal-50" },
  ];

  const supervisorLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Isi atau monitor absen sholat", color: "text-emerald-600", bg: "bg-emerald-50" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat rekapan & nilai siswa", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const coordLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Mulai mengabsen sholat kelas", color: "text-emerald-600", bg: "bg-emerald-50" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat statistik kehadiran kelas", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const links = role === "admin" ? adminLinks : role === "supervisor" ? supervisorLinks : coordLinks;

  useEffect(() => {
    async function loadDashboardData() {
      if (!user || !role) return;
      setChecking(true);
      try {
        if (role === "admin" || role === "supervisor") {
          // 1. Fetch overall counts
          const studentsSnap = await getDocs(collection(db, "students"));
          setTotalStudents(studentsSnap.size);

          const coordsSnap = await getDocs(collection(db, "coordinators"));
          setTotalCoordinators(coordsSnap.size);

          const supervisorsSnap = await getDocs(collection(db, "supervisors"));
          setTotalSupervisors(supervisorsSnap.size);

          // 2. Fetch Recent Activities (order by updatedAt desc)
          try {
            const q = query(
              collection(db, "attendance"),
              orderBy("updatedAt", "desc"),
              limit(5)
            );
            const activitiesSnap = await getDocs(q);
            const activities = activitiesSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as RecentActivity[];
            setRecentActivities(activities);
          } catch (activityError) {
            // Fallback if index is building or not present, query without orderBy
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

          // 3. Supervisor missing attendance monitor for today
          if (role === "supervisor") {
            const todayStr = format(new Date(), "yyyy-MM-dd");
            const attendanceSnap = await getDocs(query(collection(db, "attendance"), where("date", "==", todayStr)));
            const presentRecords = new Set(attendanceSnap.docs.map(doc => doc.id));

            const missingList: MissingAttendanceToday[] = [];
            AVAILABLE_CLASSES.forEach(cls => {
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
            });
            setMissingToday(missingList);
          }
        } else if (role === "coordinator") {
          // 1. Get Coordinator Profile
          const coordDoc = await getDoc(doc(db, "coordinators", user.uid));
          if (coordDoc.exists()) {
            const coordData = coordDoc.data() as Coordinator;
            setCoordinator(coordData);

            // 2. Count class students
            const classStudentsQuery = query(
              collection(db, "students"),
              where("classId", "==", coordData.classId),
              where("gender", "==", coordData.gender)
            );
            const classStudentsSnap = await getDocs(classStudentsQuery);
            setCoordStudentCount(classStudentsSnap.size);

            // 3. Today's attendance status
            const todayStr = format(new Date(), "yyyy-MM-dd");
            const expectedPrayers = getPrayersForDay(coordData.gender, new Date());
            const todayStatus: { prayer: PrayerType; filled: boolean }[] = [];

            for (const prayer of expectedPrayers) {
              const docId = `${todayStr}_${coordData.classId}_${coordData.gender}_${prayer}`;
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
              where("classId", "==", coordData.classId),
              where("gender", "==", coordData.gender),
              where("date", ">=", start),
              where("date", "<=", end)
            );
            const monthlySnap = await getDocs(monthlyQuery);
            const monthlyRecords = monthlySnap.docs.map(d => d.data());

            let totalHadirCount = 0;
            let totalPossiblePrayers = monthlyRecords.length * classStudentsSnap.size;

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
            const missing: MissingRecord[] = [];
            const today = new Date();
            
            for (let i = 0; i < 5; i++) {
              const date = subDays(today, i);
              if (isWeekend(date)) continue;

              const dateStr = format(date, "yyyy-MM-dd");
              const expectedPrayersForDay = getPrayersForDay(coordData.gender, date);

              for (const prayer of expectedPrayersForDay) {
                const docId = `${dateStr}_${coordData.classId}_${coordData.gender}_${prayer}`;
                const record = await getDoc(doc(db, "attendance", docId));
                
                if (!record.exists()) {
                  missing.push({ date: dateStr, prayer });
                }
              }
            }
            setMissingRecords(missing);
          }
        }
      } catch (e) {
        console.error("Error loading dashboard data:", e);
      } finally {
        setChecking(false);
      }
    }

    loadDashboardData();
  }, [user, role]);

  if (checking) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800 animate-pulse">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 islamic-pattern min-h-full">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-primary p-8 text-primary-foreground shadow-2xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md border border-white/20 mb-2">
            <MoonStar size={14} className="text-secondary" />
            <span>Assalamu'alaikum</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
            Selamat Datang, <br />
            <span className="text-secondary italic">
              {role === "coordinator" 
                ? coordinator?.name || "Koordinator" 
                : role === "supervisor" 
                  ? "Guru Pembina" 
                  : "Guru Admin"}
            </span>
          </h1>
          <p className="text-emerald-100 max-w-md text-sm md:text-base font-light leading-relaxed">
            "Sesungguhnya sholat itu mencegah dari (perbuatan) keji dan mungkar." <br />
            <span className="text-xs opacity-60">— QS. Al-Ankabut: 45</span>
          </p>
        </div>
        
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute right-8 top-8 opacity-10">
          <LayoutDashboard size={180} strokeWidth={1} />
        </div>
      </section>

      {/* --- ROLE BASED DISPLAY --- */}

      {/* 1. COORDINATOR EXTRA STATISTICS */}
      {role === "coordinator" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Siswa Saya</p>
              <h3 className="text-3xl font-serif font-bold text-emerald-900 mt-2">{coordStudentCount} Siswa</h3>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Kategori: <span className="font-bold capitalize">{coordinator?.gender}</span> • Kelas {AVAILABLE_CLASSES.find(c => c.id === coordinator?.classId)?.name}
            </p>
          </Card>

          <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status Absensi Hari Ini</p>
              <div className="space-y-2 mt-3">
                {coordTodayStatus.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Tidak ada jadwal sholat hari ini</p>
                ) : (
                  coordTodayStatus.map((status, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="capitalize font-semibold text-emerald-950">
                        {status.prayer === "jumat" ? "Jum'at" : status.prayer}
                      </span>
                      {status.filled ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          Selesai
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold animate-pulse">
                          Belum
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="mt-4">
              {coordTodayStatus.some(s => !s.filled) && (
                <Link href="/dashboard/attendance">
                  <Button variant="link" className="text-xs text-emerald-600 hover:text-emerald-700 p-0 h-auto font-bold flex items-center gap-1">
                    Isi Absensi Hari Ini <ArrowRight size={12} />
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kehadiran Bulan Ini</p>
              <h3 className="text-3xl font-serif font-bold text-emerald-900 mt-2">{coordMonthRate}%</h3>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-4">
              <div className="bg-emerald-600 h-full transition-all" style={{ width: `${coordMonthRate}%` }} />
            </div>
          </Card>
        </div>
      )}

      {/* 2. ADMIN & SUPERVISOR SUMMARY STATS */}
      {(role === "admin" || role === "supervisor") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md rounded-3xl p-6 flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
              <Users size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Siswa</p>
              <h3 className="text-2xl font-serif font-bold text-gray-800 mt-1">{totalStudents}</h3>
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md rounded-3xl p-6 flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-purple-50 text-purple-600">
              <UserCog size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Koordinator</p>
              <h3 className="text-2xl font-serif font-bold text-gray-800 mt-1">{totalCoordinators}</h3>
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md rounded-3xl p-6 flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-teal-50 text-teal-600">
              <Users size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pembina</p>
              <h3 className="text-2xl font-serif font-bold text-gray-800 mt-1">{totalSupervisors}</h3>
            </div>
          </Card>
        </div>
      )}

      {/* 3. MISSING ATTENDANCE TODAY (FOR SUPERVISORS) */}
      {role === "supervisor" && (
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <div className="bg-amber-500 h-1.5 w-full" />
          <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2.5 rounded-2xl text-amber-700">
                <AlertTriangle size={20} />
              </div>
              <div>
                <CardTitle className="text-xl font-serif font-bold text-gray-900">
                  Daftar Kelas Belum Absen Hari Ini
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Monitor pengisian absensi sholat oleh koordinator hari ini.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {missingToday.length === 0 ? (
              <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <CheckCircle2 size={18} />
                <p className="text-sm font-semibold">Luar biasa! Semua kelas sudah melakukan absensi hari ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {missingToday.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 hover:border-amber-200 transition-all">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">
                        Kelas {AVAILABLE_CLASSES.find(c => c.id === item.classId)?.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 capitalize mt-0.5">
                        {item.gender} • Sholat {item.prayer === "jumat" ? "Jum'at" : item.prayer}
                      </p>
                    </div>
                    <Link href={`/dashboard/attendance?date=${format(new Date(), "yyyy-MM-dd")}&prayer=${item.prayer}`}>
                      <Button size="sm" variant="ghost" className="text-[10px] text-amber-600 bg-amber-50 hover:bg-amber-100 h-8 rounded-xl font-bold">
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

      {/* 4. RECENT ACTIVITY (FOR ADMINS) */}
      {role === "admin" && (
        <Card className="border-none shadow-sm bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6">
          <CardHeader className="px-2 pt-2 flex flex-row items-center gap-3 space-y-0 pb-4">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl">
              <Clock size={20} />
            </div>
            <div>
              <CardTitle className="text-xl font-serif text-gray-900">Aktivitas Terbaru</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Catatan pengisian absensi sholat terbaru di sekolah.</p>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4">Belum ada aktivitas pengisian absensi.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentActivities.map((act) => (
                  <div key={act.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                        <RefreshCw size={14} className="animate-spin duration-10000" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">
                          Absensi {act.prayerType === "jumat" ? "Jum'at" : act.prayerType} diisi
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Kelas {AVAILABLE_CLASSES.find(c => c.id === act.classId)?.name} ({act.gender}) • Tanggal {format(new Date(act.date), "dd MMMM yyyy", { locale: idLocale })}
                        </p>
                      </div>
                    </div>
                    {act.updatedAt && (
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
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

      {/* Missing Attendance Quick Action (For Coordinators) */}
      {role === "coordinator" && !checking && missingRecords.length > 0 && (
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-amber-500 h-1.5 w-full" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-amber-100 p-4 rounded-3xl text-amber-600 shadow-inner">
                <CalendarClock size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-serif font-bold text-gray-900">Perhatian, Ada Tugas Menanti!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Anda memiliki <strong>{missingRecords.length}</strong> jadwal sholat yang belum diabsen dalam beberapa hari terakhir.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                {missingRecords.slice(0, 3).map((record, i) => (
                  <Link 
                    key={i} 
                    href={`/dashboard/attendance?date=${record.date}&prayer=${record.prayer}`}
                  >
                    <Button size="sm" variant="outline" className="text-[10px] h-8 rounded-full border-amber-200 hover:bg-amber-50 hover:text-amber-700 capitalize">
                      {format(new Date(record.date), "EEE", { locale: idLocale })} • {record.prayer === 'jumat' ? "Jum'at" : record.prayer}
                    </Button>
                  </Link>
                ))}
                {missingRecords.length > 3 && (
                  <span className="text-[10px] text-gray-400 self-center">+{missingRecords.length - 3} lainnya</span>
                )}
              </div>
              <Link href={`/dashboard/attendance?date=${missingRecords[0].date}&prayer=${missingRecords[0].prayer}`}>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl px-6 shadow-lg shadow-amber-100">
                  Lengkapi Sekarang
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Missing Attendance (Success State) */}
      {role === "coordinator" && !checking && missingRecords.length === 0 && (
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <div className="bg-emerald-500 h-1.5 w-full" />
          <CardContent className="p-6 flex items-center gap-4 text-emerald-700">
            <div className="bg-emerald-100 p-2 rounded-full">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-sm font-medium">Alhamdulillah, seluruh jadwal sholat pekan ini sudah diabsen!</p>
          </CardContent>
        </Card>
      )}

      {/* Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 staggered-reveal">
        {links.map((link, index) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 h-full bg-white/60 backdrop-blur-md rounded-[2rem]">
                <div className={cn("absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-3", 
                  link.href.includes('attendance') ? "bg-emerald-500" : 
                  link.href.includes('reports') ? "bg-amber-500" : 
                  link.href.includes('students') ? "bg-blue-500" : 
                  link.href.includes('supervisors') ? "bg-teal-500" : "bg-purple-500")} />
                
                <CardHeader className="flex flex-row items-center gap-5 space-y-0 p-6">
                  <div className={cn("p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 shadow-inner", link.bg, link.color)}>
                    <Icon size={28} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-serif text-gray-800">{link.label}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {link.desc}
                    </p>
                  </div>
                  <ArrowRight className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Bottom Info Card */}
      <Card className="bg-secondary text-primary-foreground border-none shadow-lg overflow-hidden rounded-[2.5rem] relative">
        <CardContent className="p-8">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm shadow-xl">
              <Sun size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold mb-1">Amanah Monitoring</h2>
              <p className="text-primary/80 text-sm max-w-lg leading-relaxed">
                Gunakan aplikasi ini dengan jujur dan disiplin untuk membantu meningkatkan kualitas ibadah berjamaah.
              </p>
            </div>
          </div>
          <div className="absolute inset-0 opacity-5 pointer-events-none islamic-pattern" />
        </CardContent>
      </Card>
    </div>
  );
}
