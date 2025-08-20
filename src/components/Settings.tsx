'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Settings.module.css'
import ExplainerStyles from './ExplainerStyles'

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'gemini' | 'custom'
export type ResponseLength = 'brief' | 'medium' | 'long'
export type FontFamily = 'serif' | 'sans-serif' | 'monospace'
export type ExplanationStyle = 'neutral' | 'harold-bloom' | 'carl-sagan' | 'louis-ck' | 'david-foster-wallace' | 'neil-degrasse-tyson' | 'oscar-wilde' | 'stephen-fry' | 'bill-bryson' | 'maya-angelou' | 'anthony-bourdain' | 'douglas-adams' | 'terry-pratchett' | 'joan-didion' | 'jerry-seinfeld' | 'andrew-dice-clay' | 'howard-stern' | 'tina-fey' | 'dave-chappelle' | 'amy-poehler' | 'ricky-gervais' | 'sarah-silverman' | 'john-mulaney' | 'ali-wong' | 'bo-burnham' | 'oprah-winfrey' | 'david-letterman' | 'conan-obrien' | 'stephen-colbert' | 'jimmy-fallon' | 'ellen-degeneres' | 'trevor-noah' | 'john-oliver' | 'jon-stewart' | 'david-sedaris' | 'mark-twain' | 'ts-eliot' | 'rudyard-kipling' | 'tom-wolfe' | 'flannery-oconnor' | 'humphrey-bogart' | 'anthony-jeselnik' | 'doug-stanhope' | 'jim-norton' | 'jim-jefferies' | 'daniel-tosh' | 'andy-andrist' | 'bill-burr' | 'lewis-black' | 'george-carlin' | 'sam-kinison' | 'paul-mooney' | 'bill-hicks' | 'bob-saget' | 'norm-macdonald' | 'bernard-henri-levy' | 'michel-houellebecq' | 'bill-maher' | 'john-ruskin' | 'samuel-johnson' | 'christopher-hitchens' | 'christopher-marlowe' | 'ben-jonson' | 'francis-bacon' | 'charles-dickens' | 'cormac-mccarthy'

export interface SettingsData {
  llmProvider: LLMProvider
  responseLength: ResponseLength
  textFont: FontFamily
  chatFont: FontFamily
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

const DEFAULT_SETTINGS: SettingsData = {
  llmProvider: 'openai',
  responseLength: 'medium',
  textFont: 'serif',
  chatFont: 'sans-serif',
  explanationStyle: 'neutral'
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState<SettingsData>(settings)
  const [showCustomFields, setShowCustomFields] = useState(settings.llmProvider === 'custom')
  const [showExplainerStyles, setShowExplainerStyles] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setLocalSettings(settings)
    setShowCustomFields(settings.llmProvider === 'custom')
  }, [settings])

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
      const timeoutId = setTimeout(() => {
        onSettingsChange(localSettings)
      }, 500) // Debounce auto-save by 500ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [localSettings, settings, onSettingsChange])

  const handleProviderChange = (provider: LLMProvider) => {
    setLocalSettings(prev => ({ ...prev, llmProvider: provider }))
    setShowCustomFields(provider === 'custom')
  }


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
        display: 'flex',
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
                  router.push('/styles')
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
      
      <div style={{ marginTop: '50px' }}>
        <div className={styles.settingsContainer} style={{ margin: '20px auto', maxWidth: '600px', boxShadow: 'none', border: 'none', overflow: 'visible', maxHeight: 'none' }}>
          <div className={styles.settingsHeader}>
            <h2>Settings</h2>
          </div>

        <div className={styles.settingsContent} style={{ overflow: 'visible', maxHeight: 'none' }}>
          <div className={styles.settingGroup}>
            <h3>Language Model</h3>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="llmProvider"
                  value="openai"
                  checked={localSettings.llmProvider === 'openai'}
                  onChange={() => handleProviderChange('openai')}
                />
                <span>GPT-4 (OpenAI) - Default</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="llmProvider"
                  value="anthropic"
                  checked={localSettings.llmProvider === 'anthropic'}
                  onChange={() => handleProviderChange('anthropic')}
                />
                <span>Claude (Anthropic)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="llmProvider"
                  value="deepseek"
                  checked={localSettings.llmProvider === 'deepseek'}
                  onChange={() => handleProviderChange('deepseek')}
                />
                <span>DeepSeek</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="llmProvider"
                  value="gemini"
                  checked={localSettings.llmProvider === 'gemini'}
                  onChange={() => handleProviderChange('gemini')}
                />
                <span>Gemini (Google)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="llmProvider"
                  value="custom"
                  checked={localSettings.llmProvider === 'custom'}
                  onChange={() => handleProviderChange('custom')}
                />
                <span>Bring Your Own LLM (BYOLLM)</span>
              </label>
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

          <div className={styles.settingGroup}>
            <h3>Explanation Style</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              Choose how explanations are delivered - from neutral to various personality styles.
            </p>
            <button
              onClick={() => setShowExplainerStyles(true)}
              style={{
                padding: '12px 20px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Current: {localSettings.explanationStyle === 'neutral' ? 'Neutral' : 
                localSettings.explanationStyle.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <div className={styles.settingsFooter}>
          <button onClick={handleReset} className={styles.resetButton}>
            Reset to Defaults
          </button>
          <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', padding: '16px' }}>
            Changes are saved automatically
          </div>
        </div>
        </div>
      </div>
      
      <ExplainerStyles
        isOpen={showExplainerStyles}
        onClose={() => setShowExplainerStyles(false)}
        selectedStyle={localSettings.explanationStyle}
        onStyleChange={(style) => setLocalSettings(prev => ({ ...prev, explanationStyle: style }))}
      />
    </div>
  )
}

export default Settings