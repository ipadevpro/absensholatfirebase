"use client";

import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Selamat Datang</h2>
        <div className="text-sm text-gray-500">
          {user?.email}
        </div>
      </div>
    </header>
  );
}