'use client'

import ExplainerStyles from '@/components/ExplainerStyles'
import { useSettings } from '@/contexts/SettingsContext'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'

function StylesContent() {
  const { settings, updateSettings } = useSettings()
  const router = useRouter()

  return (
    <ExplainerStyles
      isOpen={true}
      onClose={() => router.push('/library')}
      selectedStyle={settings.explanationStyle}
      onStyleChange={(style) => {
        updateSettings({ ...settings, explanationStyle: style })
      }}
    />
  )
}

export default function StylesPage() {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <StylesContent />
      </SettingsProvider>
    </ProfileProvider>
  )
}