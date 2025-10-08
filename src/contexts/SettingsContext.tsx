'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getDeviceId } from '../utils/deviceId'
import { SettingsData, LLMProvider, LLMModel, ResponseLength, FontFamily, ReadingMode, ExplanationStyle } from '../components/Settings'
import { log } from '../utils/log'
import models from '../data/models.json'

interface SettingsContextType {
  settings: SettingsData
  updateSettings: (newSettings: SettingsData) => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

const DEFAULT_SETTINGS: SettingsData = {
  llmProvider: 'gemini',
  llmModel: (models as any).defaults.gemini,
  responseLength: 'brief',
  textFont: 'serif',
  chatFont: 'sans-serif',
  textFontSize: 18,
  chatFontSize: 16,
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
  
  // Get device ID for API calls
  const userId = getDeviceId()

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        log('SettingsContext: Loading settings from database for userId:', userId)
        const response = await fetch(`/api/user/settings?userId=${encodeURIComponent(userId)}`)
        
        if (response.ok) {
          const dbSettings = await response.json()
          log('SettingsContext: Loaded settings from database:', dbSettings)
          
          // Convert database settings to SettingsData format
          const convertedSettings: SettingsData = {
            llmProvider: dbSettings.llm_provider as LLMProvider,
            llmModel: dbSettings.llm_model as LLMModel || (models as any).defaults.gemini,
            responseLength: dbSettings.response_length as ResponseLength,
            textFont: dbSettings.text_font as FontFamily,
            chatFont: dbSettings.chat_font as FontFamily,
            textFontSize: dbSettings.text_font_size || 18,
            chatFontSize: dbSettings.chat_font_size || 16,
            readingMode: dbSettings.reading_mode as ReadingMode,
            explanationStyle: dbSettings.explanation_style as ExplanationStyle,
            customApiKey: dbSettings.custom_api_key,
            customApiUrl: dbSettings.custom_api_url,
            customModelName: dbSettings.custom_model_name
          }
          
          setSettings(convertedSettings)
        } else {
          log('SettingsContext: Using default settings')
        }
      } catch (error) {
        log('ui','SettingsContext: Error loading settings:', error)
      }
    }

    loadSettings()
  }, [userId])

  const updateSettings = async (newSettings: SettingsData) => {
    log('ui','SettingsContext: updateSettings called with:', newSettings)
    setSettings(newSettings)
    
    // Save to database
    try {
      log('ui','SettingsContext: Saving to database for userId:', userId)
      await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          llm_provider: newSettings.llmProvider,
          llm_model: newSettings.llmModel,
          response_length: newSettings.responseLength,
          text_font: newSettings.textFont,
          chat_font: newSettings.chatFont,
          text_font_size: newSettings.textFontSize,
          chat_font_size: newSettings.chatFontSize,
          reading_mode: newSettings.readingMode,
          explanation_style: newSettings.explanationStyle,
          custom_api_key: newSettings.customApiKey,
          custom_api_url: newSettings.customApiUrl,
          custom_model_name: newSettings.customModelName
        })
      })
      log('ui','SettingsContext: Successfully saved to database')
    } catch (error) {
      log('ui','Error saving settings to database:', error)
    }
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