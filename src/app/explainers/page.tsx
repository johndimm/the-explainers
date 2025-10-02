'use client'
import { log } from '@/utils/log'

import ExplainerStylesPage from '@/components/ExplainerStylesPage'
import { useSettings } from '@/contexts/SettingsContext'

function StylesContent() {
  const { settings, updateSettings } = useSettings()

  return (
    <ExplainerStylesPage
      selectedStyle={settings.explanationStyle}
      onStyleChange={(style) => {
log('ui','ExplainersPage: Style change requested:', style, 'Current settings:', settings)
        updateSettings({ ...settings, explanationStyle: style })
      }}
    />
  )
}

export default function ExplainersPage() {
  return <StylesContent />
}