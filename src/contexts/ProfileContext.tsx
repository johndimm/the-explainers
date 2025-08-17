'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ProfileData, Language, EducationLevel } from '../components/Profile'

interface ProfileContextType {
  profile: ProfileData
  updateProfile: (newProfile: ProfileData) => void
  isProfileOpen: boolean
  openProfile: () => void
  closeProfile: () => void
  incrementExplanations: () => void
}

const DEFAULT_PROFILE: ProfileData = {
  age: null,
  language: 'english',
  educationLevel: 'high-school',
  firstLogin: new Date(),
  totalExplanations: 0,
  todayExplanations: 0,
  availableCredits: 3
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

interface ProfileProviderProps {
  children: ReactNode
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => {
    const savedProfile = localStorage.getItem('explainer-profile')
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        // Convert date strings back to Date objects
        if (parsed.firstLogin) {
          parsed.firstLogin = new Date(parsed.firstLogin)
        }
        setProfile({ ...DEFAULT_PROFILE, ...parsed })
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    } else {
      // First time user - set first login date
      const newProfile = { ...DEFAULT_PROFILE, firstLogin: new Date() }
      setProfile(newProfile)
      localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
    }
  }, [])

  const updateProfile = (newProfile: ProfileData) => {
    setProfile(newProfile)
    localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
  }

  const incrementExplanations = () => {
    setProfile(prev => {
      const today = new Date().toDateString()
      const lastUpdate = prev.firstLogin ? new Date(prev.firstLogin).toDateString() : today
      
      const newProfile = {
        ...prev,
        totalExplanations: (prev.totalExplanations || 0) + 1,
        todayExplanations: lastUpdate === today ? (prev.todayExplanations || 0) + 1 : 1
      }
      
      localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
      return newProfile
    })
  }

  const openProfile = () => setIsProfileOpen(true)
  const closeProfile = () => setIsProfileOpen(false)

  return (
    <ProfileContext.Provider value={{
      profile,
      updateProfile,
      isProfileOpen,
      openProfile,
      closeProfile,
      incrementExplanations
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}