'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Settings.module.css'
import explainers from '../data/explainers.json'
import models from '../data/models.json'
import responseLengths from '../data/response-lengths.json'
import fontFamilies from '../data/font-families.json'
import readingModes from '../data/reading-modes.json'
import defaultSettings from '../data/default-settings.json'

// Derive all types from JSON data
export type LLMProvider = typeof models.providers[number]['id']
export type LLMModel = typeof models.models[keyof typeof models.models][number]['id']
export type ResponseLength = typeof responseLengths.lengths[number]['id']
export type FontFamily = typeof fontFamilies.fonts[number]['id']
export type ReadingMode = typeof readingModes.modes[number]['id']
// Derive ExplanationStyle type from the JSON data + 'neutral'
export type ExplanationStyle = 'neutral' | keyof typeof explainers.instructions

export interface SettingsData {
  llmProvider: LLMProvider
  llmModel?: LLMModel
  responseLength: ResponseLength
  textFont: FontFamily
  chatFont: FontFamily
  textFontSize: number
  chatFontSize: number
  readingMode: ReadingMode
  explanationStyle: ExplanationStyle
  customApiKey?: string
  customApiUrl?: string
  customModelName?: string
}

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  settings: SettingsData
  onSettingsChange: (settings: SettingsData) => void
}

// Use default settings from JSON data
const DEFAULT_SETTINGS: SettingsData = defaultSettings as SettingsData

// Get model options from JSON data
const getModelOptions = (provider: LLMProvider) => {
  return (models as any).models[provider] || []
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState<SettingsData>(settings)
  const [providerModels, setProviderModels] = useState<Record<LLMProvider, LLMModel>>((models as any).defaults as Record<LLMProvider, LLMModel>)

  // Get provider order from JSON data
  const allProviders: LLMProvider[] = (models as any).providers
    .sort((a: any, b: any) => a.order - b.order)
    .map((p: any) => p.id as LLMProvider)
  const [showCustomFields, setShowCustomFields] = useState(settings.llmProvider === 'custom')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('Settings: settings prop changed to:', settings)
    
    // Always migrate old Claude 3.5 Sonnet to working model
    let migratedSettings = { ...settings }
    if (settings.llmProvider === 'anthropic' && settings.llmModel === 'claude-3-5-sonnet') {
      migratedSettings.llmModel = 'claude-3-sonnet-20240229' as LLMModel
      console.log('Settings: Migrated Claude 3.5 Sonnet to Claude 3 Sonnet')
      onSettingsChange(migratedSettings)
      return // Don't set local settings yet, wait for the updated settings to come back
    }
    
    setLocalSettings(migratedSettings)
    setShowCustomFields(migratedSettings.llmProvider === 'custom')
    // Initialize mapping based on current settings
    setProviderModels(prev => ({ ...prev, [migratedSettings.llmProvider]: (migratedSettings.llmModel as LLMModel) || prev[migratedSettings.llmProvider] }))
  }, [settings, onSettingsChange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMobileMenu])

  // Auto-save when settings change
  useEffect(() => {
    if (JSON.stringify(localSettings) !== JSON.stringify(settings)) {
      console.log('Settings: Local settings changed, will auto-save in 500ms')
      console.log('Settings: Local settings:', localSettings)
      console.log('Settings: Current global settings:', settings)
      const timeoutId = setTimeout(() => {
        console.log('Settings: Auto-saving settings:', localSettings)
        onSettingsChange(localSettings)
      }, 500) // Debounce auto-save by 500ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [localSettings, settings, onSettingsChange])


  // Ensure llmModel is set when component mounts and migrate old models
  useEffect(() => {
    if (!localSettings.llmModel) {
      const defaultModel = getModelOptions(localSettings.llmProvider)[0].id as LLMModel
      setLocalSettings(prev => ({ ...prev, llmModel: defaultModel }))
    }
    
    // Force migration of old Claude 3.5 Sonnet
    if (localSettings.llmProvider === 'anthropic' && localSettings.llmModel === 'claude-3-5-sonnet') {
      const migratedModel = 'claude-3-sonnet-20240229' as LLMModel
      console.log('Settings: Force migrating Claude 3.5 Sonnet to Claude 3 Sonnet')
      setLocalSettings(prev => ({ ...prev, llmModel: migratedModel }))
      onSettingsChange({ ...localSettings, llmModel: migratedModel })
    }
    
    // Keep mapping in sync for current provider
    setProviderModels(prev => ({ ...prev, [localSettings.llmProvider]: (localSettings.llmModel || getModelOptions(localSettings.llmProvider)[0].id as LLMModel) }))
  }, [localSettings.llmProvider, localSettings.llmModel, onSettingsChange])

  // Log current provider/model selection for debugging
  useEffect(() => {
    const currentModel = providerModels[localSettings.llmProvider] || localSettings.llmModel || getModelOptions(localSettings.llmProvider)[0].id as LLMModel
    console.log('Settings selection:', { provider: localSettings.llmProvider, model: currentModel })
  }, [localSettings.llmProvider, localSettings.llmModel, providerModels])

  // Ensure every provider always has a valid selected model in state/localStorage
  useEffect(() => {
    let changed = false
    const fixed: Record<LLMProvider, LLMModel> = { ...providerModels }
    for (const p of allProviders) {
      const options = getModelOptions(p).map((o: any) => o.id as LLMModel)
      if (!fixed[p] || !options.includes(fixed[p])) {
        fixed[p] = getModelOptions(p)[0].id as LLMModel
        changed = true
      }
    }
    if (changed) {
      setProviderModels(fixed)
    }
  }, [providerModels])


  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS)
    setShowCustomFields(false)
  }

  if (!isOpen) return null

  return (
    <div>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '8px 12px',
        zIndex: 100,
        display: 'none',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#333',
            lineHeight: '1.2'
          }}>
            The Explainers
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '11px', 
            color: '#666',
            fontStyle: 'italic',
            lineHeight: '1.2'
          }}>
            understand difficult texts
          </p>
        </div>
        {/* Hamburger menu for all devices */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#333'
            }}
          >
            ☰
          </button>
          
          {showMobileMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '160px',
              zIndex: 1000
            }}>
              <button 
                onClick={() => {
                  router.push('/guide')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📖 User Guide
              </button>
              <button 
                onClick={() => {
                  router.push('/about')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                ℹ️ About
              </button>
              <button 
                onClick={() => {
                  router.push('/reader')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📖 Reader
              </button>
              <button 
                onClick={() => {
                  router.push('/chat')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                💬 Chat
              </button>
              <button 
                onClick={() => {
                  router.push('/library')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📚 Library
              </button>
              <button 
                onClick={() => {
                  router.push('/explainers')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                🎭 Styles
              </button>
              <button 
                onClick={() => {
                  router.push('/credits')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                💳 Credits
              </button>
              <button 
                onClick={() => {
                  router.push('/profile')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                👤 Profile
              </button>
              <button 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ⚙️ Settings (current)
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div style={{ marginTop: '60px' }}>
        <div className={styles.settingsContainer} style={{ margin: '20px auto', maxWidth: '600px', boxShadow: 'none', border: 'none', position: 'static', transform: 'none', overflow: 'visible', maxHeight: 'none' }}>
          <div className="card">
            <div className="card-body">
              <h1 className="page-title">
                Settings
              </h1>
              <p className="page-subtitle">
                Configure your AI explanation preferences
              </p>
            </div>
          </div>

        <div className={styles.settingsContent}>
          {/* Default Provider selection */}
          <div className={styles.settingGroup}>
            <h3>Default Provider</h3>
            <div className={styles.radioGroup}>
              {allProviders.map((provider) => (
                <label key={`provider-${provider}`} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="defaultProvider"
                    value={provider}
                    checked={localSettings.llmProvider === provider}
                    onChange={() => {
                      const nextModel = providerModels[provider] || getModelOptions(provider)[0].id as LLMModel
                      setLocalSettings(prev => ({ ...prev, llmProvider: provider, llmModel: nextModel }))
                      setShowCustomFields(provider === 'custom')
                    }}
                  />
                  <span>
                    {provider === 'gemini' ? 'Google Gemini' :
                     provider === 'anthropic' ? 'Anthropic Claude' :
                     provider === 'openai' ? 'OpenAI' :
                     provider === 'deepseek' ? 'DeepSeek' :
                     'Custom (BYO LLM)'}
                    {provider !== 'custom' && (
                      <span style={{ color: '#666', marginLeft: 8 }}>
                        – {getModelOptions(provider).find((m: any) => m.id === providerModels[provider])?.name || getModelOptions(provider)[0].name}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <h3>Language Model</h3>
            <div className={styles.radioGroup}>
              {allProviders.map((provider) => {
                const models = getModelOptions(provider)
                return (
                <div key={provider}>
                  {/* Provider Header */}
                  <div style={{ 
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '16px'
                  }}>
                    {provider === 'openai' ? 'OpenAI' :
                     provider === 'anthropic' ? 'Anthropic Claude' :
                     provider === 'deepseek' ? 'DeepSeek' :
                     provider === 'gemini' ? 'Google Gemini' :
                     'Bring Your Own LLM (BYOLLM)'}
                    {provider !== 'custom' && (
                      <span style={{ color: '#666', marginLeft: 8 }}>
                        – {(() => {
                          const p = provider as LLMProvider
                          const selected = providerModels[p] || getModelOptions(p)[0].id as LLMModel
                          return getModelOptions(p).find((m: any) => m.id === selected)?.name || getModelOptions(p)[0].name
                        })()}
                      </span>
                    )}
                  </div>
                  
                  {/* Models under this provider */}
                  <div style={{ marginLeft: '20px', marginBottom: '16px' }}>
                    {models.map((option: any) => (
                      <label key={option.id} className={styles.radioLabel}>
                        <input
                          type="radio"
                          name={`llmSelection-${provider}`}
                          value={`${provider}-${option.id}`}
                          checked={(providerModels[provider as LLMProvider] || getModelOptions(provider as LLMProvider)[0].id as LLMModel) === option.id}
                            onChange={() => {
                              // Update provider-specific default without switching default provider
                              const p = provider as LLMProvider
                              setProviderModels(prev => {
                                const updated = { ...prev, [p]: option.id as LLMModel }
                                return updated
                              })
                              // If this provider is currently selected as default, sync llmModel
                              if (localSettings.llmProvider === provider) {
                                setLocalSettings(prev => ({ ...prev, llmModel: option.id as LLMModel }))
                              }
                              setShowCustomFields(provider === 'custom')
                            }}
                        />
                        <span>
                          {option.name}
                          {option.description && (
                            <span style={{ color: '#666', fontSize: '14px', marginLeft: '8px' }}>
                              - {option.description}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )})}
            </div>

            {showCustomFields && (
              <div className={styles.customFields}>
                <div className={styles.inputGroup}>
                  <label>API Key:</label>
                  <input
                    type="password"
                    value={localSettings.customApiKey || ''}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, customApiKey: e.target.value }))}
                    placeholder="Enter your API key"
                    className={styles.textInput}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>API URL:</label>
                  <input
                    type="text"
                    value={localSettings.customApiUrl || ''}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, customApiUrl: e.target.value }))}
                    placeholder="e.g., https://api.openai.com/v1"
                    className={styles.textInput}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Model Name:</label>
                  <input
                    type="text"
                    value={localSettings.customModelName || ''}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, customModelName: e.target.value }))}
                    placeholder="e.g., gpt-4, claude-3-opus"
                    className={styles.textInput}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.settingGroup}>
            <h3>Response Length</h3>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="responseLength"
                  value="brief"
                  checked={localSettings.responseLength === 'brief'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, responseLength: e.target.value as ResponseLength }))}
                />
                <span>Brief - Quick explanations</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="responseLength"
                  value="medium"
                  checked={localSettings.responseLength === 'medium'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, responseLength: e.target.value as ResponseLength }))}
                />
                <span>Medium - Balanced detail</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="responseLength"
                  value="long"
                  checked={localSettings.responseLength === 'long'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, responseLength: e.target.value as ResponseLength }))}
                />
                <span>Long - Detailed explanations</span>
              </label>
            </div>
          </div>

          <div className={styles.settingGroup}>
            <h3>Text Reader Font</h3>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="textFont"
                  value="serif"
                  checked={localSettings.textFont === 'serif'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, textFont: e.target.value as FontFamily }))}
                />
                <span style={{ fontFamily: 'serif' }}>Serif - Traditional reading</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="textFont"
                  value="sans-serif"
                  checked={localSettings.textFont === 'sans-serif'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, textFont: e.target.value as FontFamily }))}
                />
                <span style={{ fontFamily: 'sans-serif' }}>Sans-serif - Modern</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="textFont"
                  value="monospace"
                  checked={localSettings.textFont === 'monospace'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, textFont: e.target.value as FontFamily }))}
                />
                <span style={{ fontFamily: 'monospace' }}>Monospace - Fixed width</span>
              </label>
            </div>
          </div>

          <div className={styles.settingGroup}>
            <h3>Text Reader Font Size</h3>
            <div className={styles.rangeGroup}>
              <label className={styles.rangeLabel}>
                <span>Font Size: {localSettings.textFontSize}px</span>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={localSettings.textFontSize}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, textFontSize: parseInt(e.target.value) }))}
                  className={styles.rangeInput}
                />
                <div className={styles.rangeLabels}>
                  <span>12px</span>
                  <span>24px</span>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.settingGroup}>
            <h3>Chat Font Size</h3>
            <div className={styles.rangeGroup}>
              <label className={styles.rangeLabel}>
                <span>Font Size: {localSettings.chatFontSize}px</span>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={localSettings.chatFontSize}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, chatFontSize: parseInt(e.target.value) }))}
                  className={styles.rangeInput}
                />
                <div className={styles.rangeLabels}>
                  <span>12px</span>
                  <span>20px</span>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.settingGroup}>
            <h3>Reading Mode</h3>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="readingMode"
                  value="scroll"
                  checked={localSettings.readingMode === 'scroll'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, readingMode: e.target.value as ReadingMode }))}
                />
                <span>📜 Scroll - Continuous scrolling document</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="readingMode"
                  value="page"
                  checked={localSettings.readingMode === 'page'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, readingMode: e.target.value as ReadingMode }))}
                />
                <span>📖 Page - Kindle-like page-by-page reading</span>
              </label>
            </div>
          </div>

          <div className={styles.settingGroup}>
            <h3>Chat Font</h3>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="chatFont"
                  value="serif"
                  checked={localSettings.chatFont === 'serif'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, chatFont: e.target.value as FontFamily }))}
                />
                <span style={{ fontFamily: 'serif' }}>Serif</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="chatFont"
                  value="sans-serif"
                  checked={localSettings.chatFont === 'sans-serif'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, chatFont: e.target.value as FontFamily }))}
                />
                <span style={{ fontFamily: 'sans-serif' }}>Sans-serif</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="chatFont"
                  value="monospace"
                  checked={localSettings.chatFont === 'monospace'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, chatFont: e.target.value as FontFamily }))}
                />
                <span style={{ fontFamily: 'monospace' }}>Monospace</span>
              </label>
            </div>
          </div>

        </div>

        <div className={styles.settingsFooter}>
          <button onClick={handleReset} className={styles.resetButton}>
            Reset to Defaults
          </button>
          <button 
            onClick={() => window.open('/clear-cache.html', '_blank')}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: '10px'
            }}
          >
            Clear Cache
          </button>
          <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', padding: '16px' }}>
            Changes are saved automatically
          </div>
        </div>
        </div>
      </div>
      
    </div>
  )
}

export default Settings
