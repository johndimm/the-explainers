'use client'

import React, { useState, useEffect } from 'react'
import styles from './Settings.module.css'
import ExplainerStyles from './ExplainerStyles'

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'gemini' | 'custom'
export type ResponseLength = 'brief' | 'medium' | 'long'
export type FontFamily = 'serif' | 'sans-serif' | 'monospace'
export type ExplanationStyle = 'neutral' | 'harold-bloom' | 'carl-sagan' | 'louis-ck' | 'david-foster-wallace' | 'neil-degrasse-tyson' | 'oscar-wilde' | 'stephen-fry' | 'bill-bryson' | 'maya-angelou' | 'anthony-bourdain' | 'douglas-adams' | 'terry-pratchett' | 'joan-didion' | 'jerry-seinfeld' | 'andrew-dice-clay' | 'howard-stern' | 'tina-fey' | 'dave-chappelle' | 'amy-poehler' | 'ricky-gervais' | 'sarah-silverman' | 'john-mulaney' | 'ali-wong' | 'bo-burnham' | 'oprah-winfrey' | 'david-letterman' | 'conan-obrien' | 'stephen-colbert' | 'jimmy-fallon' | 'ellen-degeneres' | 'trevor-noah' | 'john-oliver' | 'jon-stewart' | 'david-sedaris' | 'mark-twain' | 'ts-eliot' | 'rudyard-kipling' | 'tom-wolfe' | 'flannery-oconnor' | 'humphrey-bogart' | 'anthony-jeselnik' | 'doug-stanhope' | 'jim-norton' | 'jim-jefferies' | 'daniel-tosh' | 'andy-andrist' | 'bill-burr' | 'lewis-black' | 'george-carlin' | 'sam-kinison' | 'paul-mooney' | 'bill-hicks' | 'bob-saget' | 'norm-macdonald' | 'bernard-henri-levy' | 'michel-houellebecq' | 'bill-maher' | 'john-ruskin' | 'samuel-johnson' | 'christopher-hitchens'

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

  useEffect(() => {
    setLocalSettings(settings)
    setShowCustomFields(settings.llmProvider === 'custom')
  }, [settings])

  const handleProviderChange = (provider: LLMProvider) => {
    setLocalSettings(prev => ({ ...prev, llmProvider: provider }))
    setShowCustomFields(provider === 'custom')
  }

  const handleSave = () => {
    onSettingsChange(localSettings)
    onClose()
  }

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS)
    setShowCustomFields(false)
  }

  if (!isOpen) return null

  return (
    <div className={styles.settingsOverlay}>
      <div className={styles.settingsContainer}>
        <div className={styles.settingsHeader}>
          <h2>Settings</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.settingsContent}>
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
          <div className={styles.buttonGroup}>
            <button onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSave} className={styles.saveButton}>
              Save Settings
            </button>
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