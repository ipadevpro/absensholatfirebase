"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AttendanceRecorder } from "./components/AttendanceRecorder";
import { db } from "@/lib/firebase/config";
import { Coordinator, PrayerType } from "@/types";
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
import { format, subDays, isWeekend } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, CalendarClock } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getPrayersForDay } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

function AttendanceContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const paramDate = searchParams.get("date");
  const paramPrayer = searchParams.get("prayer");

  const [classId, setClassId] = useState<string>("");
  const [gender, setGender] = useState<"ikhwan" | "akhwat">("ikhwan");
  const [date, setDate] = useState<string>(paramDate || format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [missingRecords, setMissingRecords] = useState<{ date: string; prayer: PrayerType }[]>([]);

  useEffect(() => {
    async function checkRoleAndProfile() {
      if (!user) return;
      try {
        setLoading(true);
        const coordDoc = await getDoc(doc(db, "coordinators", user.uid));
        
        if (coordDoc.exists()) {
          const coordinatorData = coordDoc.data() as Coordinator;
          setClassId(coordinatorData.classId);
          setGender(coordinatorData.gender);
          setIsAdmin(false);

          // Check last 5 school days for missing attendance
          const missing: { date: string; prayer: PrayerType }[] = [];
          const today = new Date();
          
          for (let i = 0; i < 5; i++) {
            const checkDate = subDays(today, i);
            if (isWeekend(checkDate)) continue;

            const dateStr = format(checkDate, "yyyy-MM-dd");
            const expectedPrayers = getPrayersForDay(coordinatorData.gender, checkDate);

            for (const prayer of expectedPrayers) {
              const docId = `${dateStr}_${coordinatorData.classId}_${coordinatorData.gender}_${prayer}`;
              const record = await getDoc(doc(db, "attendance", docId));
              
              if (!record.exists()) {
                missing.push({ date: dateStr, prayer });
              }
            }
          }
          setMissingRecords(missing);
        } else {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (adminDoc.exists()) {
            setIsAdmin(true);
          } else {
            const supervisorDoc = await getDoc(doc(db, "supervisors", user.uid));
            if (supervisorDoc.exists()) {
              setIsAdmin(true);
            } else {
              setError("Profil tidak ditemukan. Pastikan UID Anda terdaftar sebagai Admin, Pembina, atau Koordinator.");
            }
          }
        }
      } catch (err) {
        console.error("Error checking role:", err);
        setError("Gagal memuat profil.");
      } finally {
        setLoading(false);
      }
    }
    checkRoleAndProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-6 space-y-4">
        <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-100 max-w-md">
          <p className="font-semibold font-serif text-lg">Akses Ditolak</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight font-serif text-emerald-900">Absensi Sholat</h1>

        {missingRecords.length > 0 && (
          <Card className="border-none shadow-md bg-amber-50 rounded-[2rem] overflow-hidden animate-in fade-in duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="bg-amber-100 p-4 rounded-3xl text-amber-600 shadow-inner">
                  <CalendarClock size={32} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-serif font-bold text-amber-950">Ada Absensi Yang Terlewat!</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Anda belum mengisi absensi sholat untuk jadwal berikut. Silakan klik tombol di bawah untuk langsung mengisinya.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  {missingRecords.map((record, i) => (
                    <Button 
                      key={i} 
                      onClick={() => {
                        window.location.href = `/dashboard/attendance?date=${record.date}&prayer=${record.prayer}`;
                      }}
                      variant="outline" 
                      className="text-[10px] h-8 rounded-full border-amber-200 bg-white hover:bg-amber-100 hover:text-amber-900 capitalize font-bold"
                    >
                      {format(new Date(record.date), "EEE, dd MMM", { locale: idLocale })} • {record.prayer === 'jumat' ? "Jum'at" : record.prayer}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/60 backdrop-blur-md p-4 rounded-[2rem] shadow-sm border border-emerald-50">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-emerald-900 font-bold ml-1">Tanggal</Label>
            <Input 
              type="date" 
              id="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border-emerald-100 bg-white"
            />
          </div>

          {isAdmin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="class" className="text-emerald-900 font-bold ml-1">Kelas</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger id="class" className="rounded-xl border-emerald-100 bg-white">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {AVAILABLE_CLASSES.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-emerald-900 font-bold ml-1">Kategori</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                  <SelectTrigger id="gender" className="rounded-xl border-emerald-100 bg-white">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ikhwan">Ikhwan</SelectItem>
                    <SelectItem value="akhwat">Akhwat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {!isAdmin && classId && (
            <div className="md:col-span-2 flex items-end">
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 w-full shadow-inner">
                <p className="text-sm font-medium">
                  Monitoring Kelas: <span className="font-bold">{AVAILABLE_CLASSES.find(c => c.id === classId)?.name}</span> • 
                  Kategori: <span className="font-bold capitalize">{gender}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {classId && gender ? (
        <AttendanceRecorder 
          classId={classId} 
          gender={gender} 
          date={date}
          defaultPrayer={paramPrayer as any}
        />
      ) : (
        <div className="flex h-48 items-center justify-center border-2 border-dashed border-emerald-100 rounded-[2.5rem] text-muted-foreground bg-white/40 backdrop-blur-sm">
          <p className="font-medium text-emerald-600/60">Silakan pilih kelas dan kategori untuk melihat daftar absen.</p>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AttendanceContent />
    </Suspense>
  );
}
