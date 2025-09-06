import type { Metadata, Viewport } from 'next'
import './globals.css'
import ClientLayout from './ClientLayout'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'The Explainers',
  description: 'Understand difficult texts with AI-powered explanations',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
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