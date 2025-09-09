'use client'

import ExplainerStylesPage from '@/components/ExplainerStylesPage'
import { useSettings } from '@/contexts/SettingsContext'

function StylesContent() {
  const { settings, updateSettings } = useSettings()

  return (
    <ExplainerStylesPage
      selectedStyle={settings.explanationStyle}
      onStyleChange={(style) => {
        console.log('ExplainersPage: Style change requested:', style, 'Current settings:', settings)
        updateSettings({ ...settings, explanationStyle: style })
      }}
    />
  )
}

export default function ExplainersPage() {
  return <StylesContent />
}