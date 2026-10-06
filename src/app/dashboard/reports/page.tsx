"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAttendanceStats, getDetailedMonthlyData, getOverallAttendanceData } from "@/lib/db/reports";
import { AttendanceStats as StatsType } from "@/types";
import { AttendanceStats } from "./components/AttendanceStats";
import { ReportMetrics } from "./components/ReportMetrics";
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
import { Loader2, Search, FileSpreadsheet, Download } from "lucide-react";
import { exportMonthlyReportToXLSX, exportComprehensiveReportToXLSX } from "@/lib/exportExcel";
import { ExportRangeDialog } from "./components/ExportRangeDialog";
import { toast } from "sonner";

export default function ReportsPage() {
  const { role, profile, loading: authLoading } = useAuth();
  
  // State
  const [classId, setClassId] = useState<string>("");
  const [gender, setGender] = useState<string>("ikhwan");
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [stats, setStats] = useState<StatsType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExportingMonth, setIsExportingMonth] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
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

  // Fetch stats for current selection
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

  // Export current selected month to XLSX (with date-by-date columns and score without %)
  const handleExportMonthXLSX = async () => {
    if (!classId) return;
    setIsExportingMonth(true);
    try {
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const monthName = monthNames[parseInt(month) - 1] || month;
      
      const detailed = await getDetailedMonthlyData(
        classId,
        gender,
        parseInt(year),
        parseInt(month)
      );

      if (detailed.data.length === 0) {
        toast.error("Tidak ada data siswa untuk diekspor");
        return;
      }

      exportMonthlyReportToXLSX({
        className: detailed.className,
        gender,
        monthName,
        year: parseInt(year),
        dates: detailed.dates,
        data: detailed.data,
      });

      toast.success("Laporan Excel (.xlsx) berhasil diunduh");
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Gagal mengekspor laporan: " + err.message);
    } finally {
      setIsExportingMonth(false);
    }
  };

  // Download comprehensive attendance for ALL classes (Admin) or ASSIGNED classes (Pembina)
  const handleExportAllAttendanceXLSX = async () => {
    setIsExportingAll(true);
    try {
      let targetClassIds: string[] = [];
      let targetTitle = "Seluruh Kelas";

      if (role === "admin") {
        targetClassIds = AVAILABLE_CLASSES.map((c) => c.id);
        targetTitle = "Seluruh Kelas SMP PGII 1 Bandung";
      } else if (role === "supervisor") {
        targetClassIds = supervisorClasses.length > 0 ? supervisorClasses : AVAILABLE_CLASSES.map((c) => c.id);
        targetTitle = `Kelas Binaan (${targetClassIds.map((c) => AVAILABLE_CLASSES.find((cls) => cls.id === c)?.name || c).join(", ")})`;
      } else if (classId) {
        targetClassIds = [classId];
        targetTitle = `Kelas ${AVAILABLE_CLASSES.find((c) => c.id === classId)?.name || classId}`;
      }

      if (targetClassIds.length === 0) {
        toast.error("Tidak ada kelas yang ditemukan untuk diekspor");
        return;
      }

      const toastId = toast.loading("Mengumpulkan seluruh data absensi sholat...");
      const comprehensive = await getOverallAttendanceData(
        targetClassIds,
        parseInt(year)
      );
      toast.dismiss(toastId);

      if (comprehensive.monthlySummaries.length === 0) {
        toast.error("Tidak ada data absensi untuk tahun ini");
        return;
      }

      exportComprehensiveReportToXLSX({
        title: targetTitle,
        year: parseInt(year),
        monthlySummaries: comprehensive.monthlySummaries,
        dailyAttendances: comprehensive.dailyAttendances,
        allDates: comprehensive.allDates,
      });

      toast.success("Rekapitulasi keseluruhan (.xlsx) berhasil diunduh!");
    } catch (err: any) {
      console.error("Error exporting overall attendance:", err);
      toast.error("Gagal mendownload data keseluruhan: " + err.message);
    } finally {
      setIsExportingAll(false);
    }
  };

  const filteredClassesForSelect = supervisorClasses.length > 0
    ? AVAILABLE_CLASSES.filter(c => supervisorClasses.includes(c.id))
    : AVAILABLE_CLASSES;

  const canDownloadAll = role === "admin" || role === "supervisor";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan Absensi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rekap kehadiran dan perhitungan nilai kedisiplinan sholat siswa.
          </p>
        </div>

        <Button
          onClick={() => setShowExportDialog(true)}
          className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 px-4 font-semibold shadow-xs active:scale-[0.97] touch-manipulation transition-transform self-start sm:self-auto"
        >
          <FileSpreadsheet className="h-4 w-4 mr-1.5" />
          Download Excel (Semester / Rentang)
        </Button>
      </div>

      {/* Filter Card */}
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
            onClick={() => setShowExportDialog(true)} 
            variant="outline" 
            title="Download Laporan Excel (.xlsx)"
            aria-label="Download Laporan Excel (.xlsx)"
            className="h-9 px-2.5 rounded-lg border-border hover:bg-accent shrink-0 active:scale-[0.97] touch-manipulation transition-transform flex items-center gap-1 text-xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span className="hidden sm:inline font-medium">Export</span>
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <ReportMetrics stats={stats} loading={loading} />

      {/* Main Stats Table */}
      <AttendanceStats stats={stats} loading={loading} />

      {/* Pop-up Range & Semester Excel Export Dialog */}
      <ExportRangeDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        userRole={role}
        userClassId={classId}
        userGender={gender}
        supervisorClasses={supervisorClasses}
      />
    </div>
  );
}
