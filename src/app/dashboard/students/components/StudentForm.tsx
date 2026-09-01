"use client";

import { useState } from "react";
import { Student, Gender } from "@/types";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentFormProps {
  student?: Student;
  defaultClassId?: string;
  onSubmit: (data: Omit<Student, "id" | "createdAt">) => void;
  onCancel: () => void;
}

export function StudentForm({ student, defaultClassId, onSubmit, onCancel }: StudentFormProps) {
  const [name, setName] = useState(student?.name || "");
  const [gender, setGender] = useState<Gender>(student?.gender || "ikhwan");
  const [classId, setClassId] = useState(student?.classId || defaultClassId || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gender || !classId) return;
    
    onSubmit({ name, gender, classId });
    setName("");
    setGender("ikhwan");
    setClassId("");
  };

  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="p-5 pb-3 border-b border-border">
        <CardTitle className="text-base font-semibold text-foreground">
          {student ? "Edit Data Siswa" : "Tambah Siswa Baru"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-foreground">Nama Siswa</Label>
            <Input
              id="name"
              placeholder="Nama Lengkap Siswa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border-input bg-background h-9 text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="classId" className="text-xs font-medium text-foreground">Kelas</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger id="classId" className="rounded-lg border-input bg-background h-9 text-sm">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {AVAILABLE_CLASSES.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender" className="text-xs font-medium text-foreground">Kategori (Gender)</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
              <SelectTrigger id="gender" className="rounded-lg border-input bg-background h-9 text-sm">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="ikhwan">Ikhwan</SelectItem>
                <SelectItem value="akhwat">Akhwat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="w-full sm:w-auto rounded-lg border-border h-9 px-4 text-xs font-medium active:scale-[0.97] touch-manipulation"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 text-xs font-medium active:scale-[0.97] touch-manipulation"
            >
              {student ? "Simpan Perubahan" : "Tambah Siswa"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
