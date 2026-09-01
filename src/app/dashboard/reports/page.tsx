"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAttendanceStats } from "@/lib/db/reports";
import { AttendanceStats as StatsType } from "@/types";
import { AttendanceStats } from "./components/AttendanceStats";
import { AVAILABLE_CLASSES } from "@/lib/constants";
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
  const { role, profile, loading: authLoading } = useAuth();
  
  // State
  const [classId, setClassId] = useState<string>("");
  const [gender, setGender] = useState<string>("ikhwan");
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [stats, setStats] = useState<StatsType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [supervisorClasses, setSupervisorClasses] = useState<string[]>([]);

  // Load profile and check role
  useEffect(() => {
    if (authLoading) return;
    
    if (role === "coordinator" && profile) {
      setClassId(profile.classId);
      setGender(profile.gender);
      setIsAdmin(false);
    } else if (role === "supervisor" && profile) {
      const assignedClasses = profile.classes || [];
      setSupervisorClasses(assignedClasses);
      if (assignedClasses.length > 0) {
        setClassId(assignedClasses[0]);
      }
      setIsAdmin(true);
    } else if (role === "admin") {
      setIsAdmin(true);
    }
  }, [role, profile, authLoading]);

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
      if (data.length === 0) {
        toast.info("Tidak ada data absensi untuk periode yang dipilih");
      }
    } catch (e: any) {
      console.error("Error fetching stats:", e);
      toast.error("Gagal memuat laporan: " + e.message);
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
      "Nilai (%)": s.percentage,
      "Grade": getGrade(s.percentage)
    }));
    
    const className = AVAILABLE_CLASSES.find(c => c.id === classId)?.name || classId;
    const fileName = `Laporan_Absen_Kelas_${className}_${gender}_${month}_${year}`;
    
    exportToCSV(exportData, fileName);
    toast.success("Laporan berhasil diunduh");
  };

  const filteredClassesForSelect = supervisorClasses.length > 0
    ? AVAILABLE_CLASSES.filter(c => supervisorClasses.includes(c.id))
    : AVAILABLE_CLASSES;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan Absensi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rekap kehadiran dan perhitungan nilai kedisiplinan sholat siswa.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-5 items-end bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">Kelas</Label>
          {isAdmin ? (
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="h-9 text-xs rounded-lg border-input bg-background">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {filteredClassesForSelect.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id} className="text-xs">
                    Kelas {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 px-3 rounded-lg border border-border bg-muted/50 text-xs font-medium text-foreground flex items-center">
              Kelas {AVAILABLE_CLASSES.find(c => c.id === classId)?.name || classId}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">Kategori</Label>
          {isAdmin ? (
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="h-9 text-xs rounded-lg border-input bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="ikhwan" className="text-xs">Ikhwan</SelectItem>
                <SelectItem value="akhwat" className="text-xs">Akhwat</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 px-3 rounded-lg border border-border bg-muted/50 text-xs font-medium text-foreground flex items-center capitalize">
              {gender}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">Bulan</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-9 text-xs rounded-lg border-input bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)} className="text-xs">
                  {new Date(0, m - 1).toLocaleString('id-ID', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">Tahun</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 text-xs rounded-lg border-input bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {Array.from(
                { length: new Date().getFullYear() - 2023 + 2 },
                (_, i) => 2023 + i
              ).map((y) => (
                <SelectItem key={y} value={String(y)} className="text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full sm:col-span-2 md:col-span-1">
          <Button 
            onClick={handleFetch} 
            disabled={loading || !classId} 
            aria-label="Tampilkan data laporan rekapitulasi"
            className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm active:scale-[0.97] touch-manipulation transition-transform"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1.5" />
            )}
            Tampilkan
          </Button>
          <Button 
            onClick={handleExport} 
            variant="outline" 
            disabled={loading || stats.length === 0} 
            title="Ekspor ke CSV"
            aria-label="Ekspor rekapitulasi ke file CSV"
            className="h-9 w-9 min-h-[36px] min-w-[36px] p-0 rounded-lg border-border hover:bg-accent shrink-0 active:scale-[0.97] touch-manipulation transition-transform"
          >
            <Download className="h-4 w-4 text-foreground" />
          </Button>
        </div>
      </div>

      <AttendanceStats stats={stats} loading={loading} />
    </div>
  );
}
