"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { MoonStar } from "lucide-react";

export function Header() {
  const { user, role } = useAuth();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.includes('/students')) return 'Manajemen Siswa';
    if (pathname.includes('/coordinators')) return 'Manajemen Koordinator';
    if (pathname.includes('/supervisors')) return 'Manajemen Pembina';
    if (pathname.includes('/attendance')) return 'Catat Kehadiran';
    if (pathname.includes('/reports')) return 'Laporan Absensi';
    return 'Dashboard';
  };

  return (
    <header className="bg-background/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 border-b border-border/80">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h2 className="font-semibold text-lg text-foreground leading-tight">{getPageTitle()}</h2>
          <p className="text-xs text-muted-foreground font-medium md:hidden">SMP PGII 1 Bandung</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-foreground">{user?.displayName || user?.email?.split('@')[0]}</p>
            <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
              {role}
            </span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <MoonStar className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
