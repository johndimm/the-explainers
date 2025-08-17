'use client'

import React, { useState } from 'react'
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

  if (!isOpen) return null

  const handleSave = () => {
    onProfileChange(localProfile)
    onClose()
  }

  const handleCancel = () => {
    setLocalProfile(profile)
    onClose()
  }

  const updateField = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Profile Settings</h2>
          <button onClick={handleCancel} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Usage & Credits</h3>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                    {profile.availableCredits || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Available Credits</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                    {profile.totalExplanations || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Total Explanations</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {profile.todayExplanations || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Today</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                    {profile.purchasedBooks?.length || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Books Owned</div>
                </div>
              </div>
              
              {profile.firstLogin && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                  Member since: {new Date(profile.firstLogin).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

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
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={localProfile.language}
                onChange={(e) => updateField('language', e.target.value as Language)}
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
          <button onClick={handleCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveButton}>
            Save Profile
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile