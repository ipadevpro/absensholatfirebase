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
  CalendarClock
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getPrayersForDay } from "@/lib/utils";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Coordinator, PrayerType } from "@/types";
import { format, subDays, isWeekend, startOfDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface MissingRecord {
  date: string;
  prayer: PrayerType;
}

export default function DashboardPage() {
  const { role, user } = useAuth();
  const [missingRecords, setMissingRecords] = useState<MissingRecord[]>([]);
  const [checking, setChecking] = useState(false);
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);

  const adminLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Isi atau monitor absen sholat", color: "text-emerald-600", bg: "bg-emerald-50" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat rekapan & nilai siswa", color: "text-amber-600", bg: "bg-amber-50" },
    { href: "/dashboard/students", label: "Siswa", icon: Users, desc: "Kelola data siswa & kelas", color: "text-blue-600", bg: "bg-blue-50" },
    { href: "/dashboard/coordinators", label: "Koordinator", icon: UserCog, desc: "Delegasikan tugas absen", color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const coordLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Mulai mengabsen sholat kelas", color: "text-emerald-600", bg: "bg-emerald-50" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat statistik kehadiran kelas", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const supervisorLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Isi atau monitor absen sholat", color: "text-emerald-600", bg: "bg-emerald-50" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat rekapan & nilai siswa", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const links = role === "admin" ? adminLinks : role === "supervisor" ? supervisorLinks : coordLinks;

  useEffect(() => {
    async function checkAttendance() {
      if (!user || role !== "coordinator") return;
      
      setChecking(true);
      try {
        // 1. Get Coordinator Profile
        const coordDoc = await getDoc(doc(db, "coordinators", user.uid));
        if (!coordDoc.exists()) return;
        
        const coordData = coordDoc.data() as Coordinator;
        setCoordinator(coordData);

        // 2. Check last 5 school days
        const missing: MissingRecord[] = [];
        const today = new Date();
        
        for (let i = 0; i < 5; i++) {
          const date = subDays(today, i);
          if (isWeekend(date)) continue;

          const dateStr = format(date, "yyyy-MM-dd");
          const expectedPrayers = getPrayersForDay(coordData.gender, date);

          for (const prayer of expectedPrayers) {
            // If it's today, only check if time has passed (simplified: always check if record exists)
            // In a real app, you might only check past hours
            const docId = `${dateStr}_${coordData.classId}_${coordData.gender}_${prayer}`;
            const record = await getDoc(doc(db, "attendance", docId));
            
            if (!record.exists()) {
              missing.push({ date: dateStr, prayer });
            }
          }
        }
        setMissingRecords(missing);
      } catch (e) {
        console.error("Error checking attendance:", e);
      } finally {
        setChecking(false);
      }
    }

    checkAttendance();
  }, [user, role]);

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
              {role === "coordinator" ? coordinator?.name || "Koordinator" : role === "supervisor" ? "Guru Pembina" : "Guru Admin"}
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
                  link.href.includes('students') ? "bg-blue-500" : "bg-purple-500")} />
                
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
                Gunakan aplikasi ini dengan jujur dan disiplin untuk membantu teman-teman meningkatkan kualitas ibadah berjamaah.
              </p>
            </div>
          </div>
          <div className="absolute inset-0 opacity-5 pointer-events-none islamic-pattern" />
        </CardContent>
      </Card>
    </div>
  );
}
