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
    { 
      href: "/dashboard", 
      icon: LayoutDashboard,
      roles: ["admin", "coordinator"] 
    },
    { 
      href: "/dashboard/attendance", 
      icon: ClipboardCheck,
      roles: ["admin", "coordinator"] 
    },
    { 
      href: "/dashboard/reports", 
      icon: BarChart3,
      roles: ["admin", "coordinator"] 
    },
    { 
      href: "/dashboard/students", 
      icon: Users,
      roles: ["admin"] 
    },
    { 
      href: "/dashboard/coordinators", 
      icon: UserCog,
      roles: ["admin"] 
    },
  ];

  const menuItems = allMenuItems.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-colors",
              isActive ? "text-green-600" : "text-gray-400"
            )}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
          </Link>
        );
      })}
    </nav>
  );
}
