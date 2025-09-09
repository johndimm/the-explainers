'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SettingsProvider>
        <ProfileProvider>
          {children}
        </ProfileProvider>
      </SettingsProvider>
    </SessionProvider>
  )
}
