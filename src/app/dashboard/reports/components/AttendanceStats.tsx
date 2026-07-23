"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceStats as AttendanceStatsType } from "@/types";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Award, User, Info } from "lucide-react";

interface AttendanceStatsProps {
  stats: AttendanceStatsType[];
}

export function getGrade(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "E";
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-emerald-600 bg-emerald-50 border-emerald-100";
    case "B":
      return "text-blue-600 bg-blue-50 border-blue-100";
    case "C":
      return "text-amber-600 bg-amber-50 border-amber-100";
    case "D":
      return "text-orange-600 bg-orange-50 border-orange-100";
    case "E":
      return "text-rose-600 bg-rose-50 border-rose-100";
    default:
      return "";
  }
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  // Calculate average days recorded from the first student (since they are all the same for the class)
  const totalDays = stats.length > 0 ? stats[0].totalPrayers / 2 : 0;

  return (
    <Card className="border-none shadow-xl shadow-emerald-900/5 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="pb-4 pt-8 px-8 border-b border-emerald-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-2xl font-serif font-bold text-emerald-900">Hasil Penilaian</CardTitle>
          {totalDays > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100/50">
              <Info size={14} className="text-emerald-600" />
              <p className="text-xs font-bold text-emerald-800">
                Data Berdasarkan: <span className="text-emerald-600">{totalDays} Hari Terabsen</span>
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-16 text-center font-bold text-emerald-900/40 uppercase text-[10px] tracking-widest">Peringkat</TableHead>
                <TableHead className="font-bold text-emerald-900/40 uppercase text-[10px] tracking-widest">Nama Siswa</TableHead>
                <TableHead className="text-center font-bold text-emerald-900/40 uppercase text-[10px] tracking-widest">Hadir</TableHead>
                <TableHead className="text-center font-bold text-emerald-900/40 uppercase text-[10px] tracking-widest">Target</TableHead>
                <TableHead className="text-center font-bold text-emerald-900/40 uppercase text-[10px] tracking-widest">Nilai (%)</TableHead>
                <TableHead className="text-center font-bold text-emerald-900/40 uppercase text-[10px] tracking-widest">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <User size={48} />
                      <p className="font-serif font-bold text-lg">Belum ada data</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((stat, index) => {
                  const grade = getGrade(stat.percentage);
                  return (
                    <TableRow key={stat.studentId} className="group hover:bg-emerald-50/30 transition-colors border-emerald-50/50">
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {index === 0 ? (
                            <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shadow-inner"><Trophy size={16} /></div>
                          ) : index === 1 ? (
                            <div className="bg-slate-100 text-slate-500 p-2 rounded-xl shadow-inner"><Medal size={16} /></div>
                          ) : index === 2 ? (
                            <div className="bg-orange-50 text-orange-600 p-2 rounded-xl shadow-inner"><Award size={16} /></div>
                          ) : (
                            <span className="text-xs font-bold text-gray-300">{index + 1}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-emerald-900 group-hover:text-emerald-700 transition-colors">{stat.studentName}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-sans font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-sm">
                          {stat.attended}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-gray-400 text-sm font-medium">
                        {stat.totalPrayers}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "text-sm font-black",
                          stat.percentage >= 80 ? "text-emerald-600" : "text-gray-600"
                        )}>
                          {stat.percentage}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <span className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-serif font-black border transition-all group-hover:scale-110",
                            getGradeColor(grade)
                          )}>
                            {grade}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
