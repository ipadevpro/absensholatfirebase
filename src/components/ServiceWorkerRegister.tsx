"use client";

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    // 1. Service Worker registration
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Force update check on load
          registration.update();
        })
        .catch(() => {
          // Silent failure
        });
    }

    // 2. Chunk loading error handler
    const handleError = (e: ErrorEvent) => {
      const target = e.target as HTMLElement | null;
      const isScriptError = target && target.tagName === "SCRIPT" && ((target as HTMLScriptElement).src || "").includes("/_next/");
      const isLinkError = target && target.tagName === "LINK" && ((target as HTMLLinkElement).href || "").includes("/_next/");
      const isChunkError = 
        e.message?.includes("Failed to load chunk") || 
        e.message?.includes("Loading chunk") ||
        isScriptError ||
        isLinkError;

      if (isChunkError) {
        console.warn("Chunk/Asset load error detected, reloading page...");
        
        // Prevent infinite reloading loops by using sessionStorage
        const lastReload = sessionStorage.getItem("last-chunk-reload");
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload) > 10000) { // 10 seconds throttle
          sessionStorage.setItem("last-chunk-reload", now.toString());
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleError, true);
    return () => window.removeEventListener("error", handleError, true);
  }, []);

  return null;
}
