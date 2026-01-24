"use client";

import { useAuth } from "@/contexts/AuthContext";
import { 
  ClipboardCheck, 
  Users, 
  UserCog, 
  BarChart3, 
  LayoutDashboard 
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { role } = useAuth();

  const adminLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Isi atau monitor absen sholat" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat rekapan & nilai siswa" },
    { href: "/dashboard/students", label: "Siswa", icon: Users, desc: "Kelola data siswa & kelas" },
    { href: "/dashboard/coordinators", label: "Koordinator", icon: UserCog, desc: "Delegasikan tugas absen" },
  ];

  const coordLinks = [
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, desc: "Mulai mengabsen sholat kelas" },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, desc: "Lihat statistik kehadiran kelas" },
  ];

  const links = role === "admin" ? adminLinks : coordLinks;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg text-green-600">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang di Sistem Absensi Sholat SMP PGII 1 Bandung
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:border-green-500 hover:shadow-md transition-all group cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                    <Icon size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{link.label}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {link.desc}
                    </p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="bg-green-600 text-white border-none shadow-lg overflow-hidden relative">
        <CardContent className="p-8">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2">Monitoring Sholat</h2>
            <p className="text-green-50 max-w-lg">
              Pastikan seluruh siswa melaksanakan sholat tepat waktu. Pantau kehadiran harian dan berikan penilaian yang objektif melalui menu laporan.
            </p>
          </div>
          {/* Decorative pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ClipboardCheck size={160} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
