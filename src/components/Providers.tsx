'use client'

import { ReactNode } from 'react'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { AuthProvider } from '@/contexts/AuthContext'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}