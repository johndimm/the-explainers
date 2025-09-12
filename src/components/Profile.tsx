'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Profile.module.css'
import { log } from '../utils/log'

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
  purchasedBookDetails?: { [bookKey: string]: { title: string; author: string } }
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
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Sync localProfile when profile prop changes (e.g., when restored from localStorage)
  useEffect(() => {
    log('Profile: Syncing localProfile with profile prop:', profile)
    setIsSyncing(true)
    setLocalProfile(profile)
    // Reset syncing flag after a short delay
    setTimeout(() => setIsSyncing(false), 100)
  }, [profile])

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

  // Auto-save when profile changes (but only for user-initiated changes)
  useEffect(() => {
    // Don't auto-save when syncing with restored profile
    if (isSyncing) {
      log('Profile: Skipping auto-save during sync')
      return
    }
    
    if (JSON.stringify(localProfile) !== JSON.stringify(profile)) {
      log('Profile changes detected, auto-saving...', localProfile)
      const timeoutId = setTimeout(() => {
        onProfileChange(localProfile)
        log('Profile saved to localStorage')
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
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  color: '#666'
                }}
              >
                👤 Profile (current)
              </button>
              <button 
                onClick={() => {
                  router.push('/settings')
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
                ⚙️ Settings
              </button>
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
                  cursor: 'pointer'
                }}
              >
                ℹ️ About
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div style={{ marginTop: '60px' }}>
        <div className={styles.modal} style={{ margin: '20px auto', maxWidth: '600px', boxShadow: 'none', border: 'none', position: 'static', transform: 'none', overflow: 'visible', maxHeight: 'none' }}>
          <div className="card">
            <div className="card-body">
              <h1 className="page-title">
                Profile
              </h1>
              <p className="page-subtitle">
                Set your preferences for personalized explanations
              </p>
            </div>
          </div>

        <div className={styles.content}>

          <div className={styles.section}>
            
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
    </div>
  )
}

export default Profile