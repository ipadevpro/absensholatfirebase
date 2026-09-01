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
  const [mode, setMode] = useState<"table" | "paste">("table");
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
    setMode("table");
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl border border-border">
        <div className="p-5 pb-2 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Bulk Tambah Siswa</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tambahkan banyak siswa sekaligus dengan mengisi tabel atau menempel data langsung dari spreadsheet (Excel).
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mt-4">
            <Button 
              variant={mode === "table" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setMode("table")}
              className="rounded-lg h-8 text-xs font-medium active:scale-[0.97] touch-manipulation"
            >
              <TableIcon size={14} className="mr-1.5" /> Mode Tabel
            </Button>
            <Button 
              variant={mode === "paste" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setMode("paste")}
              className="rounded-lg h-8 text-xs font-medium active:scale-[0.97] touch-manipulation"
            >
              <ClipboardPaste size={14} className="mr-1.5" /> Tempel dari Excel
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20 flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {mode === "table" ? (
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <div className="overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="w-[40%] text-xs font-semibold text-foreground">Nama Lengkap</TableHead>
                      <TableHead className="w-[25%] text-xs font-semibold text-foreground">Kelas</TableHead>
                      <TableHead className="w-[25%] text-xs font-semibold text-foreground">Kategori</TableHead>
                      <TableHead className="w-[10%] text-center text-xs font-semibold text-foreground">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} className="border-border hover:bg-muted/30">
                        <TableCell className="p-2">
                          <Input
                            placeholder="Nama Siswa"
                            value={row.name}
                            onChange={(e) => updateRow(row.id, "name", e.target.value)}
                            className="h-8 text-xs rounded-lg border-input bg-background"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Select
                            value={row.classId}
                            onValueChange={(val) => updateRow(row.id, "classId", val)}
                          >
                            <SelectTrigger className="h-8 text-xs rounded-lg border-input bg-background">
                              <SelectValue placeholder="Pilih Kelas" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                              {AVAILABLE_CLASSES.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id} className="text-xs">
                                  {cls.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2">
                          <Select
                            value={row.gender}
                            onValueChange={(val) => updateRow(row.id, "gender", val as Gender)}
                          >
                            <SelectTrigger className="h-8 text-xs rounded-lg border-input bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                              <SelectItem value="ikhwan" className="text-xs">Ikhwan</SelectItem>
                              <SelectItem value="akhwat" className="text-xs">Akhwat</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 h-7 w-7 rounded-lg active:scale-[0.97] touch-manipulation"
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length === 1}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addRow}
                className="w-full rounded-none border-t border-border text-primary hover:bg-accent h-10 text-xs font-medium active:scale-[0.97] touch-manipulation"
              >
                <Plus size={14} className="mr-1.5" /> Tambah Baris Baru
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-amber-50/80 border border-amber-200/60 p-3.5 rounded-xl text-amber-800 text-xs">
                <p className="font-semibold mb-1">Panduan Format Tempel:</p>
                <ol className="list-decimal ml-4 space-y-0.5 opacity-90">
                  <li>Siapkan Excel dengan 3 kolom: <strong>Nama</strong>, <strong>Kelas</strong> (7a, 8b, dsb), <strong>Kategori</strong> (L/P atau Ikhwan/Akhwat).</li>
                  <li>Salin (Ctrl+C / Cmd+C) data tersebut dari Excel.</li>
                  <li>Tempel (Ctrl+V / Cmd+V) pada kotak di bawah.</li>
                  <li>Klik <strong>&quot;Proses Data Tempel&quot;</strong> untuk mengubahnya menjadi baris tabel.</li>
                </ol>
              </div>
              <Textarea 
                placeholder="Tempel data Excel di sini..."
                className="min-h-[220px] font-mono text-xs p-3 rounded-xl border-input bg-background"
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
              />
              <Button onClick={handlePasteProcess} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-xs font-medium rounded-lg active:scale-[0.97] touch-manipulation">
                <ClipboardPaste size={15} className="mr-1.5" /> Proses Data Tempel
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/40 border-t border-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground text-center sm:text-left">
            Total: <strong className="text-foreground">{rows.length}</strong> Siswa
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-9 sm:h-8 px-4 rounded-lg text-xs font-medium active:scale-[0.97] touch-manipulation w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || rows.length === 0 || (rows.length === 1 && !rows[0].name)} 
              className="h-9 sm:h-8 px-5 rounded-lg text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground active:scale-[0.97] touch-manipulation w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
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
