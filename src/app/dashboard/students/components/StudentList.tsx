"use client";

import { Student } from "@/types";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  GraduationCap, 
  Trash2, 
  UserCog, 
  Edit3,
  SearchX
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentListProps {
  students: Student[];
  loading?: boolean;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onDelegate: (student: Student) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

export function StudentList({ 
  students, 
  loading = false,
  onEdit, 
  onDelete, 
  onDelegate,
  selectedIds,
  onToggleSelect
}: StudentListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-2.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-card border border-border rounded-xl shadow-sm gap-3 sm:gap-4"
          >
            {/* Student Info Skeleton */}
            <div className="flex items-center gap-3.5 min-w-0">
              <Skeleton className="h-4 w-4 rounded shrink-0" />
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-32 sm:w-48" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3.5 w-12 rounded" />
                </div>
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-1.5 mt-3 sm:mt-0 pt-2.5 sm:pt-0 border-t sm:border-none border-border">
              <Skeleton className="h-8 w-20 sm:w-24 rounded-lg" />
              <Skeleton className="h-8 w-16 sm:w-18 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-dashed border-border shadow-sm">
        <div className="bg-muted p-4 rounded-full mb-3 text-muted-foreground">
          <SearchX className="h-8 w-8" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Siswa Tidak Ditemukan</h3>
        <p className="text-muted-foreground text-xs max-w-xs mt-1">Coba ubah kata kunci pencarian atau bersihkan filter yang aktif.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {students.map((student) => (
        <div
          key={student.id}
          className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-card border border-border rounded-xl shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow"
        >
          {/* Student Info */}
          <div className="flex items-center gap-3.5">
            <Checkbox
              checked={selectedIds.includes(student.id)}
              onCheckedChange={() => onToggleSelect(student.id)}
              className="rounded-md h-4 w-4 shrink-0"
            />
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm",
              student.gender === "ikhwan" 
                ? "bg-blue-50 text-blue-700 border border-blue-200/60" 
                : "bg-purple-50 text-purple-700 border border-purple-200/60"
            )}>
              <span className="uppercase">
                {student.name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors truncate">
                {student.name}
              </h4>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-0.5">
                <span className="inline-flex items-center text-xs text-muted-foreground">
                  <GraduationCap size={12} className="mr-1 text-primary" />
                  Kelas {AVAILABLE_CLASSES.find(c => c.id === student.classId)?.name || student.classId}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className={cn(
                  "inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded",
                  student.gender === "ikhwan" ? "text-blue-700 bg-blue-50/80" : "text-purple-700 bg-purple-50/80"
                )}>
                  {student.gender === "ikhwan" ? "Ikhwan" : "Akhwat"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 mt-3 sm:mt-0 pt-2.5 sm:pt-0 border-t sm:border-none border-border">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelegate(student)} 
              className="rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200/60 h-8 px-2.5 text-xs font-medium"
              title="Delegasikan Koordinator"
            >
              <UserCog size={14} className="sm:mr-1.5" />
              <span className="hidden sm:inline">Delegasi</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(student)}
              className="rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200/60 h-8 px-2.5 text-xs font-medium"
              title="Edit Data"
            >
              <Edit3 size={14} className="sm:mr-1.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(student.id)}
              className="rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 transition-all h-8 w-8"
              title="Hapus Siswa"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
