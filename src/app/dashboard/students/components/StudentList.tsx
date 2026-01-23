"use client";

import { Student } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

export function StudentList({ students, onEdit, onDelete }: StudentListProps) {
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
                  {student.gender === "ikhwan" ? "Ikhwan" : "Akhwat"}
                </p>
              </div>
              <div className="flex gap-2">
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