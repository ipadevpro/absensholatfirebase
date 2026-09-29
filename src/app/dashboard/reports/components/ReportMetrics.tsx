"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceStats } from "@/types";
import { Award, CheckCircle2, AlertTriangle, CalendarDays, TrendingUp } from "lucide-react";

interface ReportMetricsProps {
  stats: AttendanceStats[];
  loading?: boolean;
}

export function ReportMetrics({ stats, loading = false }: ReportMetricsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3.5 w-20 mb-2" />
            <Skeleton className="h-7 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  if (stats.length === 0) return null;

  // Total unique days recorded
  const totalDays = stats.length > 0 ? stats[0].totalPrayers / 2 : 0;

  // Average score (numeric, no % sign)
  const totalScore = stats.reduce((acc, curr) => acc + curr.percentage, 0);
  const avgScore = stats.length > 0 ? Math.round(totalScore / stats.length) : 0;

  // Grade breakdowns
  const gradeACount = stats.filter((s) => s.percentage >= 90).length;
  const gradeBCCount = stats.filter((s) => s.percentage >= 70 && s.percentage < 90).length;
  const gradeDECount = stats.filter((s) => s.percentage < 70).length;

  const metrics = [
    {
      label: "Rata-rata Nilai",
      value: avgScore,
      subtext: "Skala 0 - 100",
      icon: TrendingUp,
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Sangat Disiplin (A)",
      value: gradeACount,
      subtext: `${Math.round((gradeACount / stats.length) * 100)}% dari total`,
      icon: Award,
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Disiplin Baik (B-C)",
      value: gradeBCCount,
      subtext: `${Math.round((gradeBCCount / stats.length) * 100)}% dari total`,
      icon: CheckCircle2,
      color: "text-blue-700 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Perlu Perhatian (D-E)",
      value: gradeDECount,
      subtext: `${Math.round((gradeDECount / stats.length) * 100)}% dari total`,
      icon: AlertTriangle,
      color: "text-rose-700 dark:text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Hari Terabsen",
      value: `${totalDays} Hari`,
      subtext: "Sholat terjadwal",
      icon: CalendarDays,
      color: "text-primary dark:text-primary-foreground",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <Card
            key={idx}
            className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs hover:border-border/80 transition-colors"
          >
            <CardContent className="p-0 space-y-1.5">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground truncate">{m.label}</span>
                <div className={`p-1 rounded-md ${m.bg} ${m.color} shrink-0`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {m.value}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{m.subtext}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
