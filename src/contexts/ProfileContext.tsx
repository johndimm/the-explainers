'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
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
  availableCredits: 0,
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
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      if (status === 'loading') return
      
      // In local development, bypass authentication
      const isLocalDev = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
      
      if (!session?.user?.email && !isLocalDev) {
        // Not authenticated and not local dev, use default profile
        log('ProfileContext: Not authenticated, using default profile')
        setProfile(DEFAULT_PROFILE)
        setIsHydrated(true)
        return
      }
      
      if (isLocalDev && !session?.user?.email) {
        // Local dev without auth - use a mock profile
        log('ProfileContext: Local development mode - using mock profile')
        const mockProfile = {
          ...DEFAULT_PROFILE,
          firstLogin: new Date(),
          availableCredits: 0, // Start with 0 credits
          hasUnlimitedAccess: true,
          unlimitedAccessExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
        setProfile(mockProfile)
        setIsHydrated(true)
        return
      }

      setIsHydrated(true)
      
      try {
        // Load from database
        if (session?.user?.email) {
          log('ProfileContext: Loading profile from database for:', session.user.email)
        }
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const dbProfile = await response.json()
          log('ProfileContext: Loading profile from database:', dbProfile)
          
          // Convert database format to ProfileData format
          const profileData: ProfileData = {
            age: dbProfile.age,
            language: dbProfile.language as Language,
            educationLevel: dbProfile.education_level as EducationLevel,
            firstLogin: dbProfile.first_login ? new Date(dbProfile.first_login) : undefined,
            totalExplanations: dbProfile.total_explanations,
            todayExplanations: dbProfile.today_explanations,
            availableCredits: dbProfile.available_credits,
            bookExplanations: dbProfile.book_explanations || {},
            purchasedBooks: dbProfile.purchased_book_details ? Object.keys(dbProfile.purchased_book_details) : [],
            hasUnlimitedAccess: dbProfile.has_unlimited_access,
            unlimitedAccessExpiry: dbProfile.unlimited_access_expiry ? new Date(dbProfile.unlimited_access_expiry) : undefined
          }
          
          // Add purchased book details for frontend use
          if (dbProfile.purchased_book_details) {
            ;(profileData as any).purchasedBookDetails = dbProfile.purchased_book_details
          }
          
          log('ProfileContext: Restoring profile from database:', profileData)
          log('ProfileContext: Credits from database:', profileData.availableCredits)
          log('ProfileContext: Unlimited access from database:', {
            hasUnlimitedAccess: profileData.hasUnlimitedAccess,
            unlimitedAccessExpiry: profileData.unlimitedAccessExpiry,
            raw_has_unlimited_access: dbProfile.has_unlimited_access,
            raw_unlimited_access_expiry: dbProfile.unlimited_access_expiry
          })
          log('ProfileContext: Full database response:', dbProfile)
          setProfile(profileData)
        } else {
          // No profile in database, create default
          log('ProfileContext: No profile in database, creating default')
          const newProfile = { ...DEFAULT_PROFILE, firstLogin: new Date() }
          setProfile(newProfile)
          
          // Save default profile to database
          try {
            await fetch('/api/user/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newProfile)
            })
          } catch (error) {
            console.error('Error saving default profile to database:', error)
          }
        }
      } catch (error) {
        console.error('ProfileContext: Error loading from database:', error)
        // Fallback to default profile
        const newProfile = { ...DEFAULT_PROFILE, firstLogin: new Date() }
        setProfile(newProfile)
      }
    }

    loadProfile()
  }, [session, status])

  const updateProfile = async (newProfile: ProfileData) => {
    log('ProfileContext: updateProfile called with:', newProfile)
    log('ProfileContext: Current profile before update:', profile)
    setProfile(newProfile)
    
    // Save to database
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      })
      if (response.ok) {
        log('ProfileContext: Profile updated in database')
      } else {
        console.error('ProfileContext: Failed to update profile in database')
      }
    } catch (error) {
      console.error('ProfileContext: Error updating profile in database:', error)
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
      }).catch(error => console.error('Error saving profile to database:', error))
      
      return newProfile
    })
  }

  const getBookKey = (bookTitle: string, author: string) => {
    // Create a more explicit format: "title:author" to avoid ambiguity
    const cleanTitle = bookTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const cleanAuthor = author.toLowerCase().replace(/[^a-z0-9]/g, '-')
    return `${cleanTitle}:${cleanAuthor}`
  }

  const canUseExplanation = (bookTitle: string, author: string, useCustomLLM: boolean) => {
    log('ProfileContext: canUseExplanation called for:', bookTitle, 'by', author)
    log('ProfileContext: useCustomLLM:', useCustomLLM)
    log('ProfileContext: current profile:', profile)
    log('ProfileContext: unlimited access check:', {
      hasUnlimitedAccess: profile.hasUnlimitedAccess,
      unlimitedAccessExpiry: profile.unlimitedAccessExpiry,
      type: typeof profile.unlimitedAccessExpiry
    })
    
    // Free if using custom LLM
    if (useCustomLLM) {
      log('ProfileContext: using custom LLM - access granted')
      return true
    }
    
    // Free if has unlimited access
    if (profile.hasUnlimitedAccess && profile.unlimitedAccessExpiry) {
      const now = new Date()
      // Ensure expiry is a Date object (defensive programming)
      const expiry = profile.unlimitedAccessExpiry instanceof Date 
        ? profile.unlimitedAccessExpiry 
        : new Date(profile.unlimitedAccessExpiry)
      
      log('ProfileContext: checking unlimited access - now:', now, 'expiry:', expiry)
      log('ProfileContext: hasUnlimitedAccess:', profile.hasUnlimitedAccess)
      log('ProfileContext: expiry type:', typeof profile.unlimitedAccessExpiry)
      log('ProfileContext: expiry instanceof Date:', profile.unlimitedAccessExpiry instanceof Date)
      log('ProfileContext: access expired?', now >= expiry)
      
      if (now < expiry) {
        log('ProfileContext: unlimited access valid - access granted')
        return true
      } else {
        log('ProfileContext: unlimited access expired')
      }
    } else {
      log('ProfileContext: no unlimited access or no expiry date')
    }
    
    const bookKey = getBookKey(bookTitle, author)
    log('ProfileContext: generated bookKey:', bookKey)
    log('ProfileContext: purchasedBooks array:', profile.purchasedBooks)
    log('ProfileContext: purchasedBooks type:', typeof profile.purchasedBooks)
    log('ProfileContext: purchasedBooks length:', profile.purchasedBooks?.length)
    log('ProfileContext: bookKey generation details:', { 
      originalTitle: bookTitle, 
      originalAuthor: author,
      combined: `${bookTitle}-${author}`,
      lowercase: `${bookTitle}-${author}`.toLowerCase(),
      final: bookKey
    })
    
    // Free if book is purchased
    const isPurchased = profile.purchasedBooks?.includes(bookKey)
    log('ProfileContext: book purchased check result:', isPurchased)
    log('ProfileContext: checking each purchased book:')
    profile.purchasedBooks?.forEach((book, index) => {
      log('profile', `  [${index}]: "${book}" === "${bookKey}" ? ${book === bookKey}`)
    })
    
    if (isPurchased) {
      log('ProfileContext: book purchased - access granted')
      return true
    }
    
    // Check if under 3 free explanations for this book
    const bookExplanations = profile.bookExplanations?.[bookKey] || 0
    log('ProfileContext: book explanations used:', bookExplanations)
    if (bookExplanations < 3) {
      log('ProfileContext: under 3 free explanations - access granted')
      return true
    }
    
    // Check if has available credits
    const hasCredits = (profile.availableCredits || 0) > 0
    log('ProfileContext: available credits:', profile.availableCredits, 'has credits:', hasCredits)
    if (hasCredits) {
      log('ProfileContext: has credits - access granted')
    } else {
      log('ProfileContext: no credits - access denied')
    }
    return hasCredits
  }

  const useExplanation = (bookTitle: string, author: string, useCustomLLM: boolean) => {
    log('ProfileContext: useExplanation called with:', { bookTitle, author, useCustomLLM })
    if (!canUseExplanation(bookTitle, author, useCustomLLM)) {
      return false
    }

    setProfile(prev => {
      const bookKey = getBookKey(bookTitle, author)
      log('ProfileContext: Generated bookKey:', bookKey, 'from:', { bookTitle, author })
      const bookExplanations = prev.bookExplanations?.[bookKey] || 0
      
      let newProfile = { ...prev }
      
      // If unlimited access, no cost and no tracking
      if (prev.hasUnlimitedAccess && prev.unlimitedAccessExpiry && new Date() < new Date(prev.unlimitedAccessExpiry)) {
        log('ProfileContext: unlimited access - no tracking needed')
        return prev
      }
      
      // If using custom LLM, no cost
      if (useCustomLLM) {
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
        log('ProfileContext: Using a credit. Previous credits:', prev.availableCredits)
        newProfile = {
          ...prev,
          availableCredits: Math.max(0, (prev.availableCredits || 0) - 1)
        }
        log('ProfileContext: New credits after deduction:', newProfile.availableCredits)
      }
      
      // Save to database with correct field names
      const dbProfile = {
        ...newProfile,
        available_credits: newProfile.availableCredits,
        book_explanations: newProfile.bookExplanations,
        purchased_book_details: newProfile.purchasedBookDetails,
        has_unlimited_access: newProfile.hasUnlimitedAccess,
        unlimited_access_expiry: newProfile.unlimitedAccessExpiry
      }
      delete (dbProfile as any).availableCredits
      delete (dbProfile as any).bookExplanations
      delete (dbProfile as any).purchasedBookDetails
      delete (dbProfile as any).hasUnlimitedAccess
      delete (dbProfile as any).unlimitedAccessExpiry
      
      log('ProfileContext: Saving to database:', {
        available_credits: dbProfile.available_credits,
        book_explanations: dbProfile.book_explanations,
        has_unlimited_access: dbProfile.has_unlimited_access,
        unlimited_access_expiry: dbProfile.unlimited_access_expiry,
        totalExplanations: newProfile.totalExplanations,
        todayExplanations: newProfile.todayExplanations
      })
      
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbProfile)
      }).catch(error => console.error('Error saving profile to database:', error))
      
      return newProfile
    })
    
    return true
  }

  const getBookExplanationsUsed = (bookTitle: string, author: string) => {
    const bookKey = getBookKey(bookTitle, author)
    return profile.bookExplanations?.[bookKey] || 0
  }

  const addCredits = (amount: number) => {
    log('ProfileContext: addCredits called with amount:', amount)
    setProfile(prev => {
      log('ProfileContext: Previous credits:', prev.availableCredits)
      const newProfile = {
        ...prev,
        availableCredits: (prev.availableCredits || 0) + amount
      }
      log('ProfileContext: New credits:', newProfile.availableCredits)
      
      // Save to database - convert camelCase to snake_case
      const dbProfile = {
        ...newProfile,
        available_credits: newProfile.availableCredits,
        book_explanations: newProfile.bookExplanations,
        purchased_book_details: newProfile.purchasedBookDetails,
        has_unlimited_access: newProfile.hasUnlimitedAccess,
        unlimited_access_expiry: newProfile.unlimitedAccessExpiry
      }
      delete (dbProfile as any).availableCredits
      delete (dbProfile as any).bookExplanations
      delete (dbProfile as any).purchasedBookDetails
      delete (dbProfile as any).hasUnlimitedAccess
      delete (dbProfile as any).unlimitedAccessExpiry
      
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbProfile)
      }).catch(error => console.error('Error saving profile to database:', error))
      
      return newProfile
    })
  }

  const purchaseBook = (bookTitle: string, author: string, url?: string) => {
    setProfile(prev => {
      const bookKey = getBookKey(bookTitle, author)
      
      // Update purchased book details (single source of truth)
      const details = {
        ...(prev as any).purchasedBookDetails,
        [bookKey]: { title: bookTitle, author, url }
      }
      
      const newProfile = {
        ...prev,
        purchasedBooks: Object.keys(details), // Derive from details
        ...(details ? { purchasedBookDetails: details } : {})
      }
      
      // Save to database - only need purchased_book_details
      const dbProfile = {
        ...newProfile,
        purchased_book_details: details
      }
      delete (dbProfile as any).purchasedBooks
      delete (dbProfile as any).purchasedBookDetails
      
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbProfile)
      }).catch(error => console.error('Error saving profile to database:', error))
      
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
        purchasedBooks: Object.keys(details), // Derive from details
        ...(details ? { purchasedBookDetails: details } : {})
      }
      
      // Save to database - only need purchased_book_details
      const dbProfile = {
        ...newProfile,
        purchased_book_details: details
      }
      delete (dbProfile as any).purchasedBooks
      delete (dbProfile as any).purchasedBookDetails
      
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbProfile)
      }).catch(error => console.error('Error saving profile to database:', error))
      
      return newProfile
    })
  }

  const grantUnlimitedAccess = (duration: 'month') => {
    log('ProfileContext: grantUnlimitedAccess called with duration:', duration)
    setProfile(prev => {
      const now = new Date()
      // Only 1 month option available
      const expiryTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      
      const newProfile = {
        ...prev,
        hasUnlimitedAccess: true,
        unlimitedAccessExpiry: expiryTime
      }
      log('ProfileContext: granting unlimited access until:', expiryTime)
      log('ProfileContext: new profile with unlimited access:', newProfile)
      
      // Save to database - convert camelCase to snake_case
      const dbProfile = {
        ...newProfile,
        available_credits: newProfile.availableCredits,
        book_explanations: newProfile.bookExplanations,
        purchased_book_details: newProfile.purchasedBookDetails,
        has_unlimited_access: newProfile.hasUnlimitedAccess,
        unlimited_access_expiry: newProfile.unlimitedAccessExpiry
      }
      delete (dbProfile as any).availableCredits
      delete (dbProfile as any).bookExplanations
      delete (dbProfile as any).purchasedBookDetails
      delete (dbProfile as any).hasUnlimitedAccess
      delete (dbProfile as any).unlimitedAccessExpiry
      
      log('ProfileContext: Saving unlimited access to database:', {
        has_unlimited_access: dbProfile.has_unlimited_access,
        unlimited_access_expiry: dbProfile.unlimited_access_expiry
      })
      
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbProfile)
      }).catch(error => console.error('Error saving profile to database:', error))
      
      return newProfile
    })
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