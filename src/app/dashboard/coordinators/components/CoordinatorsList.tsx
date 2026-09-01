"use client";

import { useState, useEffect } from "react";
import { Coordinator } from "@/types";
import { deleteCoordinator } from "@/lib/db/coordinators";
import { createCoordinatorAccount } from "@/app/actions/coordinator";
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
import { Trash2, Plus, X, AlertCircle, UserCog } from "lucide-react";
import CoordinatorForm from "./CoordinatorForm";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CoordinatorsListProps {
  initialCoordinators: Coordinator[];
  loading?: boolean;
}

export default function CoordinatorsList({ initialCoordinators, loading = false }: CoordinatorsListProps) {
  const [coordinators, setCoordinators] = useState<Coordinator[]>(initialCoordinators);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinatorToDelete, setCoordinatorToDelete] = useState<string | null>(null);

  useEffect(() => {
    setCoordinators(initialCoordinators);
  }, [initialCoordinators]);

  const handleAdd = async (data: Parameters<typeof CoordinatorForm>[0]["onSubmit"] extends (data: infer T) => any ? T : never) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createCoordinatorAccount(data);
      if (result.success && result.uid) {
        const newCoord: Coordinator = {
          name: data.name,
          uid: result.uid,
          classId: data.classId,
          gender: data.gender,
          id: result.uid,
          createdAt: new Date()
        };
        setCoordinators([...coordinators, newCoord]);
        setIsFormOpen(false);
        toast.success("Koordinator berhasil ditambahkan");
        return true;
      } else {
        const msg = result.error || "Gagal membuat akun koordinator";
        setError(msg);
        toast.error(msg);
        return false;
      }
    } catch (err: any) {
      console.error("Failed to add coordinator", err);
      const msg = "Gagal membuat akun koordinator. Silakan coba lagi.";
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!coordinatorToDelete) return;
    setError(null);
    try {
      await deleteCoordinator(coordinatorToDelete);
      setCoordinators(coordinators.filter((c) => c.id !== coordinatorToDelete));
      toast.success("Koordinator berhasil dihapus");
    } catch (error) {
      console.error("Failed to delete coordinator", error);
      const msg = "Gagal menghapus koordinator. Silakan coba lagi.";
      setError(msg);
      toast.error(msg);
    } finally {
      setCoordinatorToDelete(null);
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
              <Plus className="mr-1.5 h-4 w-4" /> Tambah Koordinator
            </>
          )}
        </Button>
      </div>

      {isFormOpen && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-200">
          <CoordinatorForm onSubmit={handleAdd} isLoading={isLoading} error={error} onCancel={() => setIsFormOpen(false)} />
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[500px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-foreground">Nama</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">Kategori</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">Kelas</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">UID</TableHead>
                <TableHead className="w-[80px] text-right text-xs font-semibold text-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index} className="border-border">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : coordinators.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="bg-muted p-3 rounded-full text-muted-foreground">
                        <UserCog className="h-6 w-6" />
                      </div>
                      <p className="text-xs">Belum ada koordinator terdaftar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                coordinators.map((coordinator) => (
                  <TableRow key={coordinator.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-semibold text-xs text-foreground">{coordinator.name}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md",
                        coordinator.gender === "ikhwan" 
                          ? "text-blue-700 bg-blue-50 border border-blue-200/60" 
                          : "text-purple-700 bg-purple-50 border border-purple-200/60"
                      )}>
                        {coordinator.gender === "ikhwan" ? "Ikhwan" : "Akhwat"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      Kelas {AVAILABLE_CLASSES.find(c => c.id === coordinator.classId)?.name || coordinator.classId}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{coordinator.uid}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCoordinatorToDelete(coordinator.id)}
                        className="rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 transition-transform active:scale-[0.96] touch-manipulation h-8 w-8"
                        title="Hapus Koordinator"
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

      <AlertDialog open={!!coordinatorToDelete} onOpenChange={(open) => !open && setCoordinatorToDelete(null)}>
        <AlertDialogContent className="rounded-xl border-border p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-destructive">Hapus Koordinator?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
              Apakah Anda yakin ingin menghapus koordinator ini? Tindakan ini akan menghapus akses login koordinator dari sistem.
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
