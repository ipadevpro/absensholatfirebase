"use client";

import { useState } from "react";
import { Student } from "@/types";
import { bulkUpdateStudentNIS } from "@/lib/db/students";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface MatchedItem {
  excelName: string;
  nis: string;
  student: Student | null;
  status: "matched" | "not_found";
}

interface BulkNISDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[]; // All students in current view / class
  onSuccess: () => void;
}

export function BulkNISDialog({
  open,
  onOpenChange,
  students,
  onSuccess,
}: BulkNISDialogProps) {
  const [pasteContent, setPasteContent] = useState("");
  const [previewList, setPreviewList] = useState<MatchedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  };

  const handleProcessPaste = () => {
    if (!pasteContent.trim()) {
      toast.error("Tempel data NIS dari Excel terlebih dahulu");
      return;
    }

    setIsProcessing(true);
    try {
      const lines = pasteContent
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const items: MatchedItem[] = [];

      lines.forEach((line) => {
        // Split by tab (Excel default) or semicolon/comma
        const parts = line.split(/\t|;|,/).map((p) => p.trim());
        if (parts.length < 2) return;

        let nis = "";
        let name = "";

        // Auto-detect which column is NIS (numeric or starts with digits) vs Name
        const isPart0Nis = /^[0-9A-Za-z_-]{3,20}$/.test(parts[0]) && /\d/.test(parts[0]);
        const isPart1Nis = /^[0-9A-Za-z_-]{3,20}$/.test(parts[1]) && /\d/.test(parts[1]);

        if (isPart0Nis && !isPart1Nis) {
          nis = parts[0];
          name = parts[1];
        } else if (isPart1Nis && !isPart0Nis) {
          name = parts[0];
          nis = parts[1];
        } else {
          // Default: column 1 = NIS, column 2 = Name
          nis = parts[0];
          name = parts[1];
        }

        const normExcelName = normalizeName(name);

        // Find match in student list
        const matchedStudent = students.find((s) => {
          const normStudName = normalizeName(s.name);
          return (
            normStudName === normExcelName ||
            normStudName.includes(normExcelName) ||
            normExcelName.includes(normStudName)
          );
        });

        items.push({
          excelName: name,
          nis,
          student: matchedStudent || null,
          status: matchedStudent ? "matched" : "not_found",
        });
      });

      if (items.length === 0) {
        toast.error("Format data tidak sesuai. Pastikan minimal 2 kolom (NIS dan Nama).");
        return;
      }

      setPreviewList(items);
      const matchedCount = items.filter((i) => i.status === "matched").length;
      toast.success(
        `Berhasil memetakan ${items.length} baris: ${matchedCount} siswa cocok dengan database.`
      );
    } catch (err: any) {
      console.error("Error parsing NIS data:", err);
      toast.error("Gagal memproses data: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyUpdates = async () => {
    const validMatches = previewList.filter(
      (item) => item.status === "matched" && item.student
    );

    if (validMatches.length === 0) {
      toast.error("Tidak ada siswa yang cocok untuk diperbarui");
      return;
    }

    setIsSaving(true);
    try {
      const updates = validMatches.map((item) => ({
        id: item.student!.id,
        nis: item.nis,
      }));

      const count = await bulkUpdateStudentNIS(updates);

      toast.success(`Berhasil memperbarui NIS untuk ${count} siswa!`);
      onSuccess();
      onOpenChange(false);
      setPasteContent("");
      setPreviewList([]);
    } catch (err: any) {
      console.error("Error updating NIS:", err);
      toast.error("Gagal menyimpan NIS: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const matchedCount = previewList.filter((i) => i.status === "matched").length;
  const notFoundCount = previewList.filter((i) => i.status === "not_found").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl border border-border">
        <DialogHeader className="p-5 pb-3 border-b border-border">
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Bulk Import / Update NIS Siswa
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Perbarui nomor NIS siswa sekaligus dengan menempelkan data dari tabel Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="nis-paste-textarea" className="text-xs font-semibold text-foreground">
                Tempel Kolom dari Excel (NIS & Nama Siswa):
              </label>
              <span className="text-[11px] text-muted-foreground">
                Format: <code>NIS [Tab] Nama</code> atau <code>Nama [Tab] NIS</code>
              </span>
            </div>
            <Textarea
              id="nis-paste-textarea"
              placeholder={`Contoh copy-paste dari Excel:\n212207001\tAhmad Fauzi\n212207002\tBudi Santoso\n212207003\tCici Paramida`}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              className="h-32 text-xs font-mono rounded-lg border-input bg-background"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleProcessPaste}
                disabled={isProcessing || !pasteContent.trim()}
                className="rounded-lg h-8 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                Cocokkan Data
              </Button>
            </div>
          </div>

          {/* Preview Table */}
          {previewList.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Hasil Pencocokan ({previewList.length} baris)
                </span>
                <div className="flex gap-2">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[11px] border border-emerald-200">
                    {matchedCount} Cocok
                  </span>
                  {notFoundCount > 0 && (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium text-[11px] border border-amber-200">
                      {notFoundCount} Tidak Ditemukan
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto text-xs">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/60 sticky top-0 border-b border-border">
                    <tr className="text-left font-medium text-muted-foreground">
                      <th className="p-2 w-8">No</th>
                      <th className="p-2">NIS Baru</th>
                      <th className="p-2">Nama di Excel</th>
                      <th className="p-2">Nama di Database</th>
                      <th className="p-2 w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewList.map((item, idx) => (
                      <tr
                        key={idx}
                        className={
                          item.status === "matched"
                            ? "bg-emerald-50/20 hover:bg-emerald-50/40"
                            : "bg-amber-50/20 hover:bg-amber-50/40 opacity-75"
                        }
                      >
                        <td className="p-2 text-center text-muted-foreground font-mono">
                          {idx + 1}
                        </td>
                        <td className="p-2 font-mono font-semibold text-foreground">
                          {item.nis}
                        </td>
                        <td className="p-2 text-foreground truncate max-w-[130px]">
                          {item.excelName}
                        </td>
                        <td className="p-2 font-medium truncate max-w-[150px]">
                          {item.student ? (
                            <span className="text-emerald-900 font-semibold">
                              {item.student.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          {item.status === "matched" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                              <CheckCircle2 size={12} />
                              Cocok
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                              <AlertCircle size={12} />
                              Lewati
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="rounded-lg text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApplyUpdates}
            disabled={isSaving || matchedCount === 0}
            className="rounded-lg text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Menyimpan...
              </>
            ) : (
              `Simpan ${matchedCount} NIS ke Database`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
