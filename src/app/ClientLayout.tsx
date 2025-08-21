'use client'

import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProfileProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </ProfileProvider>
  )
}