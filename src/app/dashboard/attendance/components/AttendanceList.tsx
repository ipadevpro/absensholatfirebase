"use client";

import { Student, AttendanceStatus, Gender } from "@/types";
import { Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceListProps {
  students: Student[];
  studentStatuses: Record<string, AttendanceStatus>;
  updatingIds: Set<string>;
  onStatusChange: (id: string, status: AttendanceStatus) => void;
  prayerKey: string;
  gender: Gender;
  loading?: boolean;
}

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  activeClass: string;
  short: string;
}[] = [
  {
    value: "hadir",
    label: "Hadir",
    activeClass: "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-600/30 shadow-sm",
    short: "H",
  },
  {
    value: "sakit",
    label: "Sakit",
    activeClass: "bg-amber-500 text-white border-amber-500 ring-2 ring-amber-500/30 shadow-sm",
    short: "S",
  },
  {
    value: "izin",
    label: "Izin",
    activeClass: "bg-blue-500 text-white border-blue-500 ring-2 ring-blue-500/30 shadow-sm",
    short: "I",
  },
  {
    value: "alpa",
    label: "Alpa",
    activeClass: "bg-rose-500 text-white border-rose-500 ring-2 ring-rose-500/30 shadow-sm",
    short: "A",
  },
  {
    value: "haid",
    label: "Haid",
    activeClass: "bg-purple-600 text-white border-purple-600 ring-2 ring-purple-600/30 shadow-sm",
    short: "HD",
  },
];

function AttendanceLegend({ gender }: { gender: Gender }) {
  return (
    <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">
        Keterangan Status:
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">H</span>
          <span className="text-foreground font-medium">Hadir</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">S</span>
          <span className="text-foreground font-medium">Sakit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-blue-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">I</span>
          <span className="text-foreground font-medium">Izin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-rose-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">A</span>
          <span className="text-foreground font-medium">Alpa <span className="text-muted-foreground font-normal">(Tanpa Keterangan)</span></span>
        </div>
        {gender === "akhwat" && (
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">HD</span>
            <span className="text-foreground font-medium">Haid <span className="text-purple-600 font-semibold">(Dihitung Hadir)</span></span>
          </div>
        )}
      </div>
    </div>
  );
}

export function AttendanceList({
  students,
  studentStatuses,
  updatingIds,
  onStatusChange,
  gender,
  loading = false,
}: AttendanceListProps) {
  if (loading) {
    const numButtons = gender === "akhwat" ? 5 : 4;
    return (
      <div className="space-y-2.5 pt-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border bg-card shadow-sm gap-3 sm:gap-4"
          >
            {/* Student Info Skeleton */}
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32 sm:w-44" />
                <Skeleton className="h-3 w-24 sm:w-28" />
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-1.5 relative w-full sm:w-auto">
              <div className="flex flex-1 sm:flex-none justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
                {Array.from({ length: numButtons }).map((_, btnIdx) => (
                  <Skeleton
                    key={btnIdx}
                    className="flex-1 sm:flex-none min-w-[42px] h-11 rounded-lg"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Legend Box */}
        <AttendanceLegend gender={gender} />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl bg-muted/10 my-4">
        <div className="bg-muted p-3.5 rounded-full mb-3 text-muted-foreground">
          <User className="h-6 w-6" />
        </div>
        <p className="text-foreground font-semibold text-base">Belum Ada Siswa</p>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-xs mt-1">
          Silakan hubungi Admin untuk mendaftarkan siswa di kelas ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pt-2">
      {students.map((student) => {
        const currentStatus = studentStatuses[student.id];
        const isUpdating = updatingIds.has(student.id);
        const options = student.gender === "akhwat" 
          ? STATUS_OPTIONS 
          : STATUS_OPTIONS.filter(o => o.value !== "haid");

        return (
          <div
            key={student.id}
            className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl transition-all duration-200 border select-none bg-card shadow-sm gap-3 sm:gap-4",
              currentStatus === "hadir" 
                ? "border-emerald-200/60 bg-emerald-50/20" 
                : currentStatus 
                ? "border-border bg-muted/10" 
                : "border-border"
            )}
          >
            {/* Student Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base shrink-0 select-none transition-colors",
                  currentStatus === "hadir"
                    ? "bg-emerald-100 text-emerald-800"
                    : currentStatus
                    ? "bg-muted text-foreground"
                    : "bg-muted/60 text-muted-foreground"
                )}
              >
                <span>{student.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base text-foreground leading-tight truncate">
                  {student.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5 truncate">
                  {student.gender} • Kelas {student.classId.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 relative w-full sm:w-auto">
              {isUpdating && (
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 hidden sm:block">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              
              <div className="flex flex-1 sm:flex-none justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
                {options.map((opt) => {
                  const isActive = currentStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => !isUpdating && onStatusChange(student.id, opt.value)}
                      className={cn(
                        "flex-1 sm:flex-none flex items-center justify-center min-w-[42px] h-11 rounded-lg text-xs font-bold transition-all border",
                        isActive
                          ? opt.activeClass + " font-black"
                          : "bg-muted/30 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      title={opt.label}
                    >
                      <span>{opt.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Legend Box */}
      <AttendanceLegend gender={gender} />
    </div>
  );
}
