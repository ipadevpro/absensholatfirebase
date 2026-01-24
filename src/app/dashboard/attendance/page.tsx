"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AttendanceRecorder } from "./components/AttendanceRecorder";
import { db } from "@/lib/firebase/config";
import { Coordinator } from "@/types";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function AttendancePage() {
  const { user } = useAuth();
  const [classId, setClassId] = useState<string>("");
  const [gender, setGender] = useState<"ikhwan" | "akhwat">("ikhwan");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRoleAndProfile() {
      if (!user) return;
      try {
        setLoading(true);
        // 1. Check if user is a coordinator (uses UID as document ID)
        const coordDoc = await getDoc(doc(db, "coordinators", user.uid));
        
        if (coordDoc.exists()) {
          const coordinatorData = coordDoc.data() as Coordinator;
          setClassId(coordinatorData.classId);
          setGender(coordinatorData.gender);
          setIsAdmin(false);
        } else {
          // 2. Check if user is an admin
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (adminDoc.exists()) {
            setIsAdmin(true);
            // Don't set classId/gender yet, let admin pick
          } else {
            setError("Profil tidak ditemukan. Pastikan UID Anda terdaftar sebagai Admin atau Koordinator.");
          }
        }
      } catch (err) {
        console.error("Error checking role:", err);
        setError("Gagal memuat profil.");
      } finally {
        setLoading(false);
      }
    }
    checkRoleAndProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-6 space-y-4">
        <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-100 max-w-md">
          <p className="font-semibold">Akses Ditolak</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Absensi Sholat</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm border">
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input 
              type="date" 
              id="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>

          {isAdmin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="class">Kelas</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_CLASSES.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Kategori</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ikhwan">Ikhwan</SelectItem>
                    <SelectItem value="akhwat">Akhwat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {!isAdmin && classId && (
            <div className="md:col-span-2 flex items-end">
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md border border-green-100 w-full">
                <p className="text-sm font-medium">
                  Monitoring Kelas: <span className="font-bold">{AVAILABLE_CLASSES.find(c => c.id === classId)?.name}</span> • 
                  Kategori: <span className="font-bold capitalize">{gender}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {classId && gender ? (
        <AttendanceRecorder 
          classId={classId} 
          gender={gender} 
          date={date} 
        />
      ) : (
        <div className="flex h-48 items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground bg-gray-50">
          <p>Silakan pilih kelas dan kategori untuk melihat daftar absen.</p>
        </div>
      )}
    </div>
  );
}
