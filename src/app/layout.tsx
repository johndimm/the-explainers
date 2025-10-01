import type { Metadata, Viewport } from 'next'
import './globals.css'
import ClientLayout from './ClientLayout'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'The Explainers',
  description: 'Understand difficult texts with AI-powered explanations',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'The Explainers'
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'The Explainers',
    title: 'The Explainers',
    description: 'Understand difficult texts with AI-powered explanations',
  },
  twitter: {
    card: 'summary',
    title: 'The Explainers',
    description: 'Understand difficult texts with AI-powered explanations',
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