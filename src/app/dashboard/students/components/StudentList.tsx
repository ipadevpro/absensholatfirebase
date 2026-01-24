"use client";

import { Student } from "@/types";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onDelegate: (student: Student) => void;
}

export function StudentList({ students, onEdit, onDelete, onDelegate }: StudentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Siswa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-gray-500">
                  {AVAILABLE_CLASSES.find(c => c.id === student.classId)?.name || student.classId} • {student.gender === "ikhwan" ? "Ikhwan" : "Akhwat"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onDelegate(student)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">
                  Delegasi
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(student)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(student.id)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              Belum ada siswa di kelas ini
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}