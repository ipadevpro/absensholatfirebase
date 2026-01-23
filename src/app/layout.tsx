import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
}

export const metadata: Metadata = {
  title: 'Absen Sholat',
  description: 'Mobile-first web app for tracking student prayer attendance',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  )
}
