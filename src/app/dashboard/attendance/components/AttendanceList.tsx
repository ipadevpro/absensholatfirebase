"use client";

import { Student, AttendanceStatus, Gender } from "@/types";
import { Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceListProps {
  students: Student[];
  studentStatuses: Record<string, AttendanceStatus>;
  updatingIds: Set<string>;
  onStatusChange: (id: string, status: AttendanceStatus) => void;
  prayerKey: string;
  gender: Gender;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; short: string }[] = [
  { value: "hadir", label: "Hadir", color: "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100", short: "H" },
  { value: "sakit", label: "Sakit", color: "bg-amber-500 text-white border-amber-500 shadow-amber-100", short: "S" },
  { value: "izin", label: "Izin", color: "bg-blue-500 text-white border-blue-500 shadow-blue-100", short: "I" },
  { value: "alpa", label: "Alpa", color: "bg-rose-500 text-white border-rose-500 shadow-rose-100", short: "A" },
  { value: "haid", label: "Haid", color: "bg-purple-500 text-white border-purple-500 shadow-purple-100", short: "HD" },
];

export function AttendanceList({
  students,
  studentStatuses,
  updatingIds,
  onStatusChange,
  prayerKey,
  gender,
}: AttendanceListProps) {
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="bg-emerald-50 p-4 rounded-full mb-4">
          <User className="h-8 w-8 text-emerald-300" />
        </div>
        <p className="text-emerald-900 font-serif font-bold text-lg">Belum Ada Siswa</p>
        <p className="text-emerald-600/60 text-sm max-w-[200px]">Silakan hubungi Admin untuk mendaftarkan siswa di kelas ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
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
              "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[1.5rem] transition-all duration-300 border select-none group bg-white shadow-sm",
              currentStatus === "hadir" ? "border-emerald-100 bg-emerald-50/10" : 
              currentStatus ? "border-gray-200 bg-gray-50/30" : "border-emerald-50"
            )}
          >
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner shrink-0",
                currentStatus === "hadir" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
              )}>
                <span className="font-serif font-bold text-lg">
                  {student.name.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold tracking-tight text-base leading-tight mb-0.5 truncate">{student.name}</p>
                <p className="text-[10px] uppercase tracking-[0.1em] font-bold opacity-40 text-gray-500">
                  {student.gender} • {student.classId.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 relative">
              {isUpdating && (
                <div className="absolute -left-8 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                </div>
              )}
              
              <div className="flex flex-1 sm:flex-none justify-between gap-1.5">
                {options.map((opt) => {
                  const isActive = currentStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => !isUpdating && onStatusChange(student.id, opt.value)}
                      className={cn(
                        "flex-1 sm:flex-none flex flex-col items-center justify-center min-w-[42px] h-12 rounded-2xl text-[10px] font-black transition-all border-2",
                        isActive
                          ? opt.color + " shadow-lg scale-105 z-10"
                          : "bg-white border-gray-100 text-gray-300 hover:border-emerald-100 hover:text-emerald-600 hover:bg-emerald-50/50"
                      )}
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
    </div>
  );
}
