"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  BarChart3, 
  Users,
  UserCog
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const allMenuItems = [
    { href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "coordinator", "supervisor"] },
    { href: "/dashboard/attendance", icon: ClipboardCheck, roles: ["admin", "coordinator", "supervisor"] },
    { href: "/dashboard/reports", icon: BarChart3, roles: ["admin", "coordinator", "supervisor"] },
    { href: "/dashboard/students", icon: Users, roles: ["admin"] },
    { href: "/dashboard/coordinators", icon: UserCog, roles: ["admin"] },
  ];

  const menuItems = allMenuItems.filter(item => role && item.roles.includes(role));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-emerald-100 px-4 py-3 flex justify-around items-center z-50 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative p-3 rounded-2xl transition-all duration-300",
              isActive ? "text-emerald-600 bg-emerald-50 scale-110 shadow-inner" : "text-gray-400"
            )}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            {isActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-600" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
