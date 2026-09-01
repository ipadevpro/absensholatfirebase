import type { Metadata, Viewport } from "next";
import { Amiri, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import Script from "next/script";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://absensholat.pgii.sch.id"
  ),
  title: {
    default: "Absen Sholat - SMP PGII 1 Bandung",
    template: "%s | Absen Sholat",
  },
  description: "Sistem Monitoring & Presensi Ibadah Sholat Siswa SMP PGII 1 Bandung",
  applicationName: "Absen Sholat",
  authors: [{ name: "Devi Saidulloh, S.Pd., Gr." }],
  keywords: [
    "absen sholat",
    "smp pgii 1 bandung",
    "presensi ibadah",
    "sholat berjamaah",
    "monitoring ibadah",
    "sekolah islam",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://absensholat.pgii.sch.id",
    siteName: "Absen Sholat SMP PGII 1 Bandung",
    title: "Absen Sholat - SMP PGII 1 Bandung",
    description: "Sistem Presensi Ibadah Sholat Siswa Modern, Cepat, dan Terintegrasi",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Absen Sholat - SMP PGII 1 Bandung",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Absen Sholat - SMP PGII 1 Bandung",
    description: "Sistem Presensi Ibadah Sholat Siswa Modern, Cepat, dan Terintegrasi",
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Absen Sholat",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${amiri.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased bg-[#fdfcf0] text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
        <Script id="recovery-script" strategy="beforeInteractive">
          {`
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
          `}
        </Script>
        <AuthProvider>
          {children}
          <Toaster position="top-center" expand={false} richColors />
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
