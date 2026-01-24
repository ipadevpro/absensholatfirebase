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
  UserCog 
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

  // Define all menu items with role restrictions
  const allMenuItems = [
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      roles: ["admin", "coordinator"] 
    },
    { 
      href: "/dashboard/attendance", 
      label: "Absensi", 
      icon: ClipboardCheck,
      roles: ["admin", "coordinator"] 
    },
    { 
      href: "/dashboard/reports", 
      label: "Laporan", 
      icon: BarChart3,
      roles: ["admin", "coordinator"] 
    },
    { 
      href: "/dashboard/students", 
      label: "Siswa", 
      icon: Users,
      roles: ["admin"] 
    },
    { 
      href: "/dashboard/coordinators", 
      label: "Koordinator", 
      icon: UserCog,
      roles: ["admin"] 
    },
  ];

  // Filter menu items based on current user's role
  const menuItems = allMenuItems.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <aside className="w-64 bg-white shadow-md hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-green-600">Absen Sholat</h1>
        <p className="text-xs text-gray-500 font-medium">SMP PGII 1 Bandung</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-green-50 text-green-700 font-semibold shadow-sm border border-green-100"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon size={18} className={cn(isActive ? "text-green-600" : "text-gray-400")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t bg-gray-50/50">
        <div className="mb-4 px-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Logged in as</p>
          <p className="text-xs font-semibold text-gray-700 capitalize">{role || 'User'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg w-full transition-colors duration-200 font-medium text-sm"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
