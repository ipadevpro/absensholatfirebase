"use client";

import { Student } from "@/types";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, 
  GraduationCap, 
  Trash2, 
  UserCog, 
  Edit3,
  SearchX
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onDelegate: (student: Student) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

export function StudentList({ 
  students, 
  onEdit, 
  onDelete, 
  onDelegate,
  selectedIds,
  onToggleSelect
}: StudentListProps) {
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-emerald-100">
        <div className="bg-emerald-50 p-6 rounded-full mb-4">
          <SearchX className="h-10 w-10 text-emerald-300" />
        </div>
        <h3 className="text-xl font-serif font-bold text-emerald-900">Siswa Tidak Ditemukan</h3>
        <p className="text-emerald-600/60 text-sm max-w-[250px] mt-1">Coba ubah kata kunci pencarian atau bersihkan filter yang aktif.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {students.map((student) => (
        <div
          key={student.id}
          className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white/80 backdrop-blur-xl border border-emerald-50 rounded-[2rem] transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-200"
        >
          {/* Student Info */}
          <div className="flex items-center gap-5">
            <Checkbox
              checked={selectedIds.includes(student.id)}
              onCheckedChange={() => onToggleSelect(student.id)}
              className="border-emerald-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded-md h-5 w-5"
            />
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner",
              student.gender === "ikhwan" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
            )}>
              <span className="font-serif font-bold text-xl uppercase">
                {student.name.charAt(0)}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-emerald-900 tracking-tight leading-tight group-hover:text-emerald-700 transition-colors">
                {student.name}
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className="inline-flex items-center text-xs font-semibold text-emerald-600/70">
                  <GraduationCap size={12} className="mr-1" />
                  Kelas {AVAILABLE_CLASSES.find(c => c.id === student.classId)?.name || student.classId}
                </span>
                <span className="w-1 h-1 rounded-full bg-emerald-100" />
                <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  {student.gender === "ikhwan" ? "Ikhwan" : "Akhwat"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-6 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-none border-emerald-50">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelegate(student)} 
              className="rounded-xl bg-blue-50/50 text-blue-600 hover:bg-blue-600 hover:text-white border border-transparent transition-all"
              title="Delegasikan Koordinator"
            >
              <UserCog size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">Delegasi</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(student)}
              className="rounded-xl bg-emerald-50/50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-transparent transition-all"
              title="Edit Data"
            >
              <Edit3 size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(student.id)}
              className="rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all h-9 w-9"
              title="Hapus"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
