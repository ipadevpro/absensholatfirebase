"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAttendanceStats } from "@/lib/db/reports";
import { AttendanceStats as StatsType, Coordinator } from "@/types";
import { AttendanceStats } from "./components/AttendanceStats";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  // State
  const [classId, setClassId] = useState<string>("");
  const [gender, setGender] = useState<string>("ikhwan");
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [stats, setStats] = useState<StatsType[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load coordinator profile
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setInitialLoading(false);
        return;
      }
      try {
        const q = query(collection(db, "coordinators"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as Coordinator;
          setClassId(data.classId);
          setGender(data.gender);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setInitialLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  // Fetch stats
  const handleFetch = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const data = await getAttendanceStats(
        classId,
        gender,
        parseInt(year),
        parseInt(month)
      );
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
     return (
       <div className="flex h-full items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Laporan Absensi</h1>

      <div className="grid gap-4 md:grid-cols-5 items-end bg-white p-4 rounded-lg border shadow-sm">
        <div className="space-y-2">
          <Label>Kelas</Label>
          <Input 
            value={classId} 
            onChange={(e) => setClassId(e.target.value)} 
            placeholder="Contoh: 7A"
          />
        </div>

        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ikhwan">Ikhwan</SelectItem>
              <SelectItem value="akhwat">Akhwat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Bulan</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {new Date(0, m - 1).toLocaleString('id-ID', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tahun</Label>
           <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleFetch} disabled={loading || !classId}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Tampilkan
        </Button>
      </div>

      <AttendanceStats stats={stats} />
    </div>
  );
}
