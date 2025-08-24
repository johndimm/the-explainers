'use client'

import React, { useState, useEffect } from 'react'
import styles from './Profile.module.css'

export type EducationLevel = 'elementary' | 'middle-school' | 'high-school' | 'college' | 'graduate'
export type Language = 'english' | 'spanish' | 'french' | 'german' | 'italian' | 'portuguese' | 'chinese' | 'japanese' | 'korean' | 'arabic' | 'hindi' | 'russian'

export interface ProfileData {
  age: number | null
  language: Language
  educationLevel: EducationLevel
  firstLogin?: Date
  totalExplanations?: number
  todayExplanations?: number
  availableCredits?: number
  bookExplanations?: { [bookKey: string]: number }
  purchasedBooks?: string[]
  hasUnlimitedAccess?: boolean
  unlimitedAccessExpiry?: Date
}

interface ProfileProps {
  isOpen: boolean
  onClose: () => void
  profile: ProfileData
  onProfileChange: (profile: ProfileData) => void
}

const Profile: React.FC<ProfileProps> = ({ isOpen, onClose, profile, onProfileChange }) => {
  const [localProfile, setLocalProfile] = useState<ProfileData>(profile)
  const [isSyncing, setIsSyncing] = useState(false)

  // Sync localProfile when profile prop changes (e.g., when restored from localStorage)
  useEffect(() => {
    console.log('Profile: Syncing localProfile with profile prop:', profile)
    setIsSyncing(true)
    setLocalProfile(profile)
    // Reset syncing flag after a short delay
    setTimeout(() => setIsSyncing(false), 100)
  }, [profile])


  // Auto-save when profile changes (but only for user-initiated changes)
  useEffect(() => {
    // Don't auto-save when syncing with restored profile
    if (isSyncing) {
      console.log('Profile: Skipping auto-save during sync')
      return
    }
    
    if (JSON.stringify(localProfile) !== JSON.stringify(profile)) {
      console.log('Profile changes detected, auto-saving...', localProfile)
      const timeoutId = setTimeout(() => {
        onProfileChange(localProfile)
        console.log('Profile saved to localStorage')
      }, 500) // Debounce auto-save by 500ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [localProfile, profile, onProfileChange, isSyncing])

  if (!isOpen) return null

  const handleCancel = () => {
    setLocalProfile(profile)
    onClose()
  }

  const updateField = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div style={{ padding: '20px' }}>
        <div className={styles.modal} style={{ margin: '0', maxWidth: 'none', boxShadow: 'none', border: 'none', position: 'static', transform: 'none', overflow: 'visible', maxHeight: 'none' }}>
          <div className={styles.header}>
            <h2>Profile Settings</h2>
          </div>

        <div className={styles.content}>

          <div className={styles.section}>
            <h3>Personal Information</h3>
            <p className={styles.subtitle}>Help us customize explanations for your needs</p>
            
            <div className={styles.field}>
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                min="1"
                max="120"
                value={localProfile.age || ''}
                onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Enter your age"
                className={styles.field}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={localProfile.language}
                onChange={(e) => updateField('language', e.target.value as Language)}
                className={styles.field}
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="italian">Italian</option>
                <option value="portuguese">Portuguese</option>
                <option value="chinese">Chinese</option>
                <option value="japanese">Japanese</option>
                <option value="korean">Korean</option>
                <option value="arabic">Arabic</option>
                <option value="hindi">Hindi</option>
                <option value="russian">Russian</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="education">Education Level</label>
              <select
                id="education"
                value={localProfile.educationLevel}
                onChange={(e) => updateField('educationLevel', e.target.value as EducationLevel)}
                className={styles.field}
              >
                <option value="elementary">Elementary School</option>
                <option value="middle-school">Middle School</option>
                <option value="high-school">High School</option>
                <option value="college">College</option>
                <option value="graduate">Graduate School</option>
              </select>
            </div>
          </div>

        </div>

        <div className={styles.footer}>
          <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', padding: '16px' }}>
            Changes are saved automatically
          </div>
        </div>
        </div>
    </div>
  )
}

export default Profile