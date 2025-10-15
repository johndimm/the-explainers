'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Settings.module.css'
import { ProviderSettings } from './settings/ProviderSettings'
import { DisplaySettings } from './settings/DisplaySettings'
import { SettingsProps, DEFAULT_SETTINGS } from '../types/settings'
import { log } from '../utils/log'

const Settings: React.FC<SettingsProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange 
}) => {
  const [localSettings, setLocalSettings] = useState(settings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setLocalSettings(settings)
    setHasUnsavedChanges(false)
  }, [settings, isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleLocalSettingsChange = (newSettings: typeof localSettings) => {
    setLocalSettings(newSettings)
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    try {
      log('settings', 'Saving settings:', localSettings)
      onSettingsChange(localSettings)
      setHasUnsavedChanges(false)
      onClose()
    } catch (error) {
      log('error', 'Failed to save settings:', error)
    }
  }

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS)
    setHasUnsavedChanges(true)
  }

  const handleCancel = () => {
    setLocalSettings(settings)
    setHasUnsavedChanges(false)
    onClose()
  }

  const handleProfile = () => {
    router.push('/profile')
  }

  if (!isOpen) return null

  return (
    <div className={styles.settingsOverlay}>
      <div className={styles.settingsModal} ref={settingsRef}>
        <div className={styles.settingsHeader}>
          <h2>Settings</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.settingsContent}>
          <ProviderSettings
            settings={localSettings}
            onSettingsChange={handleLocalSettingsChange}
          />

          <DisplaySettings
            settings={localSettings}
            onSettingsChange={handleLocalSettingsChange}
          />
        </div>

        <div className={styles.settingsFooter}>
          <div className={styles.footerLeft}>
            <button onClick={handleProfile} className={styles.profileButton}>
              Profile
            </button>
            <button onClick={handleReset} className={styles.resetButton}>
              Reset to Defaults
            </button>
          </div>
          
          <div className={styles.footerRight}>
            <button onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className={styles.saveButton}
              disabled={!hasUnsavedChanges}
            >
              {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

// Re-export types for backward compatibility
export type { 
  SettingsData, 
  LLMProvider, 
  LLMModel, 
  ResponseLength, 
  FontFamily, 
  ReadingMode, 
  ExplanationStyle 
} from '../types/settings'