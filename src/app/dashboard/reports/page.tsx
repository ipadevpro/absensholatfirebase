"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAttendanceStats } from "@/lib/db/reports";
import { AttendanceStats as StatsType, Coordinator } from "@/types";
import { AttendanceStats } from "./components/AttendanceStats";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Download } from "lucide-react";
import { exportToCSV } from "@/lib/export";
import { toast } from "sonner";

function getGrade(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "E";
}

export default function ReportsPage() {
  const { user } = useAuth();
  
  // State
  const [classId, setClassId] = useState<string>("");
  const [gender, setGender] = useState<string>("ikhwan");
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [stats, setStats] = useState<StatsType[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load profile and check role
  useEffect(() => {
    async function checkRoleAndProfile() {
      if (!user) {
        setInitialLoading(false);
        return;
      }
      try {
        // 1. Check coordinator (UID as doc ID)
        const coordDoc = await getDoc(doc(db, "coordinators", user.uid));
        if (coordDoc.exists()) {
          const data = coordDoc.data() as Coordinator;
          setClassId(data.classId);
          setGender(data.gender);
          setIsAdmin(false);
        } else {
          // 2. Check admin
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (adminDoc.exists()) {
            setIsAdmin(true);
          }
        }
      } catch (e) {
        console.error("Error checking role:", e);
      } finally {
        setInitialLoading(false);
      }
    }
    checkRoleAndProfile();
  }, [user]);

  // Fetch stats
  const handleFetch = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const data = await getAttendanceStats(
        classId,
        gender,
        parseInt(year),
        parseInt(month)
      );
      setStats(data);
    } catch (e) {
      console.error("Error fetching stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (stats.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    
    const exportData = stats.map(s => ({
      "Nama Siswa": s.studentName,
      "Jumlah Hadir": s.attended,
      "Total Sholat": s.totalPrayers,
      "Persentase": `${s.percentage}%`,
      "Nilai": getGrade(s.percentage)
    }));
    
    const className = AVAILABLE_CLASSES.find(c => c.id === classId)?.name || classId;
    const fileName = `Laporan_Absen_${className}_${month}_${year}`;
    
    exportToCSV(exportData, fileName);
    toast.success("Laporan berhasil diunduh");
  };

  if (initialLoading) {
     return (
       <div className="flex h-full items-center justify-center p-12">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Laporan Absensi</h1>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-5 items-end bg-white p-4 rounded-lg border shadow-sm">
        <div className="space-y-2">
          <Label>Kelas</Label>
          {isAdmin ? (
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_CLASSES.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-10 px-3 py-2 rounded-md border bg-muted text-sm flex items-center">
              {AVAILABLE_CLASSES.find(c => c.id === classId)?.name || classId}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Kategori</Label>
          {isAdmin ? (
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ikhwan">Ikhwan</SelectItem>
                <SelectItem value="akhwat">Akhwat</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="h-10 px-3 py-2 rounded-md border bg-muted text-sm flex items-center capitalize">
              {gender}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Bulan</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {new Date(0, m - 1).toLocaleString('id-ID', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tahun</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from(
                { length: new Date().getFullYear() - 2023 + 2 },
                (_, i) => 2023 + i
              ).map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:col-span-1">
          <Button onClick={handleFetch} disabled={loading || !classId} className="flex-1">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Tampilkan
          </Button>
          <Button onClick={handleExport} variant="outline" disabled={loading || stats.length === 0} title="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AttendanceStats stats={stats} />
    </div>
  );
}
