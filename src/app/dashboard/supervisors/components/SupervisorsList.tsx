"use client";

import { useState } from "react";
import { Supervisor } from "@/types";
import { deleteSupervisor } from "@/lib/db/supervisors";
import { createSupervisorAccount } from "@/app/actions/supervisor";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, X, AlertCircle } from "lucide-react";
import SupervisorForm from "./SupervisorForm";

interface SupervisorsListProps {
  initialSupervisors: Supervisor[];
}

export default function SupervisorsList({ initialSupervisors }: SupervisorsListProps) {
  const [supervisors, setSupervisors] = useState<Supervisor[]>(initialSupervisors);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          createdAt: new Date()
        };
        setSupervisors([...supervisors, newSup]);
        setIsFormOpen(false);
        return true;
      } else {
        setError(result.error || "Gagal membuat akun pembina");
        return false;
      }
    } catch (err) {
      console.error("Failed to add supervisor", err);
      setError("Gagal menambahkan pembina. Silakan coba lagi.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pembina ini?")) return;
    setError(null);
    try {
      await deleteSupervisor(id);
      setSupervisors(supervisors.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete supervisor", err);
      setError("Gagal menghapus pembina. Silakan coba lagi.");
    }
  };

  return (
    <div className="space-y-6">
      {error && !isFormOpen && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div></div>
        <Button 
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setError(null);
          }} 
          variant={isFormOpen ? "secondary" : "default"}
        >
          {isFormOpen ? <><X className="mr-2 h-4 w-4" /> Batal</> : <><Plus className="mr-2 h-4 w-4" /> Tambah Pembina</>}
        </Button>
      </div>

      {isFormOpen && (
        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-200">
          <SupervisorForm onSubmit={handleAdd} isLoading={isLoading} error={error} />
        </div>
      )}

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>UID</TableHead>
              <TableHead className="w-[100px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supervisors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                  Belum ada data pembina.
                </TableCell>
              </TableRow>
            ) : (
              supervisors.map((supervisor) => (
                <TableRow key={supervisor.id}>
                  <TableCell className="font-medium">{supervisor.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{supervisor.uid}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(supervisor.id)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      title="Hapus Pembina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
