"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AttendanceRecorder } from "./components/AttendanceRecorder";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Coordinator } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AttendancePage() {
  const { user } = useAuth();
  const [classId, setClassId] = useState<string>("");
  const [gender, setGender] = useState<"ikhwan" | "akhwat">("ikhwan");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoordinatorProfile() {
      if (!user) return;
      try {
        const q = query(collection(db, "coordinators"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const coordinatorData = snapshot.docs[0].data() as Coordinator;
          setClassId(coordinatorData.classId);
          setGender(coordinatorData.gender);
        } else {
             // Fallback or error if not a coordinator
             // For this implementation, we assume if not found, we can't auto-select
             setError("Profil koordinator tidak ditemukan.");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Gagal memuat profil.");
      } finally {
        setLoading(false);
      }
    }
    fetchCoordinatorProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!classId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Anda belum ditugaskan ke kelas manapun.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Absensi Sholat</h1>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="date">Tanggal</Label>
          <Input 
            type="date" 
            id="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <AttendanceRecorder 
        classId={classId} 
        gender={gender} 
        date={date} 
      />
    </div>
  );
}
