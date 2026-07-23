"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, AlertCircle, ClipboardPaste, Table as TableIcon } from "lucide-react";
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
  defaultClassId?: string;
}

export function BulkStudentDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultClassId,
}: BulkStudentDialogProps) {
  const [mode, setRole] = useState<"table" | "paste">("table");
  const [pasteContent, setPasteContent] = useState("");
  const [rows, setRows] = useState<BulkStudentRow[]>([
    { id: Math.random().toString(), name: "", classId: defaultClassId || "", gender: "ikhwan" },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => {
    setRows([
      ...rows,
      { id: Math.random().toString(), name: "", classId: defaultClassId || "", gender: "ikhwan" },
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

  const handlePasteProcess = () => {
    if (!pasteContent.trim()) {
      toast.error("Silakan tempel data dari Excel terlebih dahulu");
      return;
    }

    const lines = pasteContent.trim().split("\n");
    const newRows: BulkStudentRow[] = lines.map(line => {
      // Split by tab (Excel default) or comma
      const parts = line.split(/\t|,/);
      const name = parts[0]?.trim() || "";
      const classInput = parts[1]?.trim().toLowerCase().replace("-", "") || "";
      const genderInput = parts[2]?.trim().toLowerCase() || "";

      // Try to match classId
      const classMatch = AVAILABLE_CLASSES.find(c => 
        c.id === classInput || c.name.toLowerCase().replace("-", "") === classInput
      );

      // Try to match gender
      let gender: Gender = "ikhwan";
      if (genderInput.includes("p") || genderInput.includes("akh") || genderInput.includes("fem")) {
        gender = "akhwat";
      }

      return {
        id: Math.random().toString(),
        name,
        classId: classMatch?.id || defaultClassId || "",
        gender
      };
    });

    setRows(newRows);
    setRole("table");
    setPasteContent("");
    toast.success(`Berhasil memproses ${newRows.length} baris. Silakan periksa kembali.`);
  };

  const handleSave = async () => {
    const invalidRows = rows.filter((row) => !row.name || !row.classId);
    if (invalidRows.length > 0) {
      const msg = "Mohon lengkapi nama dan kelas untuk semua baris.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Chunk processing to avoid overwhelming Firebase/Network if 350+
      const chunkSize = 25;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await Promise.all(chunk.map(row => 
          addStudent({
            name: row.name,
            classId: row.classId,
            gender: row.gender,
          })
        ));
      }
      
      onSuccess();
      onOpenChange(false);
      setRows([{ id: Math.random().toString(), name: "", classId: "", gender: "ikhwan" }]);
    } catch (err: any) {
      console.error("Bulk add error:", err);
      const msg = "Terjadi kesalahan saat menyimpan data.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">Bulk Tambah Siswa</DialogTitle>
            <DialogDescription>
              Tambahkan banyak siswa sekaligus. Anda bisa mengisi tabel atau langsung tempel dari Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mt-4 border-b">
            <Button 
              variant={mode === "table" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setRole("table")}
              className="rounded-none border-b-2 border-transparent data-[variant=default]:border-primary"
              data-variant={mode === "table" ? "default" : "ghost"}
            >
              <TableIcon size={16} className="mr-2" /> Mode Tabel
            </Button>
            <Button 
              variant={mode === "paste" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setRole("paste")}
              className="rounded-none border-b-2 border-transparent data-[variant=default]:border-primary"
              data-variant={mode === "paste" ? "default" : "ghost"}
            >
              <ClipboardPaste size={16} className="mr-2" /> Tempel dari Excel
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 pt-2">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          {mode === "table" ? (
            <div className="border rounded-xl overflow-hidden bg-white shadow-inner">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="w-[40%] font-bold">Nama Lengkap</TableHead>
                    <TableHead className="w-[25%] font-bold">Kelas</TableHead>
                    <TableHead className="w-[25%] font-bold">Jenis Kelamin</TableHead>
                    <TableHead className="w-[10%] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-emerald-50/30">
                      <TableCell>
                        <Input
                          placeholder="Nama Siswa"
                          value={row.name}
                          onChange={(e) => updateRow(row.id, "name", e.target.value)}
                          className="border-none bg-transparent focus-visible:ring-1"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.classId}
                          onValueChange={(val) => updateRow(row.id, "classId", val)}
                        >
                          <SelectTrigger className="border-none bg-transparent focus:ring-1">
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
                          onValueChange={(val) => updateRow(row.id, "gender", val as Gender)}
                        >
                          <SelectTrigger className="border-none bg-transparent focus:ring-1">
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
                          className="text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addRow}
                className="w-full rounded-none border-t text-emerald-600 hover:bg-emerald-50 h-12"
              >
                <Plus size={16} className="mr-2" /> Tambah Baris Baru
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm">
                <p className="font-bold mb-1 underline italic">Cara Penggunaan:</p>
                <ol className="list-decimal ml-4 space-y-1 opacity-90 font-medium">
                  <li>Siapkan Excel dengan 3 kolom: <strong>Nama</strong>, <strong>Kelas</strong> (7a, 8b, dsb), <strong>Gender</strong> (L/P atau Ikhwan/Akhwat).</li>
                  <li>Copy (Ctrl+C) data tersebut dari Excel.</li>
                  <li>Tempel (Ctrl+V) di kotak di bawah ini.</li>
                  <li>Klik tombol <strong>"Proses Data"</strong> untuk mengubahnya menjadi tabel.</li>
                </ol>
              </div>
              <Textarea 
                placeholder="Tempel data Excel di sini..."
                className="min-h-[300px] font-mono text-sm p-4 bg-gray-50 border-emerald-100"
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
              />
              <Button onClick={handlePasteProcess} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-bold">
                <ClipboardPaste size={20} className="mr-2" /> Proses Data Tempel
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 pt-2 bg-gray-50 border-t flex justify-between items-center">
          <p className="text-sm font-medium text-emerald-700">
            Total: <strong>{rows.length}</strong> Siswa siap disimpan
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="px-6 rounded-xl"
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving || rows.length === 0 || (rows.length === 1 && !rows[0].name)} className="px-8 bg-primary rounded-xl">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                `Simpan Semua (${rows.length})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
