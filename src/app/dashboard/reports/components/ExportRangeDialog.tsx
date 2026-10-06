"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { getRangeAttendanceData } from "@/lib/db/reports";
import { exportRangeReportToXLSX } from "@/lib/exportExcel";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, CheckCircle2, CalendarRange, Sparkles } from "lucide-react";

interface ExportRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: "admin" | "coordinator" | "supervisor" | null;
  userClassId?: string;
  userGender?: string;
  supervisorClasses?: string[];
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function ExportRangeDialog({
  open,
  onOpenChange,
  userRole,
  userClassId = "",
  userGender = "ikhwan",
  supervisorClasses = [],
}: ExportRangeDialogProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Initial state: default to current semester
  // Semester 1 (Ganjil): Jul (7) - Des (12)
  // Semester 2 (Genap): Jan (1) - Jun (6)
  const defaultIsGanjil = currentMonth >= 7;
  const [selectedPreset, setSelectedPreset] = useState<string>(defaultIsGanjil ? "ganjil" : "genap");
  const [startMonth, setStartMonth] = useState<number>(defaultIsGanjil ? 7 : 1);
  const [endMonth, setEndMonth] = useState<number>(defaultIsGanjil ? 12 : 6);
  const [year, setYear] = useState<number>(currentYear);

  // Scope state
  const [targetClassScope, setTargetClassScope] = useState<string>("all");
  const [targetGender, setTargetGender] = useState<string>("all");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const applyPreset = (presetKey: "ganjil" | "genap" | "year" | "current") => {
    setSelectedPreset(presetKey);
    if (presetKey === "ganjil") {
      setStartMonth(7);
      setEndMonth(12);
    } else if (presetKey === "genap") {
      setStartMonth(1);
      setEndMonth(6);
    } else if (presetKey === "year") {
      setStartMonth(1);
      setEndMonth(12);
    } else if (presetKey === "current") {
      setStartMonth(currentMonth);
      setEndMonth(currentMonth);
    }
  };

  const handleStartMonthChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    setStartMonth(val);
    setSelectedPreset("custom");
    if (val > endMonth) {
      setEndMonth(val);
    }
  };

  const handleEndMonthChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    setEndMonth(val);
    setSelectedPreset("custom");
    if (val < startMonth) {
      setStartMonth(val);
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      // 1. Determine target classes
      let classIds: string[] = [];
      let scopeTitle = "";

      if (userRole === "admin") {
        if (targetClassScope === "all") {
          classIds = AVAILABLE_CLASSES.map((c) => c.id);
          scopeTitle = "Seluruh Kelas SMP PGII 1 Bandung";
        } else {
          classIds = [targetClassScope];
          const cName = AVAILABLE_CLASSES.find((c) => c.id === targetClassScope)?.name || targetClassScope;
          scopeTitle = `Kelas ${cName}`;
        }
      } else if (userRole === "supervisor") {
        const allowed = supervisorClasses.length > 0 ? supervisorClasses : AVAILABLE_CLASSES.map((c) => c.id);
        if (targetClassScope === "all") {
          classIds = allowed;
          scopeTitle = `Kelas Binaan (${allowed.map((c) => AVAILABLE_CLASSES.find((cls) => cls.id === c)?.name || c).join(", ")})`;
        } else {
          classIds = [targetClassScope];
          const cName = AVAILABLE_CLASSES.find((c) => c.id === targetClassScope)?.name || targetClassScope;
          scopeTitle = `Kelas ${cName}`;
        }
      } else {
        // Coordinator
        classIds = [userClassId];
        const cName = AVAILABLE_CLASSES.find((c) => c.id === userClassId)?.name || userClassId;
        scopeTitle = `Kelas ${cName} (${userGender})`;
      }

      if (classIds.length === 0) {
        toast.error("Tidak ada kelas yang dipilih");
        return;
      }

      const genderParam = userRole === "coordinator" ? userGender : targetGender;

      const toastId = toast.loading("Memproses rekapitulasi data absensi sholat...");

      const result = await getRangeAttendanceData({
        classIds,
        gender: genderParam,
        year,
        startMonth,
        endMonth,
      });

      toast.dismiss(toastId);

      if (result.monthlySummaries.length === 0 && result.dailyAttendances.length === 0) {
        toast.error("Tidak ada data absensi untuk rentang waktu yang dipilih");
        return;
      }

      exportRangeReportToXLSX({
        title: scopeTitle,
        year,
        startMonth,
        endMonth,
        monthlySummaries: result.monthlySummaries,
        dailyAttendances: result.dailyAttendances,
        allDates: result.allDates,
      });

      toast.success("Laporan Excel (.xlsx) berhasil diunduh!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Export range error:", err);
      toast.error("Gagal mendownload laporan: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const availableClassesForSupervisor = supervisorClasses.length > 0
    ? AVAILABLE_CLASSES.filter((c) => supervisorClasses.includes(c.id))
    : AVAILABLE_CLASSES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl border border-border">
        <DialogHeader className="p-5 pb-3 border-b border-border">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
            Download Laporan Excel (.xlsx)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pilih rentang bulan atau semester untuk menghasilkan rekap nilai sholat yang adil dan akurat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5 text-primary" />
              Pilihan Cepat Rentang Waktu:
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                type="button"
                variant={selectedPreset === "ganjil" ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset("ganjil")}
                className="h-8 text-xs font-medium rounded-lg active:scale-[0.98] transition-transform"
              >
                Semester Ganjil
              </Button>
              <Button
                type="button"
                variant={selectedPreset === "genap" ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset("genap")}
                className="h-8 text-xs font-medium rounded-lg active:scale-[0.98] transition-transform"
              >
                Semester Genap
              </Button>
              <Button
                type="button"
                variant={selectedPreset === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset("year")}
                className="h-8 text-xs font-medium rounded-lg active:scale-[0.98] transition-transform"
              >
                1 Tahun Penuh
              </Button>
              <Button
                type="button"
                variant={selectedPreset === "current" ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset("current")}
                className="h-8 text-xs font-medium rounded-lg active:scale-[0.98] transition-transform"
              >
                Bulan Ini
              </Button>
            </div>
          </div>

          {/* Month Range & Year Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/70">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Dari Bulan</Label>
              <Select value={String(startMonth)} onValueChange={handleStartMonthChange}>
                <SelectTrigger className="h-8 text-xs rounded-lg bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {MONTH_NAMES.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Sampai Bulan</Label>
              <Select value={String(endMonth)} onValueChange={handleEndMonthChange}>
                <SelectTrigger className="h-8 text-xs rounded-lg bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {MONTH_NAMES.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Tahun</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v, 10))}>
                <SelectTrigger className="h-8 text-xs rounded-lg bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {Array.from({ length: 4 }, (_, i) => currentYear - 2 + i).map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-xs">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scope Filters (Role-based) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userRole === "admin" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Cakupan Kelas</Label>
                  <Select value={targetClassScope} onValueChange={setTargetClassScope}>
                    <SelectTrigger className="h-8 text-xs rounded-lg bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="all" className="text-xs font-semibold">Semua Kelas (7A - 9H)</SelectItem>
                      {AVAILABLE_CLASSES.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id} className="text-xs">
                          Kelas {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Kategori Siswa</Label>
                  <Select value={targetGender} onValueChange={setTargetGender}>
                    <SelectTrigger className="h-8 text-xs rounded-lg bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="all" className="text-xs">Semua (Ikhwan & Akhwat)</SelectItem>
                      <SelectItem value="ikhwan" className="text-xs">Hanya Ikhwan</SelectItem>
                      <SelectItem value="akhwat" className="text-xs">Hanya Akhwat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {userRole === "supervisor" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Cakupan Kelas</Label>
                  <Select value={targetClassScope} onValueChange={setTargetClassScope}>
                    <SelectTrigger className="h-8 text-xs rounded-lg bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="all" className="text-xs font-semibold">Semua Kelas Binaan</SelectItem>
                      {availableClassesForSupervisor.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id} className="text-xs">
                          Kelas {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Kategori Siswa</Label>
                  <Select value={targetGender} onValueChange={setTargetGender}>
                    <SelectTrigger className="h-8 text-xs rounded-lg bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="all" className="text-xs">Semua (Ikhwan & Akhwat)</SelectItem>
                      <SelectItem value="ikhwan" className="text-xs">Hanya Ikhwan</SelectItem>
                      <SelectItem value="akhwat" className="text-xs">Hanya Akhwat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {userRole === "coordinator" && (
              <div className="sm:col-span-2 p-3 bg-card border border-border rounded-lg text-xs space-y-1">
                <span className="text-muted-foreground block text-[11px]">Kelas & Kategori Koordinator:</span>
                <span className="font-semibold text-foreground">
                  Kelas {AVAILABLE_CLASSES.find((c) => c.id === userClassId)?.name || userClassId} • {userGender === "ikhwan" ? "Ikhwan" : "Akhwat"}
                </span>
              </div>
            )}
          </div>

          {/* Rule Highlights */}
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 text-xs space-y-1.5 text-emerald-950">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Ketentuan Perhitungan Nilai:
            </div>
            <ul className="space-y-1 text-[11px] text-emerald-800/90 pl-4 list-disc">
              <li>
                <strong>Sistem Rata-rata Adil:</strong> Rata-rata dihitung murni mengikuti rentang bulan yang dipilih berdasarkan sesi sholat yang benar-benar tercatat di sistem.
              </li>
              <li>
                <strong>Siswa Haid Tetap Hadir:</strong> Siswi yang berhalangan haid dihitung hadir penuh tanpa mengurangi nilai.
              </li>
              <li>
                <strong>Khusus Ikhwan di Hari Jum&apos;at:</strong> Tersedia kolom khusus <em>Nilai Sholat Jum&apos;at</em>.
              </li>
              <li>
                <strong>Format Nilai:</strong> Angka murni (0–100) tanpa simbol %, memudahkan input langsung ke rapor siswa.
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border flex items-center justify-between sm:justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="rounded-lg text-xs h-8"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDownload}
            disabled={isExporting}
            className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 font-semibold shadow-xs active:scale-[0.98] transition-transform"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Mengunduh...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Unduh Excel (.xlsx)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
