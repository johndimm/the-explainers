'use client'

import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { NavigationProvider } from '@/contexts/NavigationContext'
import AdaptiveAppLayout from '@/components/AdaptiveAppLayout'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <NavigationProvider>
          <AdaptiveAppLayout>
            {children}
          </AdaptiveAppLayout>
        </NavigationProvider>
      </SettingsProvider>
    </ProfileProvider>
  )
}