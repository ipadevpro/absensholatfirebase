"use client";

import { useState, useEffect } from "react";
import { Student } from "@/types";
import { getStudentsByClass, addStudent, updateStudent, deleteStudent } from "@/lib/db/students";
import { StudentList } from "./components/StudentList";
import { StudentForm } from "./components/StudentForm";
import { Button } from "@/components/ui/button";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const classId = "default-class";

  useEffect(() => {
    loadStudents();
  }, [classId]);

  const loadStudents = async () => {
    const data = await getStudentsByClass(classId);
    setStudents(data);
  };

  const handleAdd = async (data: Omit<Student, "id" | "createdAt">) => {
    await addStudent({ ...data, classId });
    setShowForm(false);
    loadStudents();
  };

  const handleUpdate = async (data: Omit<Student, "id" | "createdAt">) => {
    if (editingStudent) {
      await updateStudent(editingStudent.id, data);
      setEditingStudent(null);
      setShowForm(false);
      loadStudents();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus siswa ini?")) {
      await deleteStudent(id);
      loadStudents();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manajemen Siswa</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Tambah Siswa</Button>
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
      />
    </div>
  );
}