"use client";

import { useState, useEffect } from "react";
import { Supervisor } from "@/types";
import { deleteSupervisor } from "@/lib/db/supervisors";
import { createSupervisorAccount } from "@/app/actions/supervisor";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Trash2, Plus, X, AlertCircle, Users } from "lucide-react";
import SupervisorForm from "./SupervisorForm";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SupervisorsListProps {
  initialSupervisors: Supervisor[];
  loading?: boolean;
}

export default function SupervisorsList({ initialSupervisors, loading = false }: SupervisorsListProps) {
  const [supervisors, setSupervisors] = useState<Supervisor[]>(initialSupervisors);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supervisorToDelete, setSupervisorToDelete] = useState<string | null>(null);

  useEffect(() => {
    setSupervisors(initialSupervisors);
  }, [initialSupervisors]);

  const handleAdd = async (data: Parameters<typeof SupervisorForm>[0]["onSubmit"] extends (data: infer T) => any ? T : never) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createSupervisorAccount(data);
      if (result.success && result.uid) {
        const newSup: Supervisor = {
          name: data.name,
          uid: result.uid,
          id: result.uid,
          classes: data.classes,
          createdAt: new Date()
        };
        setSupervisors([...supervisors, newSup]);
        setIsFormOpen(false);
        toast.success("Pembina berhasil ditambahkan");
        return true;
      } else {
        const msg = result.error || "Gagal membuat akun pembina";
        setError(msg);
        toast.error(msg);
        return false;
      }
    } catch (err) {
      console.error("Failed to add supervisor", err);
      const msg = "Gagal menambahkan pembina. Silakan coba lagi.";
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!supervisorToDelete) return;
    setError(null);
    try {
      await deleteSupervisor(supervisorToDelete);
      setSupervisors(supervisors.filter((s) => s.id !== supervisorToDelete));
      toast.success("Pembina berhasil dihapus");
    } catch (err) {
      console.error("Failed to delete supervisor", err);
      const msg = "Gagal menghapus pembina. Silakan coba lagi.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSupervisorToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && !isFormOpen && (
        <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-end items-center">
        <Button 
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setError(null);
          }} 
          variant={isFormOpen ? "outline" : "default"}
          className={cn(
            "rounded-lg text-xs h-9 px-4 font-medium touch-manipulation active:scale-[0.96] transition-transform",
            !isFormOpen && "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          )}
        >
          {isFormOpen ? (
            <>
              <X className="mr-1.5 h-4 w-4" /> Batal
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-4 w-4" /> Tambah Pembina
            </>
          )}
        </Button>
      </div>

      {isFormOpen && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-200">
          <SupervisorForm onSubmit={handleAdd} isLoading={isLoading} error={error} onCancel={() => setIsFormOpen(false)} />
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[520px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-foreground">Nama</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">Kelas Binaan</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">UID</TableHead>
                <TableHead className="w-[80px] text-right text-xs font-semibold text-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index} className="border-border">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : supervisors.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="bg-muted p-3 rounded-full text-muted-foreground">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-xs">Belum ada data pembina.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                supervisors.map((supervisor) => (
                  <TableRow key={supervisor.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-semibold text-xs text-foreground">{supervisor.name}</TableCell>
                    <TableCell className="max-w-[280px]">
                      {supervisor.classes && supervisor.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {supervisor.classes.map((cId) => (
                            <span 
                              key={cId}
                              className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60"
                            >
                              {AVAILABLE_CLASSES.find((c) => c.id === cId)?.name || cId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Belum ada kelas</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{supervisor.uid}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSupervisorToDelete(supervisor.id)}
                        className="rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 transition-transform active:scale-[0.96] touch-manipulation h-8 w-8"
                        title="Hapus Pembina"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!supervisorToDelete} onOpenChange={(open) => !open && setSupervisorToDelete(null)}>
        <AlertDialogContent className="rounded-xl border-border p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-destructive">Hapus Pembina?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
              Apakah Anda yakin ingin menghapus pembina ini? Tindakan ini akan menghapus akses login pembina dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="rounded-lg border-border text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg px-6 text-xs">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
