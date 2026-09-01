"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Student, PrayerType, AttendanceStatus } from "@/types";
import { getStudentsByClass } from "@/lib/db/students";
import { saveAttendanceRecord, subscribeToAttendance } from "@/lib/db/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction as AlertDialogActionComponent,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  Clock, 
  CheckCheck, 
  Save, 
  AlertCircle,
  ChevronUp
} from "lucide-react";
import { AttendanceList } from "./AttendanceList";
import { getPrayersForDay, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AttendanceRecorderProps {
  classId: string;
  gender: "ikhwan" | "akhwat";
  date: string; // YYYY-MM-DD
  defaultPrayer?: PrayerType;
}

export function AttendanceRecorder({ classId, gender, date, defaultPrayer }: AttendanceRecorderProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const loading = loadingStudents || loadingAttendance;

  const [isSubmitting, setIsSaving] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [pendingPrayer, setPendingPrayer] = useState<PrayerType | null>(null);
  const scrollSentinelRef = useRef<HTMLDivElement>(null);
  
  const prayers = useMemo(() => getPrayersForDay(gender, new Date(date)), [gender, date]);
  
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerType>(defaultPrayer || prayers[0] || "zuhur");
  const [studentStatuses, setStudentStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [updatingIds] = useState<Set<string>>(new Set());

  const formatPrayerName = (prayer: PrayerType) => {
    if (prayer === "jumat") return "Jum'at";
    return prayer.charAt(0).toUpperCase() + prayer.slice(1);
  };

  // Prevent accidental page reloads when there are unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Sticky detection with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (scrollSentinelRef.current) {
      observer.observe(scrollSentinelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (defaultPrayer && prayers.includes(defaultPrayer)) {
      setSelectedPrayer(defaultPrayer);
    }
  }, [defaultPrayer, prayers]);

  useEffect(() => {
    if (!prayers.includes(selectedPrayer)) {
      setSelectedPrayer(prayers[0] || "zuhur");
    }
  }, [prayers, selectedPrayer]);

  useEffect(() => {
    let isMounted = true;
    async function fetchStudents() {
      try {
        setLoadingStudents(true);
        const data = await getStudentsByClass(classId);
        if (isMounted) {
          setStudents(data.filter(s => s.gender === gender));
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        if (isMounted) {
          setLoadingStudents(false);
        }
      }
    }
    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, [classId, gender]);

  useEffect(() => {
    if (!date || !classId) return;
    
    setLoadingAttendance(true);
    const unsubscribe = subscribeToAttendance(
      date,
      classId,
      gender,
      selectedPrayer,
      (statuses) => {
        setStudentStatuses(statuses);
        setLocalStatuses(statuses);
        setIsDirty(false);
        setLoadingAttendance(false);
      }
    );

    return () => unsubscribe();
  }, [date, classId, gender, selectedPrayer]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setLocalStatuses(prev => ({ ...prev, [studentId]: status }));
    setIsDirty(true);
  };

  const handleMarkAllPresent = () => {
    const studentsToUpdate = students.filter(s => localStatuses[s.id] !== "hadir");
    if (studentsToUpdate.length === 0) {
      toast.info("Semua siswa sudah berstatus hadir");
      return;
    }

    const nextStatuses = { ...localStatuses };
    studentsToUpdate.forEach(s => {
      nextStatuses[s.id] = "hadir";
    });
    setLocalStatuses(nextStatuses);
    setIsDirty(true);
    toast.success(`Ditandai hadir ${studentsToUpdate.length} siswa secara lokal. Tekan tombol Simpan untuk menyimpan ke server.`);
  };

  const stats = useMemo(() => {
    const present = students.filter(s => localStatuses[s.id] === "hadir").length;
    const haid = students.filter(s => localStatuses[s.id] === "haid").length;
    const total = students.length;
    const filled = Object.keys(localStatuses).filter(id => students.some(s => s.id === id)).length;
    const progress = total > 0 ? (filled / total) * 100 : 0;
    return { present, haid, total, filled, progress };
  }, [students, localStatuses]);

  const handleFinalSubmit = async () => {
    const missingStatus = students.filter(s => !localStatuses[s.id]);
    
    if (missingStatus.length > 0) {
      toast.error(`Masih ada ${missingStatus.length} siswa yang belum diabsen!`, {
        icon: <AlertCircle className="text-destructive h-4 w-4" />,
        description: "Mohon lengkapi semua data sebelum menyimpan.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveAttendanceRecord(date, classId, gender, selectedPrayer, localStatuses);
      setIsDirty(false);
      setStudentStatuses(localStatuses);
      toast.success("Data absensi berhasil disimpan ke server!", {
        icon: <CheckCheck className="text-emerald-600 h-4 w-4" />,
        description: `${formatPrayerName(selectedPrayer)} • ${stats.present} dari ${stats.total} hadir`,
      });
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Gagal menyimpan absensi ke server");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrayerTabChange = (val: string) => {
    const nextPrayer = val as PrayerType;
    if (isDirty) {
      setPendingPrayer(nextPrayer);
      return;
    }
    setSelectedPrayer(nextPrayer);
  };

  const handleConfirmDiscardChanges = () => {
    if (pendingPrayer) {
      setIsDirty(false);
      setSelectedPrayer(pendingPrayer);
      setPendingPrayer(null);
    }
  };

  return (
    <div className="relative">
      {/* Scroll Sentinel for Sticky Detection */}
      <div ref={scrollSentinelRef} className="absolute top-0 h-1 w-full pointer-events-none" />

      {/* Sticky Condensed Header */}
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300 md:left-64",
          isSticky ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-background/95 backdrop-blur-md border-b border-border shadow-sm px-4 py-2.5">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="bg-primary/10 text-primary p-1.5 rounded-lg shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-0.5 truncate">
                  {formatPrayerName(selectedPrayer)}
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  {loading ? (
                    <Skeleton className="h-5 w-12" />
                  ) : (
                    <>
                      <span className="tabular-nums">
                        {stats.present}/{stats.total} Hadir
                      </span>
                      {gender === "akhwat" && stats.haid > 0 && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium tabular-nums">
                          {stats.haid} Haid
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleMarkAllPresent}
                disabled={loading || stats.total === 0}
                className="h-8 text-xs font-medium px-3 rounded-lg border-border"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Hadir Semua
              </Button>
              <Button 
                size="sm" 
                onClick={handleFinalSubmit}
                disabled={loading || isSubmitting || stats.total === 0}
                className="h-8 text-xs font-semibold px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                Simpan
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => {
                  const mainContainer = document.querySelector('main');
                  if (mainContainer) {
                    mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                title="Kembali ke atas"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Micro Progress Bar on Sticky Header */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-muted">
            <div 
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${loading ? 0 : stats.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Recorder Card */}
      <Card className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b border-border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5" />
                <span>Waktu Monitoring</span>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex flex-wrap items-center gap-2.5">
                <span>Catat Ibadah</span>
                {loading ? (
                  <Skeleton className="h-6 w-20 rounded-full" />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-200/60 px-2.5 py-0.5 rounded-full tabular-nums">
                      {stats.present}/{stats.total} Hadir
                    </span>
                    {gender === "akhwat" && stats.haid > 0 && (
                      <span className="text-xs font-semibold text-purple-800 bg-purple-100/70 border border-purple-200/60 px-2.5 py-0.5 rounded-full tabular-nums">
                        {stats.haid} Haid
                      </span>
                    )}
                  </div>
                )}
              </CardTitle>
            </div>

            {/* Bulk Action Button */}
            <Button 
              variant="outline" 
              onClick={handleMarkAllPresent}
              disabled={loading || stats.total === 0}
              className="rounded-lg border-border h-10 px-4 text-sm font-medium self-start sm:self-auto"
            >
              <CheckCheck className="h-4 w-4 mr-2 text-emerald-600" />
              Hadir Semua
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500 ease-out",
                  stats.progress === 100 ? "bg-emerald-600" : "bg-emerald-600/70"
                )}
                style={{ width: `${loading ? 0 : stats.progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              {loading ? (
                <>
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-16" />
                </>
              ) : (
                <>
                  <span>{stats.filled} dari {stats.total} siswa diabsen</span>
                  <span className="font-semibold tabular-nums">{Math.round(stats.progress)}% Selesai</span>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={selectedPrayer} onValueChange={handlePrayerTabChange} className="w-full">
            <div className="p-4 sm:px-6 pt-4 pb-2">
              <TabsList className={cn("grid w-full h-11 p-1 bg-muted rounded-xl", prayers.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                {prayers.map((prayer) => (
                  <TabsTrigger 
                    key={prayer} 
                    value={prayer} 
                    className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm font-semibold capitalize text-xs sm:text-sm transition-all"
                  >
                    {prayer === "jumat" ? "Jum'at" : prayer}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="px-4 pb-4 sm:px-6 min-h-[300px]">
              {prayers.map((prayer) => (
                <TabsContent key={prayer} value={prayer} className="mt-0 outline-none">
                  <AttendanceList 
                    students={students}
                    studentStatuses={localStatuses}
                    updatingIds={updatingIds}
                    onStatusChange={handleStatusChange}
                    prayerKey={prayer}
                    gender={gender}
                    loading={loading}
                  />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>

        {/* Final Submit Bar */}
        <div className="p-4 sm:p-6 bg-muted/20 border-t border-border">
          <Button 
            onClick={handleFinalSubmit}
            disabled={loading || isSubmitting || stats.total === 0}
            className={cn(
              "w-full h-12 rounded-xl text-base font-semibold transition-all duration-200",
              stats.progress === 100 
                ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm" 
                : "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed hover:bg-muted-foreground/20"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            Simpan Absensi Final
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2 font-normal">
            Pastikan seluruh siswa telah terisi statusnya sebelum menekan tombol simpan.
          </p>
        </div>
      </Card>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={pendingPrayer !== null} onOpenChange={(open) => !open && setPendingPrayer(null)}>
        <AlertDialogContent className="rounded-xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Perubahan Belum Disimpan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Ada perubahan status absensi yang belum disimpan ke server. Jika Anda berpindah jadwal sholat, perubahan saat ini akan dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-lg border-border">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDiscardChanges}
              className="rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Pindah & Buang Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
