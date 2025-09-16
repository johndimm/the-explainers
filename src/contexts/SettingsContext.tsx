'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { SettingsData, LLMProvider, LLMModel, ResponseLength, FontFamily, ReadingMode, ExplanationStyle } from '../components/Settings'
import { log } from '../utils/log'

interface SettingsContextType {
  settings: SettingsData
  updateSettings: (newSettings: SettingsData) => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

const DEFAULT_SETTINGS: SettingsData = {
  llmProvider: 'gemini',
  llmModel: 'gemini-1.5-flash',
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
  const { data: session, status } = useSession()
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Load settings from database when user is authenticated
  useEffect(() => {
    const loadSettings = async () => {
      if (status === 'loading') return
      
      if (!session?.user?.email) {
        // Not authenticated, use default settings
        return
      }

      try {
        log('SettingsContext: Loading settings from database for:', session.user.email)
        const response = await fetch('/api/user/settings')
        
        if (response.ok) {
          const dbSettings = await response.json()
          log('SettingsContext: Loaded settings from database:', dbSettings)
          
          // Convert database settings to SettingsData format
          const convertedSettings: SettingsData = {
            llmProvider: dbSettings.llm_provider as LLMProvider,
            llmModel: dbSettings.llm_model as LLMModel || 'gemini-1.5-flash', // Default if not set
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
        } else if (response.status === 404) {
          // No settings found, use defaults
          log('SettingsContext: No settings found, using defaults')
        } else {
          console.error('SettingsContext: Error loading settings:', response.statusText)
        }
      } catch (error) {
        console.error('SettingsContext: Error loading settings:', error)
      }
    }

    loadSettings()
  }, [session, status])

  // Use default settings for non-authenticated users

  const updateSettings = async (newSettings: SettingsData) => {
    console.log('SettingsContext: updateSettings called with:', newSettings)
    console.log('SettingsContext: Previous settings:', settings)
    setSettings(newSettings)
    
    // Settings saved to database only
    
    // Save to database if authenticated
    if (session?.user?.email) {
      try {
        console.log('SettingsContext: Saving to database for user:', session.user.email)
              await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
        console.log('SettingsContext: Successfully saved to database')
      } catch (error) {
        console.error('Error saving settings to database:', error)
      }
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