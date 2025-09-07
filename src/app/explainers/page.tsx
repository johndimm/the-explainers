'use client'

import ExplainerStylesPage from '@/components/ExplainerStylesPage'
import { useSettings } from '@/contexts/SettingsContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'

function StylesContent() {
  const { settings, updateSettings } = useSettings()

  return (
    <ExplainerStylesPage
      selectedStyle={settings.explanationStyle}
      onStyleChange={(style) => {
        updateSettings({ ...settings, explanationStyle: style })
      }}
    />
  )
}

export default function ExplainersPage() {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <StylesContent />
      </SettingsProvider>
    </ProfileProvider>
  )
}