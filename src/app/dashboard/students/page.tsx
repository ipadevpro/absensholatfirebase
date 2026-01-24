"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Student } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { getAllStudents, addStudent, updateStudent, deleteStudent } from "@/lib/db/students";
import { StudentList } from "./components/StudentList";
import { StudentForm } from "./components/StudentForm";
import { DelegationDialog } from "./components/DelegationDialog";
import { BulkStudentDialog } from "./components/BulkStudentDialog";
import { Button } from "@/components/ui/button";
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
import { Loader2, UserPlus, Users2 } from "lucide-react";

export default function StudentsPage() {
  const { role, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [delegatingStudent, setDelegatingStudent] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelegation, setShowDelegation] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (role === "admin") {
      loadStudents();
    }
  }, [role]);

  const loadStudents = async () => {
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (error: any) {
      toast.error("Gagal memuat data siswa: " + error.message);
    }
  };

  if (authLoading) return null;

  if (role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center text-center p-12">
        <div className="bg-red-50 text-red-600 p-8 rounded-xl border border-red-100 max-w-md">
          <h2 className="text-xl font-bold mb-2">Akses Terbatas</h2>
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

  const handleDelete = async (id: string) => {
    setStudentToDelete(id);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete);
      loadStudents();
      toast.success("Siswa berhasil dihapus");
    } catch (error: any) {
      toast.error("Gagal menghapus siswa: " + error.message);
    } finally {
      setStudentToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Manajemen Siswa</h1>
        {!showForm && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBulkAdd(true)}>
              <Users2 size={18} className="mr-2" />
              Bulk Tambah
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <UserPlus size={18} className="mr-2" />
              Tambah Siswa
            </Button>
          </div>
        )}
      </div>

      {showForm && (
        <StudentForm
          student={editingStudent || undefined}
          onSubmit={editingStudent ? handleUpdate : handleAdd}
          onCancel={() => {
            setShowForm(false);
            setEditingStudent(null);
          }}
        />
      )}

      <StudentList
        students={students}
        onEdit={(student) => {
          setEditingStudent(student);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onDelegate={(student) => {
          setDelegatingStudent(student);
          setShowDelegation(true);
        }}
      />

      <DelegationDialog
        student={delegatingStudent}
        open={showDelegation}
        onOpenChange={setShowDelegation}
        onSuccess={() => {
          toast.success("Akun koordinator berhasil dibuat!");
          loadStudents();
        }}
      />

      <BulkStudentDialog
        open={showBulkAdd}
        onOpenChange={setShowBulkAdd}
        onSuccess={() => {
          toast.success("Berhasil menambahkan banyak siswa!");
          loadStudents();
        }}
      />

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus siswa ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
