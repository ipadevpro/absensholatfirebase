"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, X } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not dismissed before in this session
      if (!sessionStorage.getItem('pwa-prompt-dismissed')) {
        setShow(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white p-4 rounded-xl shadow-2xl border border-green-100 z-[60] flex items-center justify-between md:max-w-sm md:left-auto md:right-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        <div className="bg-green-100 p-2 rounded-lg text-green-600">
          <Smartphone size={20} />
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900">Pasang Aplikasi</p>
          <p className="text-xs text-muted-foreground">Akses lebih cepat dari layar utama</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleInstall} className="bg-green-600 hover:bg-green-700">Pasang</Button>
        <Button size="icon" variant="ghost" onClick={handleDismiss} className="h-8 w-8 text-gray-400">
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}
