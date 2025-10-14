import type { Metadata, Viewport } from 'next'
import './globals.css'
import ClientLayout from './ClientLayout'
import Providers from '@/components/Providers'
import { APP_CONFIG } from '@/config/app-config'

export const metadata: Metadata = {
  title: APP_CONFIG.appName,
  description: APP_CONFIG.appDescription,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/romeo-and-juliet-icon-192x192.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_CONFIG.appName
  },
  other: {
    'mobile-web-app-capable': 'yes'
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_CONFIG.appName,
    title: APP_CONFIG.appName,
    description: APP_CONFIG.appDescription,
  },
  twitter: {
    card: 'summary',
    title: APP_CONFIG.appName,
    description: APP_CONFIG.appDescription,
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
  colorScheme: 'light dark'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  )
}
