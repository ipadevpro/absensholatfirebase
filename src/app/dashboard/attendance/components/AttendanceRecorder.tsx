"use client";

import { useEffect, useState } from "react";
import { Student, PrayerType } from "@/types";
import { getStudentsByClass } from "@/lib/db/students";
import { markPresent, markAbsent, subscribeToAttendance } from "@/lib/db/attendance";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale"; // Use Indonesian locale
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { AttendanceList } from "./AttendanceList";
import { getPrayersForDay } from "@/lib/utils";

interface AttendanceRecorderProps {
  classId: string;
  gender: "ikhwan" | "akhwat";
  date: string; // YYYY-MM-DD
}

export function AttendanceRecorder({ classId, gender, date }: AttendanceRecorderProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const prayers = getPrayersForDay(gender, new Date(date));
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerType>(prayers[0] || "zuhur");
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Update selected prayer if the list of prayers changes (e.g. date change)
  useEffect(() => {
    if (!prayers.includes(selectedPrayer)) {
      setSelectedPrayer(prayers[0] || "zuhur");
    }
  }, [date, gender]);

  // Fetch students
  useEffect(() => {
    async function fetchStudents() {
      try {
        const data = await getStudentsByClass(classId);
        setStudents(data.filter(s => s.gender === gender));
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    }
    fetchStudents();
  }, [classId, gender]);

  // Subscribe to attendance updates
  useEffect(() => {
    if (!date || !classId) return;
    
    setLoading(true);
    const unsubscribe = subscribeToAttendance(
      date,
      classId,
      gender,
      selectedPrayer,
      (present) => {
        setPresentIds(new Set(present));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [date, classId, gender, selectedPrayer]);

  const handleToggle = async (studentId: string, isPresent: boolean) => {
    // Optimistic update
    setPresentIds(prev => {
      const next = new Set(prev);
      if (isPresent) next.add(studentId);
      else next.delete(studentId);
      return next;
    });

    setUpdatingIds(prev => new Set(prev).add(studentId));

    try {
      if (isPresent) {
        await markPresent(date, classId, gender, selectedPrayer, studentId);
      } else {
        await markAbsent(date, classId, gender, selectedPrayer, studentId);
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      // Revert on error
      setPresentIds(prev => {
        const next = new Set(prev);
        if (isPresent) next.delete(studentId);
        else next.add(studentId);
        return next;
      });
      // Here you would show a toast error
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2 text-muted-foreground mb-2">
          <CalendarIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {format(new Date(date), "EEEE, d MMMM yyyy", { locale: idLocale })}
          </span>
        </div>
        <CardTitle className="text-2xl font-bold">Catat Kehadiran</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedPrayer} onValueChange={(v) => setSelectedPrayer(v as PrayerType)} className="w-full">
          <TabsList className={cn("grid w-full mb-6", prayers.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
            {prayers.map((prayer) => (
              <TabsTrigger key={prayer} value={prayer} className="capitalize">
                {prayer === "jumat" ? "Jum'at" : prayer}
              </TabsTrigger>
            ))}
          </TabsList>

          {prayers.map((prayer) => (
            <TabsContent key={prayer} value={prayer} className="mt-0">
              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <AttendanceList 
                  students={students}
                  presentIds={presentIds}
                  updatingIds={updatingIds}
                  onToggle={handleToggle}
                  prayerKey={prayer}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
