'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ProfileData, Language, EducationLevel } from '../components/Profile'
import { debugProfile, debugCredits, debugStorage } from '../utils/debug'

interface ProfileContextType {
  profile: ProfileData
  updateProfile: (newProfile: ProfileData) => void
  isProfileOpen: boolean
  openProfile: () => void
  closeProfile: () => void
  incrementExplanations: () => void
  canUseExplanation: (bookTitle: string, author: string, useCustomLLM: boolean) => boolean
  useExplanation: (bookTitle: string, author: string, useCustomLLM: boolean) => boolean
  getBookExplanationsUsed: (bookTitle: string, author: string) => number
  addCredits: (amount: number) => void
  purchaseBook: (bookTitle: string, author: string) => void
  grantUnlimitedAccess: (duration: 'hour' | 'month' | 'year') => void
}

const DEFAULT_PROFILE: ProfileData = {
  age: null,
  language: 'english',
  educationLevel: 'high-school',
  firstLogin: undefined,
  totalExplanations: 0,
  todayExplanations: 0,
  availableCredits: 5,
  bookExplanations: {},
  purchasedBooks: [],
  hasUnlimitedAccess: false,
  unlimitedAccessExpiry: undefined
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

interface ProfileProviderProps {
  children: ReactNode
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated and only then access localStorage
    setIsHydrated(true)
    const savedProfile = localStorage.getItem('explainer-profile')
    debugProfile(' Loading profile from localStorage:', savedProfile)
    
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        debugProfile(' Parsed saved profile:', parsed)
        // Convert date strings back to Date objects
        if (parsed.firstLogin) {
          parsed.firstLogin = new Date(parsed.firstLogin)
        }
        if (parsed.unlimitedAccessExpiry) {
          parsed.unlimitedAccessExpiry = new Date(parsed.unlimitedAccessExpiry)
          debugProfile(' Converted unlimitedAccessExpiry to Date object:', parsed.unlimitedAccessExpiry)
        }
        let restoredProfile = { ...DEFAULT_PROFILE, ...parsed }
        debugProfile(' Final restored profile:', restoredProfile)
        
        // Migration: Reset credits for users who had the old 100 credit default
        // Handle users with 100 credits (unused) or 97-99 credits (used some)
        // But don't migrate users who have purchased credits (105+ suggests they bought 100 credits)
        if (restoredProfile.availableCredits && restoredProfile.availableCredits >= 95 && restoredProfile.availableCredits <= 100) {
          console.log(`ProfileContext: Migrating user from ${restoredProfile.availableCredits} to 5 credits`)
          restoredProfile.availableCredits = 5
          // Save the migrated profile
          localStorage.setItem('explainer-profile', JSON.stringify(restoredProfile))
        }
        
        debugProfile(' Restoring profile:', restoredProfile)
        setProfile(restoredProfile)
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    } else {
      // First time user - set first login date
      debugProfile(' No saved profile found, creating new one')
      const newProfile = { ...DEFAULT_PROFILE, firstLogin: new Date() }
      setProfile(newProfile)
      localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
    }
  }, [])

  const updateProfile = (newProfile: ProfileData) => {
    debugProfile(' updateProfile called with:', newProfile)
    debugProfile(' Current profile before update:', profile)
    setProfile(newProfile)
    localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
    debugProfile(' Profile updated in localStorage')
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

  const getBookKey = (bookTitle: string, author: string) => {
    return `${bookTitle}-${author}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  }

  const canUseExplanation = (bookTitle: string, author: string, useCustomLLM: boolean) => {
    debugProfile(' canUseExplanation called for:', bookTitle, 'by', author)
    debugProfile(' useCustomLLM:', useCustomLLM)
    debugProfile(' current profile:', profile)
    
    // Free if using custom LLM
    if (useCustomLLM) {
      debugProfile(' using custom LLM - access granted')
      return true
    }
    
    // Free if has unlimited access
    if (profile.hasUnlimitedAccess && profile.unlimitedAccessExpiry) {
      const now = new Date()
      // Ensure expiry is a Date object (defensive programming)
      const expiry = profile.unlimitedAccessExpiry instanceof Date 
        ? profile.unlimitedAccessExpiry 
        : new Date(profile.unlimitedAccessExpiry)
      
      debugProfile(' checking unlimited access - now:', now, 'expiry:', expiry)
      debugProfile(' hasUnlimitedAccess:', profile.hasUnlimitedAccess)
      debugProfile(' expiry type:', typeof profile.unlimitedAccessExpiry)
      debugProfile(' expiry instanceof Date:', profile.unlimitedAccessExpiry instanceof Date)
      debugProfile(' access expired?', now >= expiry)
      
      if (now < expiry) {
        debugProfile(' unlimited access valid - access granted')
        return true
      } else {
        debugProfile(' unlimited access expired')
      }
    } else {
      debugProfile(' no unlimited access or no expiry date')
    }
    
    const bookKey = getBookKey(bookTitle, author)
    debugProfile(' bookKey:', bookKey)
    
    // Free if book is purchased
    if (profile.purchasedBooks?.includes(bookKey)) {
      debugProfile(' book purchased - access granted')
      return true
    }
    
    // Check if under 3 free explanations for this book
    const bookExplanations = profile.bookExplanations?.[bookKey] || 0
    debugProfile(' book explanations used:', bookExplanations)
    if (bookExplanations < 3) {
      debugProfile(' under 3 free explanations - access granted')
      return true
    }
    
    // Check if has available credits
    const hasCredits = (profile.availableCredits || 0) > 0
    debugProfile(' available credits:', profile.availableCredits, 'has credits:', hasCredits)
    if (hasCredits) {
      debugProfile(' has credits - access granted')
    } else {
      debugProfile(' no credits - access denied')
    }
    return hasCredits
  }

  const useExplanation = (bookTitle: string, author: string, useCustomLLM: boolean) => {
    if (!canUseExplanation(bookTitle, author, useCustomLLM)) {
      return false
    }

    setProfile(prev => {
      const bookKey = getBookKey(bookTitle, author)
      const bookExplanations = prev.bookExplanations?.[bookKey] || 0
      
      let newProfile = { ...prev }
      
      // If using custom LLM, no cost
      if (useCustomLLM) {
        return prev
      }
      
      // If unlimited access, no cost
      if (prev.hasUnlimitedAccess && prev.unlimitedAccessExpiry && new Date() < new Date(prev.unlimitedAccessExpiry)) {
        return prev
      }
      
      // If book is purchased, no cost
      if (prev.purchasedBooks?.includes(bookKey)) {
        return prev
      }
      
      // If under 3 free explanations for this book, use free
      if (bookExplanations < 3) {
        newProfile = {
          ...prev,
          bookExplanations: {
            ...prev.bookExplanations,
            [bookKey]: bookExplanations + 1
          }
        }
      } else {
        // Use a credit
        newProfile = {
          ...prev,
          availableCredits: Math.max(0, (prev.availableCredits || 0) - 1)
        }
      }
      
      localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
      return newProfile
    })
    
    return true
  }

  const getBookExplanationsUsed = (bookTitle: string, author: string) => {
    const bookKey = getBookKey(bookTitle, author)
    return profile.bookExplanations?.[bookKey] || 0
  }

  const addCredits = (amount: number) => {
    debugProfile(' addCredits called with amount:', amount)
    setProfile(prev => {
      debugProfile(' Previous credits:', prev.availableCredits)
      const newProfile = {
        ...prev,
        availableCredits: (prev.availableCredits || 0) + amount
      }
      debugProfile(' New credits:', newProfile.availableCredits)
      localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
      debugProfile(' Saved to localStorage:', newProfile)
      return newProfile
    })
  }

  const purchaseBook = (bookTitle: string, author: string) => {
    setProfile(prev => {
      const bookKey = getBookKey(bookTitle, author)
      const newProfile = {
        ...prev,
        purchasedBooks: [...(prev.purchasedBooks || []), bookKey]
      }
      localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
      return newProfile
    })
  }

  const grantUnlimitedAccess = (duration: 'hour' | 'month' | 'year') => {
    debugProfile(' grantUnlimitedAccess called with duration:', duration)
    setProfile(prev => {
      const now = new Date()
      let expiryTime: Date
      
      switch (duration) {
        case 'hour':
          expiryTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
          break
        case 'month':
          expiryTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
          break
        case 'year':
          expiryTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 365 days
          break
        default:
          expiryTime = new Date(now.getTime() + 60 * 60 * 1000) // Default to 1 hour
      }
      
      const newProfile = {
        ...prev,
        hasUnlimitedAccess: true,
        unlimitedAccessExpiry: expiryTime
      }
      debugProfile(' granting unlimited access until:', expiryTime)
      debugProfile(' new profile with unlimited access:', newProfile)
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
      incrementExplanations,
      canUseExplanation,
      useExplanation,
      getBookExplanationsUsed,
      addCredits,
      purchaseBook,
      grantUnlimitedAccess
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