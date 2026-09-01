"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, role } = useAuth();
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
    <aside className="w-64 bg-card hidden md:flex flex-col h-dvh sticky top-0 border-r border-border select-none">
      <div className="p-5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-sm">
            <MoonStar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight leading-tight">Absen Sholat</h1>
            <p className="text-xs text-muted-foreground font-medium">SMP PGII 1 Bandung</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu Utama</p>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-900 font-semibold border border-emerald-100/60"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-700" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border/60 space-y-3">
        <div className="bg-muted/40 border border-border/60 rounded-xl p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/50">
              {role ? `Petugas ${role}` : "Petugas"}
            </span>
          </div>
          <p className="text-xs font-semibold text-foreground truncate">
            {user?.displayName || user?.email?.split('@')[0] || "Pengguna"}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
