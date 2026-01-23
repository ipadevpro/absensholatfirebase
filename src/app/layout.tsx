import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Absen Sholat',
  description: 'Mobile-first web app for tracking student prayer attendance',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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
