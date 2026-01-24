"use client";

import { useState } from "react";
import { Gender } from "@/types";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { addStudent } from "@/lib/db/students";

interface BulkStudentRow {
  id: string;
  name: string;
  classId: string;
  gender: Gender;
}

interface BulkStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkStudentDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkStudentDialogProps) {
  const [rows, setRows] = useState<BulkStudentRow[]>([
    { id: Math.random().toString(), name: "", classId: "", gender: "ikhwan" },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => {
    setRows([
      ...rows,
      { id: Math.random().toString(), name: "", classId: "", gender: "ikhwan" },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: keyof BulkStudentRow, value: string) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = async () => {
    // Validation
    const invalidRows = rows.filter((row) => !row.name || !row.classId);
    if (invalidRows.length > 0) {
      setError("Mohon lengkapi nama dan kelas untuk semua baris.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Process all rows
      const promises = rows.map((row) =>
        addStudent({
          name: row.name,
          classId: row.classId,
          gender: row.gender,
        })
      );

      await Promise.all(promises);
      
      onSuccess();
      onOpenChange(false);
      // Reset rows
      setRows([{ id: Math.random().toString(), name: "", classId: "", gender: "ikhwan" }]);
    } catch (err: any) {
      console.error("Bulk add error:", err);
      setError("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Tambah Siswa</DialogTitle>
          <DialogDescription>
            Tambahkan banyak siswa sekaligus ke dalam sistem.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-[40%]">Nama Lengkap</TableHead>
                <TableHead className="w-[25%]">Kelas</TableHead>
                <TableHead className="w-[25%]">Jenis Kelamin</TableHead>
                <TableHead className="w-[10%] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Input
                      placeholder="Nama Siswa"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, "name", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.classId}
                      onValueChange={(val) => updateRow(row.id, "classId", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_CLASSES.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.gender}
                      onValueChange={(val) => updateRow(row.id, "gender", val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ikhwan">Ikhwan</SelectItem>
                        <SelectItem value="akhwat">Akhwat</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            className="w-full border-dashed"
          >
            <Plus size={16} className="mr-2" />
            Tambah Baris
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan ({rows.length})...
              </>
            ) : (
              `Simpan ${rows.length} Siswa`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
