'use client'

import Settings from '@/components/Settings'
import { useSettings } from '@/contexts/SettingsContext'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'

function SettingsContent() {
  const { settings, updateSettings } = useSettings()
  const router = useRouter()

  return (
    <Settings
      isOpen={true}
      onClose={() => router.push('/library')}
      settings={settings}
      onSettingsChange={(newSettings) => {
        updateSettings(newSettings)
      }}
    />
  )
}

export default function SettingsPage() {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <SettingsContent />
      </SettingsProvider>
    </ProfileProvider>
  )
}