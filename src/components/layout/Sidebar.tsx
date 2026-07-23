"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  LogOut, 
  BarChart3, 
  UserCog,
  MoonStar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const { logout, role } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const allMenuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "coordinator", "supervisor"] },
    { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck, roles: ["admin", "coordinator", "supervisor"] },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3, roles: ["admin", "coordinator", "supervisor"] },
    { href: "/dashboard/students", label: "Siswa", icon: Users, roles: ["admin"] },
    { href: "/dashboard/coordinators", label: "Koordinator", icon: UserCog, roles: ["admin"] },
    { href: "/dashboard/supervisors", label: "Pembina", icon: UserCog, roles: ["admin"] },
  ];

  const menuItems = allMenuItems.filter(item => role && item.roles.includes(role));

  return (
    <aside className="w-72 bg-white hidden md:flex flex-col h-screen sticky top-0 border-r border-emerald-50">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-emerald-200 shadow-lg">
            <MoonStar size={24} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-emerald-900 tracking-tight">Absen Sholat</h1>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600/60 font-bold ml-12">SMP PGII 1 Bandung</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-8 mt-4">
        <div>
          <p className="px-4 mb-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Main Menu</p>
          <ul className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                      isActive
                        ? "bg-emerald-600 text-white shadow-emerald-100 shadow-xl"
                        : "text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                    )}
                  >
                    <Icon size={20} className={cn(isActive ? "text-white" : "text-gray-400 group-hover:text-emerald-600")} />
                    <span className="font-medium text-sm tracking-wide">{item.label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="p-6">
        <div className="bg-emerald-50 rounded-3xl p-5 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-1">Petugas {role}</p>
            <p className="text-xs font-serif font-bold text-emerald-900 line-clamp-1 italic">Ahlan wa Sahlan!</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-emerald-100/50">
            <MoonStar size={64} strokeWidth={1} />
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-3.5 text-red-500 hover:bg-red-50 rounded-2xl w-full transition-all duration-300 font-bold text-sm"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
