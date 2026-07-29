import type { Metadata, Viewport } from "next";
import { Amiri, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const amiri = Amiri({ 
  subsets: ["arabic", "latin"], 
  weight: ["400", "700"],
  variable: "--font-amiri",
});

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#064e3b",
};

export const metadata: Metadata = {
  title: "Absen Sholat - SMP PGII 1 Bandung",
  description: "Sistem Monitoring Kehadiran Ibadah",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${amiri.variable} ${jakarta.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function recover() {
                  console.warn('Next.js asset load failure. Recovering...');
                  
                  // Prevent infinite reloading loops by using sessionStorage throttle
                  try {
                    var lastReload = sessionStorage.getItem('last-recovery-reload');
                    var now = Date.now();
                    if (lastReload && (now - parseInt(lastReload) < 10000)) {
                      console.error('Recovery reload throttled to prevent infinite loop.');
                      return;
                    }
                    sessionStorage.setItem('last-recovery-reload', now.toString());
                  } catch (err) {
                    console.error('sessionStorage access failed:', err);
                  }

                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(regs) {
                      var promises = regs.map(function(r) { return r.unregister(); });
                      Promise.all(promises).then(function() {
                        clearCachesAndReload();
                      });
                    }).catch(clearCachesAndReload);
                  } else {
                    clearCachesAndReload();
                  }
                }
                function clearCachesAndReload() {
                  if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
                    }).then(function() {
                      window.location.reload();
                    }).catch(function() {
                      window.location.reload();
                    });
                  } else {
                    window.location.reload();
                  }
                }
                window.addEventListener('error', function(e) {
                  var t = e.target;
                  if (t && (t.tagName === 'SCRIPT' || t.tagName === 'LINK')) {
                    var url = t.src || t.href;
                    if (url && url.indexOf('/_next/') !== -1) {
                      recover();
                    }
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && (e.reason.message || '').indexOf('Failed to load chunk') !== -1) {
                    recover();
                  }
                });
              })();
            `
          }}
        />
      </head>
      <body className="font-sans antialiased bg-[#fdfcf0] text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
        <AuthProvider>
          {children}
          <Toaster position="top-center" expand={false} richColors />
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
