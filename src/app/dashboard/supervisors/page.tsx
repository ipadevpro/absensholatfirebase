"use client";

import { useEffect, useState } from "react";
import { getAllSupervisors } from "@/lib/db/supervisors";
import SupervisorsList from "./components/SupervisorsList";
import { useAuth } from "@/contexts/AuthContext";
import { Supervisor } from "@/types";
import { Loader2 } from "lucide-react";

export default function SupervisorsPage() {
  const { role, loading: authLoading } = useAuth();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "admin") {
      fetchSupervisors();
    }
  }, [role]);

  const fetchSupervisors = async () => {
    try {
      const data = await getAllSupervisors();
      setSupervisors(data);
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
        <h1 className="text-3xl font-bold tracking-tight">Pembina / Pembimbing</h1>
        <p className="text-muted-foreground mt-2">
          Kelola akun guru pembina/pembimbing absensi sholat.
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <SupervisorsList initialSupervisors={supervisors} />
      )}
    </div>
  );
}
