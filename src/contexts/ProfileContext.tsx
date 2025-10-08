'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getDeviceId } from '../utils/deviceId'
import { ProfileData, Language, EducationLevel } from '../components/Profile'
import { log } from '../utils/log'

interface ProfileContextType {
  profile: ProfileData
  isHydrated: boolean
  updateProfile: (newProfile: ProfileData) => void
  isProfileOpen: boolean
  openProfile: () => void
  closeProfile: () => void
  incrementExplanations: () => void
  canUseExplanation: (bookTitle: string, author: string, useCustomLLM: boolean) => boolean
  useExplanation: (bookTitle: string, author: string, useCustomLLM: boolean) => boolean
  getBookExplanationsUsed: (bookTitle: string, author: string) => number
  addCredits: (amount: number) => void
  purchaseBook: (bookTitle: string, author: string, url?: string) => void
  grantUnlimitedAccess: (duration: 'month') => void
  removePurchasedBook: (bookTitle: string, author: string) => void
}

const DEFAULT_PROFILE: ProfileData = {
  age: null,
  language: 'english',
  educationLevel: 'high-school',
  firstLogin: undefined,
  totalExplanations: 0,
  todayExplanations: 0,
  availableCredits: 100, // Start with 100 credits for all users
  bookExplanations: {},
  purchasedBooks: [],
  hasUnlimitedAccess: true, // All users have unlimited access
  unlimitedAccessExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

interface ProfileProviderProps {
  children: ReactNode
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Get device ID for consistency
  const userId = getDeviceId()

  useEffect(() => {
    const loadProfile = async () => {
      // Always use the default profile (no authentication required)
      log('ProfileContext: Using default profile for userId:', userId)
      setProfile(DEFAULT_PROFILE)
      setIsHydrated(true)
    }

    loadProfile()
  }, [userId])

  const updateProfile = async (newProfile: ProfileData) => {
    log('ProfileContext: updateProfile called with:', newProfile)
    setProfile(newProfile)
    
    // Save to database (simplified - just return success)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      })
      if (response.ok) {
        log('ProfileContext: Profile updated in database')
      } else {
        log('ui','ProfileContext: Failed to update profile in database')
      }
    } catch (error) {
      log('ui','ProfileContext: Error updating profile in database:', error)
    }
  }

  const incrementExplanations = async () => {
    setProfile(prev => {
      const today = new Date().toDateString()
      const lastUpdate = prev.firstLogin ? new Date(prev.firstLogin).toDateString() : today
      
      const newProfile = {
        ...prev,
        totalExplanations: (prev.totalExplanations || 0) + 1,
        todayExplanations: lastUpdate === today ? (prev.todayExplanations || 0) + 1 : 1
      }
      
      // Save to database
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      }).catch(error => log('ui','Error saving profile to database:', error))
      
      return newProfile
    })
  }

  const getBookKey = (bookTitle: string, author: string) => {
    const cleanTitle = bookTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const cleanAuthor = author.toLowerCase().replace(/[^a-z0-9]/g, '-')
    return `${cleanTitle}:${cleanAuthor}`
  }

  const canUseExplanation = (bookTitle: string, author: string, useCustomLLM: boolean) => {
    // All users have unlimited access, so always return true
    log('ProfileContext: canUseExplanation - unlimited access granted')
    return true
  }

  const useExplanation = (bookTitle: string, author: string, useCustomLLM: boolean) => {
    // All users have unlimited access, so no tracking needed
    log('ProfileContext: useExplanation - unlimited access, no tracking needed')
    return true
  }

  const getBookExplanationsUsed = (bookTitle: string, author: string) => {
    // All users have unlimited access, so return 0
    return 0
  }

  const addCredits = (amount: number) => {
    log('ProfileContext: addCredits called with amount:', amount)
    setProfile(prev => {
      const newProfile = {
        ...prev,
        availableCredits: (prev.availableCredits || 0) + amount
      }
      
      // Save to database
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      }).catch(error => log('ui','Error saving profile to database:', error))
      
      return newProfile
    })
  }

  const purchaseBook = (bookTitle: string, author: string, url?: string) => {
    setProfile(prev => {
      const bookKey = getBookKey(bookTitle, author)
      
      const details = {
        ...(prev as any).purchasedBookDetails,
        [bookKey]: { title: bookTitle, author, url }
      }
      
      const newProfile = {
        ...prev,
        purchasedBooks: Object.keys(details),
        ...(details ? { purchasedBookDetails: details } : {})
      }
      
      // Save to database
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      }).catch(error => log('ui','Error saving profile to database:', error))
      
      return newProfile
    })
  }

  const removePurchasedBook = (bookTitle: string, author: string) => {
    setProfile(prev => {
      const bookKey = getBookKey(bookTitle, author)
      const details = { ...(prev as any).purchasedBookDetails }
      if (details && details[bookKey]) {
        delete details[bookKey]
      }
      
      const newProfile = {
        ...prev,
        purchasedBooks: Object.keys(details),
        ...(details ? { purchasedBookDetails: details } : {})
      }
      
      // Save to database
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      }).catch(error => log('ui','Error saving profile to database:', error))
      
      return newProfile
    })
  }

  const grantUnlimitedAccess = (duration: 'month') => {
    // All users already have unlimited access
    log('ProfileContext: grantUnlimitedAccess - already has unlimited access')
  }

  const openProfile = () => setIsProfileOpen(true)
  const closeProfile = () => setIsProfileOpen(false)

  return (
    <ProfileContext.Provider value={{
      profile,
      isHydrated,
      updateProfile,
      isProfileOpen,
      openProfile,
      closeProfile,
      incrementExplanations,
      canUseExplanation,
      useExplanation,
      getBookExplanationsUsed,
      addCredits,
      purchaseBook,
      grantUnlimitedAccess,
      removePurchasedBook
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