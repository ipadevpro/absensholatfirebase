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
  UserPlus, 
  Users2, 
  Search, 
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
        <div className="bg-destructive/10 text-destructive p-8 rounded-xl border border-destructive/20 max-w-md">
          <h2 className="text-lg font-bold mb-2">Akses Terbatas</h2>
          <p className="text-sm">Maaf, halaman ini hanya dapat diakses oleh Admin (Guru).</p>
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
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Siswa</h1>
          <p className="text-sm text-muted-foreground mt-1">Pilih kelas di bawah untuk mengelola data siswa</p>
        </div>

        {[7, 8, 9].map((grade) => (
          <div key={grade} className="space-y-3">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Kelas {grade}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {classesByGrade[grade]?.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className="group p-4 bg-card border border-border rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center gap-2.5 shadow-sm"
                >
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg group-hover:scale-105 transition-transform">
                    <GraduationCap size={22} />
                  </div>
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => setSelectedClassId(null)}
            className="rounded-lg border border-border hover:bg-accent text-foreground mb-2 h-8 px-3 text-xs"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Kembali ke Daftar Kelas
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Siswa Kelas {activeClass?.name || selectedClassId.toUpperCase()}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola data siswa kelas {activeClass?.name}</p>
          </div>
          {!showForm && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkAdd(true)}
                className="rounded-lg border-border hover:bg-accent text-xs h-9"
              >
                <Users2 size={16} className="mr-1.5" />
                Bulk Tambah
              </Button>
              <Button 
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm text-xs h-9"
              >
                <UserPlus size={16} className="mr-1.5" />
                Tambah Siswa
              </Button>
            </div>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card p-3.5 rounded-xl border border-border shadow-sm">
          <div className="relative md:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-lg border-input bg-background focus-visible:ring-primary h-9 text-sm"
            />
          </div>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="rounded-lg border-input bg-background h-9 text-sm">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="ikhwan">Ikhwan</SelectItem>
              <SelectItem value="akhwat">Akhwat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || genderFilter !== "all") && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mr-1">Filter Aktif:</p>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
                &quot;{searchQuery}&quot;
                <X size={12} className="cursor-pointer" onClick={() => setSearchQuery("")} />
              </span>
            )}
            {genderFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200/60">
                {genderFilter === 'ikhwan' ? 'Ikhwan' : 'Akhwat'}
                <X size={12} className="cursor-pointer" onClick={() => setGenderFilter("all")} />
              </span>
            )}
            <button 
              onClick={resetFilters}
              className="text-xs text-destructive hover:underline font-medium ml-2"
            >
              Hapus Semua
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-200">
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

      <div className="space-y-4">
        {!isLoading && paginatedStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-3 bg-card rounded-xl border border-border shadow-sm">
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
                className="rounded-md h-4 w-4"
              />
              <label htmlFor="select-all-page" className="text-xs font-medium text-foreground cursor-pointer select-none">
                Pilih Semua di Halaman Ini
              </label>
            </div>
            {selectedStudentIds.length > 0 && (
              <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-none pt-2 sm:pt-0 border-border w-full sm:w-auto">
                <span className="text-xs font-semibold text-foreground">
                  {selectedStudentIds.length} siswa terpilih
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStudentIds([])}
                    className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-lg border border-border"
                  >
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setStudentIdsToDelete(selectedStudentIds)}
                    className="text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 size={13} />
                    Hapus Terpilih
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <StudentList
          students={paginatedStudents}
          loading={isLoading}
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
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-card rounded-xl border border-border shadow-sm">
            <p className="text-xs text-muted-foreground">
              Menampilkan <strong className="text-foreground">{paginatedStudents.length}</strong> dari <strong className="text-foreground">{filteredStudents.length}</strong> siswa
            </p>
            
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border-border h-8 w-8"
              >
                <ChevronLeft size={16} />
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
                        "h-8 w-8 rounded-lg text-xs font-semibold",
                        currentPage === pageNum 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "border-border text-muted-foreground hover:text-foreground"
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
                className="rounded-lg border-border h-8 w-8"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

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
        <AlertDialogContent className="rounded-xl border-border p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-destructive">Hapus Siswa?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
              Tindakan ini akan menghapus data siswa secara permanen dari sistem. Anda tidak dapat membatalkan tindakan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="rounded-lg border-border text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg px-6 text-xs">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!studentIdsToDelete} onOpenChange={(open) => !open && setStudentIdsToDelete(null)}>
        <AlertDialogContent className="rounded-xl border-border p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-destructive">Hapus Siswa Terpilih?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
              Tindakan ini akan menghapus <strong>{studentIdsToDelete?.length}</strong> data siswa terpilih secara permanen dari sistem. Anda tidak dapat membatalkan tindakan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="rounded-lg border-border text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg px-6 text-xs">
              Ya, Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
