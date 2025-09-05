'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SettingsData, LLMProvider, ResponseLength, FontFamily, ReadingMode, ExplanationStyle } from '../components/Settings'

interface SettingsContextType {
  settings: SettingsData
  updateSettings: (newSettings: SettingsData) => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  isSettingsLoaded: boolean
}

const DEFAULT_SETTINGS: SettingsData = {
  llmProvider: 'gemini',
  responseLength: 'brief',
  textFont: 'serif',
  chatFont: 'sans-serif',
  readingMode: 'scroll',
  explanationStyle: 'neutral'
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

  useEffect(() => {
    const savedSettings = localStorage.getItem('explainer-settings')
    console.log('SettingsContext: Loading settings from localStorage:', savedSettings)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        console.log('SettingsContext: Parsed settings:', parsed)
        const mergedSettings = { ...DEFAULT_SETTINGS, ...parsed }
        console.log('SettingsContext: Merged settings:', mergedSettings)
        setSettings(mergedSettings)
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    } else {
      console.log('SettingsContext: No saved settings found, using defaults:', DEFAULT_SETTINGS)
    }
    setIsSettingsLoaded(true)
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
      closeSettings,
      isSettingsLoaded
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