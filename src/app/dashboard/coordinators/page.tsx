"use client";

import { useEffect, useState } from "react";
import { getAllCoordinators } from "@/lib/db/coordinators";
import CoordinatorsList from "./components/CoordinatorsList";
import { useAuth } from "@/contexts/AuthContext";
import { Coordinator } from "@/types";
import { Loader2 } from "lucide-react";

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
        <div className="bg-red-50 text-red-600 p-8 rounded-xl border border-red-100 max-w-md">
          <h2 className="text-xl font-bold mb-2">Akses Terbatas</h2>
          <p>Maaf, halaman ini hanya dapat diakses oleh Admin (Guru).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Koordinator</h1>
        <p className="text-muted-foreground mt-2">
          Kelola akun dan tugas delegasi koordinator kelas.
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <CoordinatorsList initialCoordinators={coordinators} />
      )}
    </div>
  );
}
