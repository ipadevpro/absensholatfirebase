"use client";

import { useState } from "react";
import { Coordinator } from "@/types";
import { deleteCoordinator } from "@/lib/db/coordinators";
import { createCoordinatorAccount } from "@/app/actions/coordinator";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, X, AlertCircle } from "lucide-react";
import CoordinatorForm from "./CoordinatorForm";

interface CoordinatorsListProps {
  initialCoordinators: Coordinator[];
}

export default function CoordinatorsList({ initialCoordinators }: CoordinatorsListProps) {
  const [coordinators, setCoordinators] = useState<Coordinator[]>(initialCoordinators);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return true;
      } else {
        setError(result.error || "Gagal membuat akun koordinator");
        return false;
      }
    } catch (err: any) {
      console.error("Failed to add coordinator", err);
      setError("Gagal membuat akun koordinator. Silakan coba lagi.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coordinator?")) return;
    setError(null);
    try {
      await deleteCoordinator(id);
      setCoordinators(coordinators.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete coordinator", error);
      setError("Failed to delete coordinator. Please try again.");
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
        <div>
           {/* Spacer */}
        </div>
        <Button 
            onClick={() => {
                setIsFormOpen(!isFormOpen);
                setError(null);
            }} 
            variant={isFormOpen ? "secondary" : "default"}
        >
          {isFormOpen ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Add Coordinator</>}
        </Button>
      </div>

      {isFormOpen && (
        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-200">
            <CoordinatorForm onSubmit={handleAdd} isLoading={isLoading} error={error} />
        </div>
      )}

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>UID</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coordinators.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No coordinators found.
                    </TableCell>
                </TableRow>
            ) : (
                coordinators.map((coordinator) => (
                <TableRow key={coordinator.id}>
                    <TableCell className="font-medium">{coordinator.name}</TableCell>
                    <TableCell className="capitalize">{coordinator.gender}</TableCell>
                    <TableCell>{coordinator.classId}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{coordinator.uid}</TableCell>
                    <TableCell className="text-right">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coordinator.id)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        title="Delete coordinator"
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
