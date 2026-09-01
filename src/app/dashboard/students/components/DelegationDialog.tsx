"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Student } from "@/types";
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
import { Label } from "@/components/ui/label";
import { createCoordinatorAccount } from "@/app/actions/coordinator";
import { AlertCircle, Loader2 } from "lucide-react";

interface DelegationDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DelegationDialog({
  student,
  open,
  onOpenChange,
  onSuccess,
}: DelegationDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!student) return null;

  const handleDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await createCoordinatorAccount({
        name: student.name,
        email,
        password,
        classId: student.classId,
        gender: student.gender,
      });

      if (result.success) {
        toast.success(`Akun koordinator untuk ${student.name} berhasil dibuat`);
        onSuccess();
        onOpenChange(false);
        setEmail("");
        setPassword("");
      } else {
        const msg = result.error || "Gagal membuat akun koordinator";
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err.message || "Terjadi kesalahan sistem";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-xl border-border p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
            Delegasikan sebagai Koordinator
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Buat akun login untuk <strong className="text-foreground">{student.name}</strong>. Koordinator akan bertugas mengabsen sholat kelas {student.classId.toUpperCase()}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleDelegation} className="space-y-4 pt-2">
          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">Email Koordinator</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@pgii.sch.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border-input bg-background h-9 text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border-input bg-background h-9 text-sm"
              required
              minLength={6}
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="rounded-lg border-border h-9 px-4 text-xs font-medium">
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-5 text-xs font-medium">
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Delegasikan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
