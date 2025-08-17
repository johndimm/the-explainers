'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SettingsData, LLMProvider, ResponseLength, FontFamily } from '../components/Settings'

interface SettingsContextType {
  settings: SettingsData
  updateSettings: (newSettings: SettingsData) => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

const DEFAULT_SETTINGS: SettingsData = {
  llmProvider: 'openai',
  responseLength: 'medium',
  textFont: 'serif',
  chatFont: 'sans-serif'
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    const savedSettings = localStorage.getItem('explainer-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [])

  const updateSettings = (newSettings: SettingsData) => {
    setSettings(newSettings)
    localStorage.setItem('explainer-settings', JSON.stringify(newSettings))
  }

  const openSettings = () => setIsSettingsOpen(true)
  const closeSettings = () => setIsSettingsOpen(false)

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      isSettingsOpen,
      openSettings,
      closeSettings
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}