"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Student } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentsByClass, addStudent, updateStudent, deleteStudent, deleteStudents } from "@/lib/db/students";
import { StudentList } from "./components/StudentList";
import { StudentForm } from "./components/StudentForm";
import { DelegationDialog } from "./components/DelegationDialog";
import { BulkStudentDialog } from "./components/BulkStudentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  UserPlus, 
  Users2, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  X,
  Trash2,
  GraduationCap,
  ArrowLeft
} from "lucide-react";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export default function StudentsPage() {
  const { role, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [delegatingStudent, setDelegatingStudent] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelegation, setShowDelegation] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentIdsToDelete, setStudentIdsToDelete] = useState<string[] | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (role === "admin" && selectedClassId) {
      loadStudents();
    }
  }, [role, selectedClassId]);

  const loadStudents = async () => {
    if (!selectedClassId) return;
    setIsLoading(true);
    try {
      const data = await getStudentsByClass(selectedClassId);
      setStudents(data);
    } catch (error: any) {
      toast.error("Gagal memuat data siswa: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered and Paginated Data
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = !selectedClassId || s.classId === selectedClassId;
      const matchesGender = genderFilter === "all" || s.gender === genderFilter;
      return matchesSearch && matchesClass && matchesGender;
    });
  }, [students, searchQuery, selectedClassId, genderFilter]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const classesByGrade = useMemo(() => {
    const groups: Record<number, typeof AVAILABLE_CLASSES> = { 7: [], 8: [], 9: [] };
    AVAILABLE_CLASSES.forEach(cls => {
      const grade = parseInt(cls.id.charAt(0));
      if (groups[grade]) {
        groups[grade].push(cls);
      }
    });
    return groups;
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedStudentIds([]);
  }, [searchQuery, selectedClassId, genderFilter]);

  // Reset selection when page changes
  useEffect(() => {
    setSelectedStudentIds([]);
  }, [currentPage]);

  if (authLoading) return null;

  if (role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center text-center p-12">
        <div className="bg-red-50 text-red-600 p-8 rounded-xl border border-red-100 max-w-md">
          <h2 className="text-xl font-bold mb-2 font-serif">Akses Terbatas</h2>
          <p>Maaf, halaman ini hanya dapat diakses oleh Admin (Guru).</p>
        </div>
      </div>
    );
  }

  const handleAdd = async (data: Omit<Student, "id" | "createdAt">) => {
    try {
      await addStudent(data);
      setShowForm(false);
      loadStudents();
      toast.success("Siswa berhasil ditambahkan");
    } catch (error: any) {
      toast.error("Gagal menambahkan siswa: " + error.message);
    }
  };

  const handleUpdate = async (data: Omit<Student, "id" | "createdAt">) => {
    if (editingStudent) {
      try {
        await updateStudent(editingStudent.id, data);
        setEditingStudent(null);
        setShowForm(false);
        loadStudents();
        toast.success("Siswa berhasil diperbarui");
      } catch (error: any) {
        toast.error("Gagal memperbarui siswa: " + error.message);
      }
    }
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete);
      // Remove deleted student from selectedStudentIds if present
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentToDelete));
      loadStudents();
      toast.success("Siswa berhasil dihapus");
    } catch (error: any) {
      toast.error("Gagal menghapus siswa: " + error.message);
    } finally {
      setStudentToDelete(null);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    if (!studentIdsToDelete || studentIdsToDelete.length === 0) return;
    try {
      await deleteStudents(studentIdsToDelete);
      setSelectedStudentIds([]);
      loadStudents();
      toast.success(`${studentIdsToDelete.length} siswa berhasil dihapus`);
    } catch (error: any) {
      toast.error("Gagal menghapus siswa: " + error.message);
    } finally {
      setStudentIdsToDelete(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setGenderFilter("all");
  };

  if (selectedClassId === null) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-20 md:pb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-900 tracking-tight">Manajemen Siswa</h1>
          <p className="text-sm text-muted-foreground mt-1">Pilih kelas di bawah untuk mengelola data siswa</p>
        </div>

        {[7, 8, 9].map((grade) => (
          <div key={grade} className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-emerald-800 border-b border-emerald-100 pb-2">
              Kelas {grade}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {classesByGrade[grade]?.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className="group p-6 bg-white/80 backdrop-blur-sm border border-emerald-50 rounded-[2rem] hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-200 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center gap-3 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform shadow-inner">
                    <GraduationCap size={24} />
                  </div>
                  <span className="font-bold text-lg text-emerald-900 group-hover:text-emerald-700 transition-colors">
                    Kelas {cls.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activeClass = AVAILABLE_CLASSES.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => setSelectedClassId(null)}
            className="rounded-xl border border-emerald-100 hover:bg-emerald-50 text-emerald-700 mb-2 h-9 px-3"
          >
            <ArrowLeft size={16} className="mr-2" />
            Kembali ke Daftar Kelas
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-emerald-900 tracking-tight">
              Siswa Kelas {activeClass?.name || selectedClassId.toUpperCase()}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola data siswa kelas {activeClass?.name}</p>
          </div>
          {!showForm && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkAdd(true)}
                className="rounded-xl border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Users2 size={18} className="mr-2" />
                Bulk Tambah
              </Button>
              <Button 
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
              >
                <UserPlus size={18} className="mr-2" />
                Tambah Siswa
              </Button>
            </div>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-emerald-50 shadow-sm">
          <div className="relative md:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600/40" />
            <Input
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-2xl bg-white border-emerald-50 focus-visible:ring-emerald-500"
            />
          </div>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="rounded-2xl border-emerald-50 bg-white">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-emerald-50">
              <SelectItem value="all">Semua Gender</SelectItem>
              <SelectItem value="ikhwan">Ikhwan</SelectItem>
              <SelectItem value="akhwat">Akhwat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || genderFilter !== "all") && (
          <div className="flex flex-wrap items-center gap-2 px-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mr-2">Filter Aktif:</p>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                "{searchQuery}"
                <X size={12} className="cursor-pointer" onClick={() => setSearchQuery("")} />
              </span>
            )}
            {genderFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
                {genderFilter === 'ikhwan' ? 'Ikhwan' : 'Akhwat'}
                <X size={12} className="cursor-pointer" onClick={() => setGenderFilter("all")} />
              </span>
            )}
            <button 
              onClick={resetFilters}
              className="text-xs text-red-500 hover:underline font-medium ml-2"
            >
              Hapus Semua
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="staggered-reveal">
          <StudentForm
            student={editingStudent || undefined}
            defaultClassId={selectedClassId || undefined}
            onSubmit={editingStudent ? handleUpdate : handleAdd}
            onCancel={() => {
              setShowForm(false);
              setEditingStudent(null);
            }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-dashed">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600/20" />
          <p className="text-sm font-medium text-emerald-600/40 animate-pulse">Memuat Data Siswa...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-50 shadow-sm">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const pageIds = paginatedStudents.map(s => s.id);
                      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pageIds])));
                    } else {
                      const pageIds = paginatedStudents.map(s => s.id);
                      setSelectedStudentIds(prev => prev.filter(id => !pageIds.includes(id)));
                    }
                  }}
                  id="select-all-page"
                  className="border-emerald-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded-md h-5 w-5"
                />
                <label htmlFor="select-all-page" className="text-sm font-medium text-emerald-900 cursor-pointer select-none">
                  Pilih Semua di Halaman Ini
                </label>
              </div>
              {selectedStudentIds.length > 0 && (
                <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-none pt-3 sm:pt-0 border-emerald-50 w-full sm:w-auto">
                  <span className="text-sm font-semibold text-emerald-800">
                    {selectedStudentIds.length} siswa terpilih
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudentIds([])}
                      className="text-xs text-gray-500 hover:text-emerald-900 h-9 px-3 rounded-xl border border-emerald-100 hover:bg-emerald-50"
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setStudentIdsToDelete(selectedStudentIds)}
                      className="bg-red-600 hover:bg-red-700 text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-200"
                    >
                      <Trash2 size={14} />
                      Hapus Terpilih
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <StudentList
            students={paginatedStudents}
            onEdit={(student) => {
              setEditingStudent(student);
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDelete={(id) => setStudentToDelete(id)}
            onDelegate={(student) => {
              setDelegatingStudent(student);
              setShowDelegation(true);
            }}
            selectedIds={selectedStudentIds}
            onToggleSelect={handleToggleSelect}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-6 bg-white/60 backdrop-blur-md rounded-3xl border border-emerald-50 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Menampilkan <strong>{paginatedStudents.length}</strong> dari <strong>{filteredStudents.length}</strong> siswa
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-emerald-100 h-10 w-10"
                >
                  <ChevronLeft size={18} />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "h-10 w-10 rounded-xl font-bold",
                          currentPage === pageNum 
                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100" 
                            : "border-emerald-50 text-gray-500 hover:bg-emerald-50"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-emerald-100 h-10 w-10"
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <DelegationDialog
        student={delegatingStudent}
        open={showDelegation}
        onOpenChange={setShowDelegation}
        onSuccess={() => {
          loadStudents();
        }}
      />

      <BulkStudentDialog
        open={showBulkAdd}
        onOpenChange={setShowBulkAdd}
        onSuccess={() => {
          loadStudents();
        }}
        defaultClassId={selectedClassId || undefined}
      />

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-emerald-50 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-serif font-bold text-red-900">Hapus Siswa?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 pt-2">
              Tindakan ini akan menghapus data siswa secara permanen dari sistem. Anda tidak dapat membatalkan tindakan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl border-emerald-100">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl px-8">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!studentIdsToDelete} onOpenChange={(open) => !open && setStudentIdsToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-emerald-50 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-serif font-bold text-red-900">Hapus Siswa Terpilih?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 pt-2">
              Tindakan ini akan menghapus <strong>{studentIdsToDelete?.length}</strong> data siswa terpilih secara permanen dari sistem. Anda tidak dapat membatalkan tindakan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl border-emerald-100">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700 rounded-xl px-8">
              Ya, Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
