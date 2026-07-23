"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Student, PrayerType, AttendanceStatus } from "@/types";
import { getStudentsByClass } from "@/lib/db/students";
import { saveAttendanceRecord, subscribeToAttendance } from "@/lib/db/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Clock, 
  MoonStar, 
  CheckCheck, 
  Save, 
  AlertCircle,
  PartyPopper,
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
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const scrollSentinelRef = useRef<HTMLDivElement>(null);
  
  const prayers = useMemo(() => getPrayersForDay(gender, new Date(date)), [gender, date]);
  
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerType>(defaultPrayer || prayers[0] || "zuhur");
  const [studentStatuses, setStudentStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

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

  // Use IntersectionObserver instead of scroll listener for better compatibility with h-screen layouts
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
    async function fetchStudents() {
      try {
        const data = await getStudentsByClass(classId);
        setStudents(data.filter(s => s.gender === gender));
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    }
    fetchStudents();
  }, [classId, gender]);

  useEffect(() => {
    if (!date || !classId) return;
    
    setLoading(true);
    const unsubscribe = subscribeToAttendance(
      date,
      classId,
      gender,
      selectedPrayer,
      (statuses) => {
        setStudentStatuses(statuses);
        setLocalStatuses(statuses);
        setIsDirty(false);
        setLoading(false);
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
    toast.success(`Ditandai hadir ${studentsToUpdate.length} siswa secara lokal. Tekan tombol Simpan di bawah untuk menyimpan ke server.`);
  };

  const handleFinalSubmit = async () => {
    const missingStatus = students.filter(s => !localStatuses[s.id]);
    
    if (missingStatus.length > 0) {
      toast.error(`Masih ada ${missingStatus.length} siswa yang belum diabsen!`, {
        icon: <AlertCircle className="text-rose-500" />,
        description: "Mohon lengkapi semua data sebelum menyimpan.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveAttendanceRecord(date, classId, gender, selectedPrayer, localStatuses);
      setIsDirty(false);
      setStudentStatuses(localStatuses);
      setShowSuccess(true);
      toast.success("Data absensi berhasil disimpan ke server!", {
        icon: <CheckCheck className="text-emerald-500" />,
      });
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Gagal menyimpan absensi ke server");
    } finally {
      setIsSaving(false);
    }
  };

  const stats = useMemo(() => {
    const present = students.filter(s => localStatuses[s.id] === "hadir").length;
    const haid = students.filter(s => localStatuses[s.id] === "haid").length;
    const total = students.length;
    const filled = Object.keys(localStatuses).filter(id => students.some(s => s.id === id)).length;
    const progress = total > 0 ? (filled / total) * 100 : 0;
    return { present, haid, total, filled, progress };
  }, [students, localStatuses]);

  const handlePrayerTabChange = (val: string) => {
    if (isDirty) {
      const confirm = window.confirm("Ada perubahan yang belum disimpan secara permanen. Apakah Anda yakin ingin berpindah tab dan membuang perubahan tersebut?");
      if (!confirm) return;
    }
    setIsDirty(false);
    setSelectedPrayer(val as PrayerType);
  };

  return (
    <div className="relative">
      {/* Scroll Sentinel for Sticky Detection */}
      <div ref={scrollSentinelRef} className="absolute top-0 h-1 w-full pointer-events-none" />

      {/* Sticky Condensed Header */}
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-[50] transition-all duration-500 md:left-72",
          isSticky ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-[#fdfcf0]/95 backdrop-blur-xl border-b border-emerald-100 shadow-lg px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="bg-emerald-600 text-white p-1.5 rounded-lg shrink-0">
                <Clock size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60 leading-none mb-0.5 truncate">
                  Catat {selectedPrayer === 'jumat' ? "Jum'at" : selectedPrayer}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-900 whitespace-nowrap">
                    {stats.present}/{stats.total}
                  </span>
                  {gender === "akhwat" && stats.haid > 0 && (
                    <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 rounded-md font-bold">
                      {stats.haid} HD
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {stats.progress < 100 ? (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleMarkAllPresent}
                  className="rounded-xl bg-emerald-50 text-emerald-700 h-8 text-[10px] font-black uppercase tracking-wider px-3 border border-emerald-100"
                >
                  Hadir Semua
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleFinalSubmit}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-[10px] font-black uppercase tracking-wider px-4 shadow-lg shadow-emerald-100"
                >
                  Simpan
                </Button>
              )}
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
                className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50"
              >
                <ChevronUp size={16} />
              </Button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-100/30">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Success Celebration Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="bg-white rounded-[3rem] p-12 shadow-2xl border-none flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500 mx-4 text-center">
            <div className="bg-emerald-100 p-6 rounded-full text-emerald-600 scale-125">
              <PartyPopper size={64} />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-serif font-bold text-emerald-900">Alhamdulillah!</h2>
              <p className="text-emerald-600 font-medium">Absensi berhasil diselesaikan.</p>
            </div>
            <Button onClick={() => setShowSuccess(false)} className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-12 w-full sm:w-auto">
              Tutup
            </Button>
          </Card>
        </div>
      )}

      <Card className="w-full border-none shadow-xl shadow-emerald-900/5 bg-white/80 backdrop-blur-xl overflow-hidden rounded-[2.5rem]">
        <CardHeader className="pb-6 pt-8 px-8 border-b border-emerald-50 bg-white/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Clock size={16} className="animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-black">Waktu Monitoring</span>
              </div>
              <CardTitle className="text-3xl font-serif font-bold text-emerald-900 flex flex-wrap items-baseline gap-2">
                Catat Ibadah
                <div className="flex gap-2">
                  <span className="text-xs font-sans font-bold text-emerald-600/60 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50">
                    {stats.present}/{stats.total} Hadir
                  </span>
                  {gender === "akhwat" && stats.haid > 0 && (
                    <span className="text-xs font-sans font-bold text-rose-600/60 bg-rose-50 px-3 py-1 rounded-full border border-rose-100/50">
                      {stats.haid} Haid
                    </span>
                  )}
                </div>
              </CardTitle>
            </div>

            {/* Bulk Action Button */}
            <Button 
              variant="outline" 
              onClick={handleMarkAllPresent}
              disabled={loading || stats.total === 0}
              className="rounded-2xl border-emerald-100 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm h-12 px-6"
            >
              <CheckCheck size={18} className="mr-2" />
              Hadir Semua
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-out",
                stats.progress === 100 ? "bg-emerald-500" : "bg-emerald-600/40"
              )}
              style={{ width: `${stats.progress}%` }}
            />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-2 text-right">
            Progress: {Math.round(stats.progress)}% Selesai
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={selectedPrayer} onValueChange={handlePrayerTabChange} className="w-full">
            <div className="px-8 pt-6 pb-2">
              <TabsList className={cn("grid w-full h-14 p-1.5 bg-emerald-50/50 rounded-2xl", prayers.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                {prayers.map((prayer) => (
                  <TabsTrigger 
                    key={prayer} 
                    value={prayer} 
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md transition-all font-black capitalize tracking-wide"
                  >
                    {prayer === "jumat" ? "Jum'at" : prayer}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="px-4 pb-4 min-h-[300px]">
              {prayers.map((prayer) => (
                <TabsContent key={prayer} value={prayer} className="mt-0 outline-none">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center p-24 gap-4">
                      <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-emerald-600/20" />
                        <MoonStar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-emerald-600" />
                      </div>
                      <p className="text-sm font-bold text-emerald-600/40 animate-pulse uppercase tracking-widest">Memuat...</p>
                    </div>
                  ) : (
                    <div className="staggered-reveal">
                      <AttendanceList 
                        students={students}
                        studentStatuses={localStatuses}
                        updatingIds={updatingIds}
                        onStatusChange={handleStatusChange}
                        prayerKey={prayer}
                        gender={gender}
                      />
                    </div>
                  )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>

        {/* Final Submit Bar */}
        <div className="p-8 pt-4 bg-emerald-50/30 border-t border-emerald-50">
          <Button 
            onClick={handleFinalSubmit}
            disabled={loading || isSubmitting || stats.total === 0}
            className={cn(
              "w-full h-16 rounded-[1.5rem] text-lg font-bold shadow-lg transition-all duration-500",
              stats.progress === 100 
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 scale-[1.02]" 
                : "bg-gray-400 cursor-not-allowed opacity-70"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <Save size={22} className="mr-2" />
            )}
            Simpan Absensi Final
          </Button>
          <p className="text-center text-xs text-emerald-600/60 mt-4 font-medium">
            Pastikan seluruh data sudah benar sebelum menekan tombol simpan.
          </p>
        </div>
      </Card>
    </div>
  );
}
