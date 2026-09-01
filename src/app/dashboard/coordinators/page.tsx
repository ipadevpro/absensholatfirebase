"use client";

import { useEffect, useState } from "react";
import { getAllCoordinators } from "@/lib/db/coordinators";
import CoordinatorsList from "./components/CoordinatorsList";
import { useAuth } from "@/contexts/AuthContext";
import { Coordinator } from "@/types";

export default function CoordinatorsPage() {
  const { role, loading: authLoading } = useAuth();
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "admin") {
      fetchCoordinators();
    }
  }, [role]);

  const fetchCoordinators = async () => {
    try {
      const data = await getAllCoordinators();
      setCoordinators(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  if (role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center text-center p-12">
        <div className="bg-destructive/10 text-destructive p-8 rounded-xl border border-destructive/20 max-w-md">
          <h2 className="text-lg font-bold mb-2">Akses Terbatas</h2>
          <p className="text-sm">Maaf, halaman ini hanya dapat diakses oleh Admin (Guru).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Koordinator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola akun dan tugas delegasi koordinator kelas.
        </p>
      </div>
      
      <CoordinatorsList initialCoordinators={coordinators} loading={loading} />
    </div>
  );
}
