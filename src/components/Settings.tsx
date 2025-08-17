'use client'

import React, { useState, useEffect } from 'react'
import styles from './Settings.module.css'

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'gemini' | 'custom'
export type ResponseLength = 'brief' | 'medium' | 'long'
export type FontFamily = 'serif' | 'sans-serif' | 'monospace'
export type ExplanationStyle = 'neutral' | 'harold-bloom' | 'carl-sagan' | 'louis-ck' | 'david-foster-wallace' | 'neil-degrasse-tyson' | 'oscar-wilde' | 'stephen-fry' | 'bill-bryson' | 'maya-angelou' | 'anthony-bourdain' | 'douglas-adams' | 'terry-pratchett' | 'joan-didion' | 'jerry-seinfeld' | 'andrew-dice-clay' | 'howard-stern' | 'tina-fey' | 'dave-chappelle' | 'amy-poehler' | 'ricky-gervais' | 'sarah-silverman' | 'john-mulaney' | 'ali-wong' | 'bo-burnham' | 'oprah-winfrey' | 'david-letterman' | 'conan-obrien' | 'stephen-colbert' | 'jimmy-fallon' | 'ellen-degeneres' | 'trevor-noah' | 'john-oliver' | 'jon-stewart' | 'david-sedaris' | 'mark-twain' | 'ts-eliot' | 'rudyard-kipling' | 'tom-wolfe' | 'flannery-oconnor' | 'humphrey-bogart' | 'anthony-jeselnik' | 'doug-stanhope' | 'jim-norton' | 'jim-jefferies' | 'daniel-tosh' | 'andy-andrist' | 'bill-burr' | 'lewis-black' | 'george-carlin' | 'sam-kinison' | 'paul-mooney' | 'bill-hicks' | 'bob-saget' | 'norm-macdonald'

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
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="neutral"
                  checked={localSettings.explanationStyle === 'neutral'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/neutral.jpg" 
                    alt="Neutral"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Neutral - Standard explanations</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="harold-bloom"
                  checked={localSettings.explanationStyle === 'harold-bloom'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/harold-bloom.jpg" 
                    alt="Harold Bloom"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Harold Bloom - Literary critic style</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="carl-sagan"
                  checked={localSettings.explanationStyle === 'carl-sagan'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/carl-sagan.jpg" 
                    alt="Carl Sagan"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Carl Sagan - Cosmic wonder and curiosity</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="louis-ck"
                  checked={localSettings.explanationStyle === 'louis-ck'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/louis-ck.jpg" 
                    alt="Louis C.K."
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Louis C.K. - Observational and conversational</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="david-foster-wallace"
                  checked={localSettings.explanationStyle === 'david-foster-wallace'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/david-foster-wallace.jpg" 
                    alt="David Foster Wallace"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>David Foster Wallace - Hyper-detailed and verbose</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="neil-degrasse-tyson"
                  checked={localSettings.explanationStyle === 'neil-degrasse-tyson'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/neil-degrasse-tyson.jpg" 
                    alt="Neil deGrasse Tyson"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Neil deGrasse Tyson - Scientific and accessible</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="oscar-wilde"
                  checked={localSettings.explanationStyle === 'oscar-wilde'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/oscar-wilde.jpg" 
                    alt="Oscar Wilde"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Oscar Wilde - Witty and paradoxical</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="stephen-fry"
                  checked={localSettings.explanationStyle === 'stephen-fry'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/stephen-fry.jpg" 
                    alt="Stephen Fry"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Stephen Fry - Erudite and charming</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="bill-bryson"
                  checked={localSettings.explanationStyle === 'bill-bryson'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/bill-bryson.jpg" 
                    alt="Bill Bryson"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Bill Bryson - Humorous and informative</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="maya-angelou"
                  checked={localSettings.explanationStyle === 'maya-angelou'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/maya-angelou.jpg" 
                    alt="Maya Angelou"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Maya Angelou - Poetic and profound</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="anthony-bourdain"
                  checked={localSettings.explanationStyle === 'anthony-bourdain'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/anthony-bourdain.jpg" 
                    alt="Anthony Bourdain"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Anthony Bourdain - Irreverent and worldly</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="douglas-adams"
                  checked={localSettings.explanationStyle === 'douglas-adams'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/douglas-adams.jpg" 
                    alt="Douglas Adams"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Douglas Adams - Absurdist and witty</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="terry-pratchett"
                  checked={localSettings.explanationStyle === 'terry-pratchett'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/terry-pratchett.jpg" 
                    alt="Terry Pratchett"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Terry Pratchett - Satirical and insightful</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="joan-didion"
                  checked={localSettings.explanationStyle === 'joan-didion'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/joan-didion.jpg" 
                    alt="Joan Didion"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Joan Didion - Precise and evocative</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="jerry-seinfeld"
                  checked={localSettings.explanationStyle === 'jerry-seinfeld'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/jerry-seinfeld.jpg" 
                    alt="Jerry Seinfeld"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Jerry Seinfeld - What's the deal with...</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="andrew-dice-clay"
                  checked={localSettings.explanationStyle === 'andrew-dice-clay'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/andrew-dice-clay.jpg" 
                    alt="Andrew Dice Clay"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Andrew Dice Clay - Edgy and brash</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="howard-stern"
                  checked={localSettings.explanationStyle === 'howard-stern'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/howard-stern.jpg" 
                    alt="Howard Stern"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Howard Stern - Provocative and unfiltered</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="tina-fey"
                  checked={localSettings.explanationStyle === 'tina-fey'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/tina-fey.jpg" 
                    alt="Tina Fey"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Tina Fey - Smart and satirical</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="dave-chappelle"
                  checked={localSettings.explanationStyle === 'dave-chappelle'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/dave-chappelle.jpg" 
                    alt="Dave Chappelle"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Dave Chappelle - Sharp social commentary</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="amy-poehler"
                  checked={localSettings.explanationStyle === 'amy-poehler'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/amy-poehler.jpg" 
                    alt="Amy Poehler"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Amy Poehler - Energetic and optimistic</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="ricky-gervais"
                  checked={localSettings.explanationStyle === 'ricky-gervais'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/ricky-gervais.jpg" 
                    alt="Ricky Gervais"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Ricky Gervais - Brutally honest and dry</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="sarah-silverman"
                  checked={localSettings.explanationStyle === 'sarah-silverman'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/sarah-silverman.jpg" 
                    alt="Sarah Silverman"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Sarah Silverman - Dark humor and irony</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="john-mulaney"
                  checked={localSettings.explanationStyle === 'john-mulaney'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/john-mulaney.jpg" 
                    alt="John Mulaney"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>John Mulaney - Storytelling and precision</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="ali-wong"
                  checked={localSettings.explanationStyle === 'ali-wong'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/ali-wong.jpg" 
                    alt="Ali Wong"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Ali Wong - Raw and unapologetic</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="bo-burnham"
                  checked={localSettings.explanationStyle === 'bo-burnham'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/bo-burnham.jpg" 
                    alt="Bo Burnham"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Bo Burnham - Meta and existential</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="oprah-winfrey"
                  checked={localSettings.explanationStyle === 'oprah-winfrey'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/oprah-winfrey.jpg" 
                    alt="Oprah Winfrey"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Oprah Winfrey - Inspiring and empathetic</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="david-letterman"
                  checked={localSettings.explanationStyle === 'david-letterman'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/david-letterman.jpg" 
                    alt="David Letterman"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>David Letterman - Ironic and gap-toothed</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="conan-obrien"
                  checked={localSettings.explanationStyle === 'conan-obrien'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/conan-obrien.jpg" 
                    alt="Conan O'Brien"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Conan O'Brien - Absurdist and Harvard smart</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="stephen-colbert"
                  checked={localSettings.explanationStyle === 'stephen-colbert'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/stephen-colbert.jpg" 
                    alt="Stephen Colbert"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Stephen Colbert - Satirical and theatrical</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="jimmy-fallon"
                  checked={localSettings.explanationStyle === 'jimmy-fallon'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/jimmy-fallon.jpg" 
                    alt="Jimmy Fallon"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Jimmy Fallon - Enthusiastic and playful</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="ellen-degeneres"
                  checked={localSettings.explanationStyle === 'ellen-degeneres'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/ellen-degeneres.jpg" 
                    alt="Ellen DeGeneres"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Ellen DeGeneres - Kind and conversational</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="trevor-noah"
                  checked={localSettings.explanationStyle === 'trevor-noah'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/trevor-noah.jpg" 
                    alt="Trevor Noah"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Trevor Noah - Global perspective and charm</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="john-oliver"
                  checked={localSettings.explanationStyle === 'john-oliver'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/john-oliver.jpg" 
                    alt="John Oliver"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>John Oliver - British wit and deep dives</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="jon-stewart"
                  checked={localSettings.explanationStyle === 'jon-stewart'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/jon-stewart.jpg" 
                    alt="Jon Stewart"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Jon Stewart - Sharp political insight</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="david-sedaris"
                  checked={localSettings.explanationStyle === 'david-sedaris'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/david-sedaris.jpg" 
                    alt="David Sedaris"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>David Sedaris - Self-deprecating and observational</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="mark-twain"
                  checked={localSettings.explanationStyle === 'mark-twain'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/mark-twain.jpg" 
                    alt="Mark Twain"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Mark Twain - Folksy wisdom and satire</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="ts-eliot"
                  checked={localSettings.explanationStyle === 'ts-eliot'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/ts-eliot.jpg" 
                    alt="T.S. Eliot"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>T.S. Eliot - Modernist and allusive</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="rudyard-kipling"
                  checked={localSettings.explanationStyle === 'rudyard-kipling'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/rudyard-kipling.jpg" 
                    alt="Rudyard Kipling"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Rudyard Kipling - Imperial and storytelling</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="tom-wolfe"
                  checked={localSettings.explanationStyle === 'tom-wolfe'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/tom-wolfe.jpg" 
                    alt="Tom Wolfe"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Tom Wolfe - New Journalism and electric prose</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="flannery-oconnor"
                  checked={localSettings.explanationStyle === 'flannery-oconnor'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/flannery-oconnor.jpg" 
                    alt="Flannery O'Connor"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Flannery O'Connor - Gothic and darkly funny</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="humphrey-bogart"
                  checked={localSettings.explanationStyle === 'humphrey-bogart'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/humphrey-bogart.jpg" 
                    alt="Humphrey Bogart"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Humphrey Bogart - Tough and world-weary</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="anthony-jeselnik"
                  checked={localSettings.explanationStyle === 'anthony-jeselnik'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/anthony-jeselnik.jpg" 
                    alt="Anthony Jeselnik"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Anthony Jeselnik - Dark and calculated</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="doug-stanhope"
                  checked={localSettings.explanationStyle === 'doug-stanhope'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/doug-stanhope.jpg" 
                    alt="Doug Stanhope"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Doug Stanhope - Nihilistic and raw</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="jim-norton"
                  checked={localSettings.explanationStyle === 'jim-norton'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/jim-norton.jpg" 
                    alt="Jim Norton"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Jim Norton - Self-loathing and confessional</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="jim-jefferies"
                  checked={localSettings.explanationStyle === 'jim-jefferies'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/jim-jefferies.jpg" 
                    alt="Jim Jefferies"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Jim Jefferies - Australian and irreverent</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="daniel-tosh"
                  checked={localSettings.explanationStyle === 'daniel-tosh'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/daniel-tosh.jpg" 
                    alt="Daniel Tosh"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Daniel Tosh - Deadpan and cutting</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="andy-andrist"
                  checked={localSettings.explanationStyle === 'andy-andrist'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/andy-andrist.jpg" 
                    alt="Andy Andrist"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Andy Andrist - Midwest deadpan</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="bill-burr"
                  checked={localSettings.explanationStyle === 'bill-burr'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/bill-burr.jpg" 
                    alt="Bill Burr"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Bill Burr - Boston rage and rants</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="lewis-black"
                  checked={localSettings.explanationStyle === 'lewis-black'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/lewis-black.jpg" 
                    alt="Lewis Black"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Lewis Black - Furious and exasperated</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="george-carlin"
                  checked={localSettings.explanationStyle === 'george-carlin'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/george-carlin.jpg" 
                    alt="George Carlin"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>George Carlin - Philosophical and subversive</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="sam-kinison"
                  checked={localSettings.explanationStyle === 'sam-kinison'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/sam-kinison.jpg" 
                    alt="Sam Kinison"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Sam Kinison - Screaming preacher energy</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="paul-mooney"
                  checked={localSettings.explanationStyle === 'paul-mooney'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/paul-mooney.jpg" 
                    alt="Paul Mooney"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Paul Mooney - Sharp social commentary</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="bill-hicks"
                  checked={localSettings.explanationStyle === 'bill-hicks'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/bill-hicks.jpg" 
                    alt="Bill Hicks"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Bill Hicks - Radical truth-telling</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="bob-saget"
                  checked={localSettings.explanationStyle === 'bob-saget'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/bob-saget.jpg" 
                    alt="Bob Saget"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Bob Saget - Clean vs dirty contrast</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="explanationStyle"
                  value="norm-macdonald"
                  checked={localSettings.explanationStyle === 'norm-macdonald'}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, explanationStyle: e.target.value as ExplanationStyle }))}
                />
                <div className={styles.explainerOption}>
                  <img 
                    src="/explainer-photos/norm-macdonald.jpg" 
                    alt="Norm MacDonald"
                    className={styles.explainerPhoto}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <span>Norm MacDonald - Deadpan anti-comedy genius</span>
                </div>
              </label>
            </div>
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
    </div>
  )
}

export default Settings