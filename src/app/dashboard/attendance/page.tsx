"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AttendanceRecorder } from "./components/AttendanceRecorder";
import { db } from "@/lib/firebase/config";
import { PrayerType } from "@/types";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, isWeekend } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarClock, AlertCircle } from "lucide-react";
import { getAttendanceStartDate } from "@/lib/db/settings";
import { doc, getDoc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { getPrayersForDay } from "@/lib/utils";

function AttendanceContent() {
  const { role, profile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  
  const paramDate = searchParams.get("date");
  const paramPrayer = searchParams.get("prayer");

  const [classId, setClassId] = useState<string>(() => {
    if (role === "coordinator" && profile?.classId) return profile.classId;
    if (role === "supervisor" && profile?.classes?.length) return profile.classes[0];
    return "";
  });
  const [gender, setGender] = useState<"ikhwan" | "akhwat">(() => {
    if (role === "coordinator" && profile?.gender) return profile.gender;
    return "ikhwan";
  });
  const [date, setDate] = useState<string>(paramDate || format(new Date(), "yyyy-MM-dd"));
  const [error, setError] = useState<string | null>(null);
  const [missingRecords, setMissingRecords] = useState<{ date: string; prayer: PrayerType }[]>([]);
  const [supervisorClasses, setSupervisorClasses] = useState<string[]>(() => {
    if (role === "supervisor" && profile?.classes) return profile.classes;
    return [];
  });

  const isAdmin = role === "admin" || role === "supervisor";

  useEffect(() => {
    if (authLoading) return;
    
    if (role === "coordinator" && profile) {
      setClassId(profile.classId);
      setGender(profile.gender);

      // Check last 5 school days for missing attendance in background
      async function checkMissing() {
        try {
          const startDateStr = await getAttendanceStartDate();
          const missing: { date: string; prayer: PrayerType }[] = [];
          const today = new Date();
          
          for (let i = 0; i < 5; i++) {
            const checkDate = subDays(today, i);
            if (isWeekend(checkDate)) continue;

            const dateStr = format(checkDate, "yyyy-MM-dd");
            if (startDateStr && dateStr < startDateStr) continue;

            const expectedPrayers = getPrayersForDay(profile.gender, checkDate);

            for (const prayer of expectedPrayers) {
              const docId = `${dateStr}_${profile.classId}_${profile.gender}_${prayer}`;
              const record = await getDoc(doc(db, "attendance", docId));
              
              if (!record.exists()) {
                missing.push({ date: dateStr, prayer });
              }
            }
          }
          setMissingRecords(missing);
        } catch (err) {
          console.error("Error checking missing records:", err);
        }
      }
      checkMissing();
    } else if (role === "supervisor" && profile) {
      const assignedClasses = profile.classes || [];
      setSupervisorClasses(assignedClasses);
      if (assignedClasses.length > 0) {
        setClassId(prev => prev || assignedClasses[0]);
      }
    } else if (role === "admin") {
      // Admin has full access
    } else if (!role) {
      setError("Profil tidak ditemukan. Pastikan UID Anda terdaftar sebagai Admin, Pembina, atau Koordinator.");
    }
  }, [role, profile, authLoading]);

  if (error && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="text-destructive bg-destructive/10 p-5 rounded-xl border border-destructive/20 max-w-md">
          <div className="flex items-center justify-center gap-2 mb-1.5 font-semibold text-base">
            <AlertCircle className="h-5 w-5" />
            <span>Akses Ditolak</span>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const filteredClassesForSelect = supervisorClasses.length > 0
    ? AVAILABLE_CLASSES.filter(c => supervisorClasses.includes(c.id))
    : AVAILABLE_CLASSES;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Absensi Sholat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catat dan kelola kehadiran sholat berjamaah harian siswa.
        </p>
      </div>

      {/* Missing Records Notification */}
      {missingRecords.length > 0 && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 sm:p-5 text-amber-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-amber-950">Ada Absensi yang Terlewat</h3>
                <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                  Anda belum mengisi absensi sholat untuk jadwal di bawah. Klik jadwal untuk langsung mengisi.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 md:pt-0">
              {missingRecords.map((record, i) => (
                <Button 
                  key={i} 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/dashboard/attendance?date=${record.date}&prayer=${record.prayer}`;
                  }}
                  className="h-8 text-xs rounded-lg border-amber-300/80 bg-white hover:bg-amber-100 text-amber-900 font-medium px-3"
                >
                  {format(new Date(record.date), "EEE, dd MMM", { locale: idLocale })} • {record.prayer === 'jumat' ? "Jum'at" : record.prayer}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Filter Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Tanggal
          </Label>
          <Input 
            type="date" 
            id="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border-input bg-background"
          />
        </div>

        {authLoading && !role ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">Kelas</Label>
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">Kategori</Label>
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </>
        ) : isAdmin ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="class" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Kelas
              </Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger id="class" className="rounded-lg border-input bg-background">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {filteredClassesForSelect.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Kategori
              </Label>
              <Select value={gender} onValueChange={(v) => setGender(v as "ikhwan" | "akhwat")}>
                <SelectTrigger id="gender" className="rounded-lg border-input bg-background">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="ikhwan">Ikhwan</SelectItem>
                  <SelectItem value="akhwat">Akhwat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : classId ? (
          <div className="md:col-span-2 flex items-end">
            <div className="bg-muted/50 text-foreground px-4 py-2.5 rounded-lg border border-border w-full flex items-center justify-between text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kelas & Kategori:</span>
              <span className="font-semibold text-foreground">
                {AVAILABLE_CLASSES.find(c => c.id === classId)?.name || classId} • <span className="capitalize">{gender}</span>
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Main Attendance Recorder */}
      {classId && gender ? (
        <AttendanceRecorder 
          classId={classId} 
          gender={gender} 
          date={date}
          defaultPrayer={paramPrayer as any}
        />
      ) : (
        <div className="flex h-48 items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground bg-card/40">
          <p className="text-sm font-medium text-muted-foreground">Silakan pilih kelas dan kategori untuk melihat daftar absen.</p>
        </div>
      )}
    </div>
  );
}

function AttendancePageSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Absensi Sholat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catat dan kelola kehadiran sholat berjamaah harian siswa.
        </p>
      </div>

      {/* Filter Card Shell */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">Tanggal</Label>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">Kelas</Label>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">Kategori</Label>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<AttendancePageSkeleton />}>
      <AttendanceContent />
    </Suspense>
  );
}

