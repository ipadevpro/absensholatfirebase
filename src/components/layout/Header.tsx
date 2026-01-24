"use client";

import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, role } = useAuth();

  return (
    <header className="bg-white shadow-sm p-4 border-b">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Selamat Datang</h2>
          <p className="text-xs text-muted-foreground md:hidden">SMP PGII 1 Bandung</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700">{user?.email}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded inline-block">
            {role}
          </div>
        </div>
      </div>
    </header>
  );
}
