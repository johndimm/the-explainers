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
    console.log('ProfileContext: Loading profile from localStorage:', savedProfile)
    
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        console.log('ProfileContext: Parsed saved profile:', parsed)
        // Convert date strings back to Date objects
        if (parsed.firstLogin) {
          parsed.firstLogin = new Date(parsed.firstLogin)
        }
        if (parsed.unlimitedAccessExpiry) {
          parsed.unlimitedAccessExpiry = new Date(parsed.unlimitedAccessExpiry)
          console.log('ProfileContext: Converted unlimitedAccessExpiry to Date object:', parsed.unlimitedAccessExpiry)
        }
        let restoredProfile = { ...DEFAULT_PROFILE, ...parsed }
        console.log('ProfileContext: Final restored profile:', restoredProfile)
        
        // Migration: Reset credits for users who had the old 100 credit default
        // Handle users with 100 credits (unused) or 97-99 credits (used some)
        // But don't migrate users who have purchased credits (105+ suggests they bought 100 credits)
        if (restoredProfile.availableCredits && restoredProfile.availableCredits >= 95 && restoredProfile.availableCredits <= 100) {
          console.log(`ProfileContext: Migrating user from ${restoredProfile.availableCredits} to 5 credits`)
          restoredProfile.availableCredits = 5
          // Save the migrated profile
          localStorage.setItem('explainer-profile', JSON.stringify(restoredProfile))
        }
        
        console.log('ProfileContext: Restoring profile:', restoredProfile)
        setProfile(restoredProfile)
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    } else {
      // First time user - set first login date
      console.log('ProfileContext: No saved profile found, creating new one')
      const newProfile = { ...DEFAULT_PROFILE, firstLogin: new Date() }
      setProfile(newProfile)
      localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
    }
  }, [])

  const updateProfile = (newProfile: ProfileData) => {
    console.log('ProfileContext: updateProfile called with:', newProfile)
    console.log('ProfileContext: Current profile before update:', profile)
    setProfile(newProfile)
    localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
    console.log('ProfileContext: Profile updated in localStorage')
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
    console.log('ProfileContext: canUseExplanation called for:', bookTitle, 'by', author)
    console.log('ProfileContext: useCustomLLM:', useCustomLLM)
    console.log('ProfileContext: current profile:', profile)
    
    // Free if using custom LLM
    if (useCustomLLM) {
      console.log('ProfileContext: using custom LLM - access granted')
      return true
    }
    
    // Free if has unlimited access
    if (profile.hasUnlimitedAccess && profile.unlimitedAccessExpiry) {
      const now = new Date()
      // Ensure expiry is a Date object (defensive programming)
      const expiry = profile.unlimitedAccessExpiry instanceof Date 
        ? profile.unlimitedAccessExpiry 
        : new Date(profile.unlimitedAccessExpiry)
      
      console.log('ProfileContext: checking unlimited access - now:', now, 'expiry:', expiry)
      console.log('ProfileContext: hasUnlimitedAccess:', profile.hasUnlimitedAccess)
      console.log('ProfileContext: expiry type:', typeof profile.unlimitedAccessExpiry)
      console.log('ProfileContext: expiry instanceof Date:', profile.unlimitedAccessExpiry instanceof Date)
      console.log('ProfileContext: access expired?', now >= expiry)
      
      if (now < expiry) {
        console.log('ProfileContext: unlimited access valid - access granted')
        return true
      } else {
        console.log('ProfileContext: unlimited access expired')
      }
    } else {
      console.log('ProfileContext: no unlimited access or no expiry date')
    }
    
    const bookKey = getBookKey(bookTitle, author)
    console.log('ProfileContext: bookKey:', bookKey)
    
    // Free if book is purchased
    if (profile.purchasedBooks?.includes(bookKey)) {
      console.log('ProfileContext: book purchased - access granted')
      return true
    }
    
    // Check if under 3 free explanations for this book
    const bookExplanations = profile.bookExplanations?.[bookKey] || 0
    console.log('ProfileContext: book explanations used:', bookExplanations)
    if (bookExplanations < 3) {
      console.log('ProfileContext: under 3 free explanations - access granted')
      return true
    }
    
    // Check if has available credits
    const hasCredits = (profile.availableCredits || 0) > 0
    console.log('ProfileContext: available credits:', profile.availableCredits, 'has credits:', hasCredits)
    if (hasCredits) {
      console.log('ProfileContext: has credits - access granted')
    } else {
      console.log('ProfileContext: no credits - access denied')
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
    console.log('ProfileContext: addCredits called with amount:', amount)
    setProfile(prev => {
      console.log('ProfileContext: Previous credits:', prev.availableCredits)
      const newProfile = {
        ...prev,
        availableCredits: (prev.availableCredits || 0) + amount
      }
      console.log('ProfileContext: New credits:', newProfile.availableCredits)
      localStorage.setItem('explainer-profile', JSON.stringify(newProfile))
      console.log('ProfileContext: Saved to localStorage:', newProfile)
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
    console.log('ProfileContext: grantUnlimitedAccess called with duration:', duration)
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
      console.log('ProfileContext: granting unlimited access until:', expiryTime)
      console.log('ProfileContext: new profile with unlimited access:', newProfile)
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