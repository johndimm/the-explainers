import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Explainer',
  description: 'Understand difficult texts with AI-powered explanations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}