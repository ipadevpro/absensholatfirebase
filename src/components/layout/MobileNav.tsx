"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  BarChart3, 
  Users,
  UserCog,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, logout } = useAuth();

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border px-3 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex justify-around items-center z-50 shadow-lg">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-xl transition-transform active:scale-95",
              isActive
                ? "text-emerald-800 bg-emerald-100/80 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            title={item.label}
            aria-label={item.label}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-emerald-700" : "text-muted-foreground")} />
            {isActive && (
              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-600" />
            )}
          </Link>
        );
      })}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-transform active:scale-95"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari aplikasi Absen Sholat?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}
