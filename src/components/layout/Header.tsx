"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { AVAILABLE_CLASSES } from "@/lib/constants";
import { MoonStar } from "lucide-react";

export function Header() {
  const { user, role } = useAuth();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.includes('/students')) return 'Manajemen Siswa';
    if (pathname.includes('/coordinators')) return 'Manajemen Koordinator';
    if (pathname.includes('/attendance')) return 'Catat Kehadiran';
    if (pathname.includes('/reports')) return 'Laporan Absensi';
    return 'Dashboard';
  };

  return (
    <header className="bg-[#fdfcf0]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 border-b border-emerald-100/50">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <div>
          <h2 className="text-xl font-serif font-bold text-emerald-900 leading-none">{getPageTitle()}</h2>
          <p className="text-[10px] uppercase tracking-widest text-emerald-600/60 font-bold mt-1.5 md:hidden">SMP PGII 1 Bandung</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-700">{user?.email?.split('@')[0]}</p>
            <span className="text-[9px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              {role}
            </span>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <MoonStar size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
