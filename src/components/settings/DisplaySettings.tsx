import React from 'react'
import { SettingsData } from '../../types/settings'
import { 
  getResponseLengthOptions, 
  getFontFamilyOptions, 
  getReadingModeOptions,
  getExplanationStyleOptions 
} from '../../types/settings'
import styles from '../Settings.module.css'

interface DisplaySettingsProps {
  settings: SettingsData
  onSettingsChange: (settings: SettingsData) => void
}

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const responseLengthOptions = getResponseLengthOptions()
  const fontFamilyOptions = getFontFamilyOptions()
  const readingModeOptions = getReadingModeOptions()
  const explanationStyleOptions = getExplanationStyleOptions()

  return (
    <div className={styles.settingsSection}>
      <h3>Display & Reading</h3>
      
      <div className={styles.settingGroup}>
        <label htmlFor="response-length-select">Response Length:</label>
        <select
          id="response-length-select"
          value={settings.responseLength}
          onChange={(e) => onSettingsChange({
            ...settings,
            responseLength: e.target.value as any
          })}
          className={styles.select}
        >
          {responseLengthOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.settingGroup}>
        <label htmlFor="text-font-select">Text Font:</label>
        <select
          id="text-font-select"
          value={settings.textFont}
          onChange={(e) => onSettingsChange({
            ...settings,
            textFont: e.target.value as any
          })}
          className={styles.select}
        >
          {fontFamilyOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.settingGroup}>
        <label htmlFor="chat-font-select">Chat Font:</label>
        <select
          id="chat-font-select"
          value={settings.chatFont}
          onChange={(e) => onSettingsChange({
            ...settings,
            chatFont: e.target.value as any
          })}
          className={styles.select}
        >
          {fontFamilyOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.settingGroup}>
        <label htmlFor="reading-mode-select">Reading Mode:</label>
        <select
          id="reading-mode-select"
          value={settings.readingMode}
          onChange={(e) => onSettingsChange({
            ...settings,
            readingMode: e.target.value as any
          })}
          className={styles.select}
        >
          {readingModeOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.settingGroup}>
        <label htmlFor="explanation-style-select">Explanation Style:</label>
        <select
          id="explanation-style-select"
          value={settings.explanationStyle}
          onChange={(e) => onSettingsChange({
            ...settings,
            explanationStyle: e.target.value as any
          })}
          className={styles.select}
        >
          {explanationStyleOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.settingGroup}>
        <label htmlFor="text-font-size">Text Font Size: {settings.textFontSize}px</label>
        <input
          id="text-font-size"
          type="range"
          min="12"
          max="24"
          value={settings.textFontSize}
          onChange={(e) => onSettingsChange({
            ...settings,
            textFontSize: parseInt(e.target.value)
          })}
          className={styles.range}
        />
      </div>

      <div className={styles.settingGroup}>
        <label htmlFor="chat-font-size">Chat Font Size: {settings.chatFontSize}px</label>
        <input
          id="chat-font-size"
          type="range"
          min="12"
          max="20"
          value={settings.chatFontSize}
          onChange={(e) => onSettingsChange({
            ...settings,
            chatFontSize: parseInt(e.target.value)
          })}
          className={styles.range}
        />
      </div>
    </div>
  )
}
