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
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceStats as AttendanceStatsType } from "@/types";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Award, Info, FileBarChart2 } from "lucide-react";

interface AttendanceStatsProps {
  stats: AttendanceStatsType[];
  loading?: boolean;
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
      return "text-emerald-700 bg-emerald-50 border-emerald-200/80";
    case "B":
      return "text-blue-700 bg-blue-50 border-blue-200/80";
    case "C":
      return "text-amber-700 bg-amber-50 border-amber-200/80";
    case "D":
      return "text-orange-700 bg-orange-50 border-orange-200/80";
    case "E":
      return "text-rose-700 bg-rose-50 border-rose-200/80";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
}

export function AttendanceStats({ stats, loading = false }: AttendanceStatsProps) {
  // Calculate average days recorded from the first student (since they are all the same for the class)
  const totalDays = stats.length > 0 ? stats[0].totalPrayers / 2 : 0;

  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-foreground">Hasil Rekapitulasi</CardTitle>
          {!loading && totalDays > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/60 rounded-lg border border-border">
              <Info size={13} className="text-primary" />
              <p className="text-xs font-medium text-muted-foreground">
                Berdasarkan: <span className="font-semibold text-foreground tabular-nums">{totalDays} Hari Terabsen</span>
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[560px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-16 text-center font-semibold text-foreground text-xs">Peringkat</TableHead>
                <TableHead className="font-semibold text-foreground text-xs">Nama Siswa</TableHead>
                <TableHead className="text-center font-semibold text-foreground text-xs">Hadir</TableHead>
                <TableHead className="text-center font-semibold text-foreground text-xs">Target</TableHead>
                <TableHead className="text-center font-semibold text-foreground text-xs">Nilai (%)</TableHead>
                <TableHead className="text-center font-semibold text-foreground text-xs w-20">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-border">
                    <TableCell className="text-center py-3">
                      <Skeleton className="h-6 w-6 rounded-lg mx-auto" />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Skeleton className="h-5 w-8 rounded-md mx-auto" />
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Skeleton className="h-4 w-10 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Skeleton className="h-7 w-7 rounded-lg mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : stats.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="bg-muted p-3.5 rounded-full text-muted-foreground">
                        <FileBarChart2 size={24} />
                      </div>
                      <p className="font-medium text-xs text-foreground">Belum ada data untuk ditampilkan</p>
                      <p className="text-[11px] text-muted-foreground">Pilih kelas, kategori, bulan, dan tahun lalu klik &quot;Tampilkan&quot;.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((stat, index) => {
                  const grade = getGrade(stat.percentage);
                  return (
                    <TableRow key={stat.studentId} className="group hover:bg-muted/30 transition-colors border-border">
                      <TableCell className="text-center py-3">
                        <div className="flex justify-center items-center">
                          {index === 0 ? (
                            <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg border border-amber-200/60 shadow-xs" title="Juara 1">
                              <Trophy size={14} />
                            </div>
                          ) : index === 1 ? (
                            <div className="bg-slate-100 text-slate-700 p-1.5 rounded-lg border border-slate-200/60 shadow-xs" title="Juara 2">
                              <Medal size={14} />
                            </div>
                          ) : index === 2 ? (
                            <div className="bg-orange-100 text-orange-700 p-1.5 rounded-lg border border-orange-200/60 shadow-xs" title="Juara 3">
                              <Award size={14} />
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground tabular-nums">{index + 1}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">{stat.studentName}</p>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <span className="tabular-nums font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200/60">
                          {stat.attended}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <span className="tabular-nums text-muted-foreground text-xs font-medium">
                          {stat.totalPrayers}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <span className={cn(
                          "tabular-nums text-xs font-bold",
                          stat.percentage >= 80 ? "text-emerald-700" : "text-foreground"
                        )}>
                          {stat.percentage}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <div className="flex justify-center">
                          <span className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border shadow-xs transition-transform group-hover:scale-105 tabular-nums",
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
