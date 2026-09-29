"use client";

import { useState, useEffect } from "react";
import { Supervisor } from "@/types";
import { deleteSupervisor } from "@/lib/db/supervisors";
import { createSupervisorAccount, resetSupervisorPassword } from "@/app/actions/supervisor";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Trash2, 
  Plus, 
  X, 
  AlertCircle, 
  Users, 
  Printer, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Sparkles,
  Loader2 
} from "lucide-react";
import SupervisorForm from "./SupervisorForm";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

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

  // Password reset state
  const [supervisorToReset, setSupervisorToReset] = useState<Supervisor | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSupervisors(initialSupervisors);
  }, [initialSupervisors]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerateRandomPassword = () => {
    const randomDigits = Math.floor(100 + Math.random() * 900);
    setNewPassword(`pembina${randomDigits}`);
  };

  const handleAdd = async (data: Parameters<typeof SupervisorForm>[0]["onSubmit"] extends (data: infer T) => any ? T : never) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createSupervisorAccount(data);
      if (result.success && result.uid) {
        const newSup: Supervisor = {
          name: data.name,
          email: data.email,
          initialPassword: data.password,
          uid: result.uid,
          id: result.uid,
          classes: data.classes,
          createdAt: new Date(),
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

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorToReset || !newPassword) return;

    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetSupervisorPassword(supervisorToReset.uid, newPassword);
      if (res.success) {
        setSupervisors(prev =>
          prev.map(s => s.id === supervisorToReset.id ? { ...s, initialPassword: newPassword } : s)
        );
        toast.success(`Password untuk ${supervisorToReset.name} berhasil diubah!`);
        setSupervisorToReset(null);
        setNewPassword("");
      } else {
        toast.error(res.error || "Gagal mengubah password");
      }
    } catch (err: any) {
      console.error("Error resetting password:", err);
      toast.error("Terjadi kesalahan saat mengubah password");
    } finally {
      setIsResetting(false);
    }
  };

  const handlePrintPdf = () => {
    if (supervisors.length === 0) {
      toast.info("Tidak ada data pembina untuk dicetak");
      return;
    }
    window.print();
  };

  return (
    <>
      {/* 1. SCREEN VIEW (Hidden during print) */}
      <div className="space-y-4 print:hidden">
        {error && !isFormOpen && (
          <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-2">
          <Button
            onClick={handlePrintPdf}
            variant="outline"
            disabled={loading || supervisors.length === 0}
            className="rounded-lg text-xs h-9 px-3.5 font-medium border-border active:scale-[0.96] transition-transform"
          >
            <Printer className="mr-1.5 h-4 w-4 text-muted-foreground" />
            Cetak Akun (PDF)
          </Button>

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
            <Table className="min-w-[650px]">
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-foreground">Nama</TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">Password</TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">Kelas Binaan</TableHead>
                  <TableHead className="w-[110px] text-right text-xs font-semibold text-foreground">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index} className="border-border">
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : supervisors.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="bg-muted p-3 rounded-full text-muted-foreground">
                          <Users className="h-6 w-6" />
                        </div>
                        <p className="text-xs">Belum ada data pembina.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  supervisors.map((supervisor) => {
                    const isVisible = visiblePasswords[supervisor.id];
                    return (
                      <TableRow key={supervisor.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-semibold text-xs text-foreground">
                          {supervisor.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {supervisor.email || "-"}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {supervisor.initialPassword ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">
                                {isVisible ? supervisor.initialPassword : "••••••••"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePasswordVisibility(supervisor.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                title={isVisible ? "Sembunyikan" : "Tampilkan"}
                              >
                                {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/70 italic text-[11px]">
                              (Belum di-reset)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[240px]">
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSupervisorToReset(supervisor);
                                setNewPassword("");
                              }}
                              className="rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-white border border-amber-500/20 transition-transform active:scale-[0.96] touch-manipulation h-8 w-8"
                              title="Reset Password"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSupervisorToDelete(supervisor.id)}
                              className="rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 transition-transform active:scale-[0.96] touch-manipulation h-8 w-8"
                              title="Hapus Pembina"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Delete Confirmation Alert Dialog */}
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

        {/* Reset Password Dialog */}
        <Dialog open={!!supervisorToReset} onOpenChange={(open) => !open && setSupervisorToReset(null)}>
          <DialogContent className="rounded-xl border-border p-5 sm:p-6 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-600" />
                Reset Password Pembina
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set password baru untuk <strong className="text-foreground">{supervisorToReset?.name}</strong> ({supervisorToReset?.email || supervisorToReset?.uid}).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveResetPassword} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-password" className="text-xs font-semibold text-foreground">
                    Password Baru
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateRandomPassword}
                    className="h-6 text-[11px] text-primary hover:text-primary/80 font-medium px-1.5"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Buat Otomatis
                  </Button>
                </div>
                <Input
                  id="new-password"
                  type="text"
                  placeholder="Minimal 6 karakter (cth: pembina2026)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-lg border-input bg-background font-mono text-sm"
                  required
                  minLength={6}
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Password ini akan langsung aktif di akun login pembina dan tersimpan untuk cetak PDF.
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSupervisorToReset(null)}
                  disabled={isResetting}
                  className="rounded-lg text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isResetting || newPassword.length < 6}
                  className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 2. PRINT-ONLY DOCUMENT (Rendered purely when window.print() is triggered) */}
      <div className="hidden print:block w-full bg-white text-black p-6 font-sans">
        <div className="text-center border-b-2 border-black pb-3 mb-5">
          <h1 className="text-lg font-bold uppercase tracking-wider">SMP PGII 1 BANDUNG</h1>
          <h2 className="text-base font-bold mt-0.5">DAFTAR KREDENSIAL AKUN GURU PEMBINA</h2>
          <p className="text-xs text-gray-700 mt-0.5">Sistem Monitoring Absensi Sholat Berjamaah</p>
          <p className="text-[11px] text-gray-600 mt-1.5">
            Tanggal Cetak: {format(new Date(), "d MMMM yyyy HH:mm", { locale: idLocale })} WIB
          </p>
        </div>

        <table className="w-full border-collapse border border-black text-xs mb-5">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border border-black p-2 text-center w-8">No</th>
              <th className="border border-black p-2 text-left">Nama Guru Pembina</th>
              <th className="border border-black p-2 text-left">Email Login</th>
              <th className="border border-black p-2 text-left">Password</th>
              <th className="border border-black p-2 text-left">Kelas Binaan</th>
            </tr>
          </thead>
          <tbody>
            {supervisors.map((s, idx) => (
              <tr key={s.id}>
                <td className="border border-black p-2 text-center align-middle">{idx + 1}</td>
                <td className="border border-black p-2 font-semibold align-middle">{s.name}</td>
                <td className="border border-black p-2 font-mono align-middle">{s.email || "-"}</td>
                <td className="border border-black p-2 font-mono font-bold align-middle">
                  {s.initialPassword || "(Belum di-reset)"}
                </td>
                <td className="border border-black p-2 align-middle">
                  {s.classes && s.classes.length > 0
                    ? s.classes.map(cId => AVAILABLE_CLASSES.find(c => c.id === cId)?.name || cId).join(", ")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-[11px] text-gray-700 space-y-1 border-t border-gray-400 pt-3">
          <p className="font-bold">Informasi & Petunjuk:</p>
          <p>1. Informasi kredensial akun ini bersifat rahasia. Bagikan lembar/informasi ini hanya kepada guru pembina yang bersangkutan.</p>
          <p>2. Guru pembina dapat masuk ke aplikasi absensi sholat melalui peramban (browser) di ponsel atau komputer.</p>
          <p>3. Jika password berstatus &quot;(Belum di-reset)&quot;, Admin dapat melakukan reset password terlebih dahulu melalui menu Manajemen Pembina di aplikasi.</p>
        </div>
      </div>
    </>
  );
}
