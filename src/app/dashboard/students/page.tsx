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
import { Loader2, UserPlus, Users2 } from "lucide-react";

export default function StudentsPage() {
  const { role, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [delegatingStudent, setDelegatingStudent] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelegation, setShowDelegation] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  useEffect(() => {
    if (role === "admin") {
      loadStudents();
    }
  }, [role]);

  const loadStudents = async () => {
    const data = await getAllStudents();
    setStudents(data);
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
    await addStudent(data);
    setShowForm(false);
    loadStudents();
    toast.success("Siswa berhasil ditambahkan");
  };

  const handleUpdate = async (data: Omit<Student, "id" | "createdAt">) => {
    if (editingStudent) {
      await updateStudent(editingStudent.id, data);
      setEditingStudent(null);
      setShowForm(false);
      loadStudents();
      toast.success("Siswa berhasil diperbarui");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus siswa ini?")) {
      await deleteStudent(id);
      loadStudents();
      toast.success("Siswa berhasil dihapus");
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
    </div>
  );
}
