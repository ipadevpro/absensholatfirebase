"use client";

import { useEffect, useState } from "react";
import { getAllSupervisors } from "@/lib/db/supervisors";
import SupervisorsList from "./components/SupervisorsList";
import { useAuth } from "@/contexts/AuthContext";
import { Supervisor } from "@/types";

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Pembina</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola akun guru pembina/pembimbing absensi sholat.
        </p>
      </div>
      
      <SupervisorsList initialSupervisors={supervisors} loading={loading} />
    </div>
  );
}
