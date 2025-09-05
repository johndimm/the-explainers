'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ProfileData, Language, EducationLevel } from '../components/Profile'

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
  refreshProfileAfterExplanation: () => Promise<void>
  getBookExplanationsUsed: (bookTitle: string, author: string) => number
  addCredits: (amount: number) => void
  purchaseBook: (bookTitle: string, author: string, url?: string) => void
  grantUnlimitedAccess: (duration: 'day' | 'month' | 'year') => void
  removePurchasedBook: (bookTitle: string, author: string) => void
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

export const AuthenticatedProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
  }, [status, router])

  // Load user profile when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadUserProfile()
    }
  }, [session, status])

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        console.log('AuthProfileContext: Loaded profile from database:', data)
        console.log('AuthProfileContext: Book explanations data:', data.bookExplanations)
        
        // Convert database format to ProfileData format
        const profileData: ProfileData = {
          age: null, // Will add user preference storage later
          language: 'english', // Will add user preference storage later  
          educationLevel: 'high-school', // Will add user preference storage later
          firstLogin: data.firstLogin ? new Date(data.firstLogin) : new Date(),
          totalExplanations: data.totalExplanations || 0,
          todayExplanations: data.todayExplanations || 0,
          availableCredits: data.credits?.available_credits ?? 5,
          bookExplanations: data.bookExplanations || {},
          purchasedBooks: data.purchasedBooks || [],
          hasUnlimitedAccess: data.credits?.has_unlimited_access || false,
          unlimitedAccessExpiry: data.credits?.unlimited_access_until ? new Date(data.credits.unlimited_access_until) : undefined
        }
        
        console.log('AuthProfileContext: Converted profile data:', profileData)
        console.log('AuthProfileContext: Book explanations in profile:', profileData.bookExplanations)
        setProfile(profileData)
        setIsHydrated(true) // Only set hydrated after profile data is loaded
      } else {
        console.error('AuthProfileContext: Failed to load profile')
        setIsHydrated(true) // Set hydrated even on error to prevent infinite loading
      }
    } catch (error) {
      console.error('AuthProfileContext: Error loading profile:', error)
      setIsHydrated(true) // Set hydrated even on error to prevent infinite loading
    }
  }

  const updateProfile = async (newProfile: ProfileData) => {
    console.log('AuthProfileContext: updateProfile called with:', newProfile)
    setProfile(newProfile)
    
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      })
    } catch (error) {
      console.error('AuthProfileContext: Error updating profile:', error)
    }
  }

  const incrementExplanations = async () => {
    // This will be handled by the server-side usage tracking
    // Just refresh the profile data
    await loadUserProfile()
  }

  const getBookKey = (bookTitle: string, author: string) => {
    return `${bookTitle}-${author}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  }

  const canUseExplanation = (bookTitle: string, author: string, useCustomLLM: boolean) => {
    console.log('AuthProfileContext: canUseExplanation called for:', bookTitle, 'by', author)
    console.log('AuthProfileContext: current profile.purchasedBooks:', profile.purchasedBooks)
    console.log('AuthProfileContext: current profile.availableCredits:', profile.availableCredits)
    console.log('AuthProfileContext: current profile.hasUnlimitedAccess:', profile.hasUnlimitedAccess)
    
    // Free if using custom LLM
    if (useCustomLLM) {
      console.log('AuthProfileContext: using custom LLM - access granted')
      return true
    }
    
    // Check unlimited access
    if (profile.hasUnlimitedAccess && profile.unlimitedAccessExpiry) {
      const now = new Date()
      const expiry = profile.unlimitedAccessExpiry instanceof Date 
        ? profile.unlimitedAccessExpiry 
        : new Date(profile.unlimitedAccessExpiry)
      
      if (now < expiry) {
        console.log('AuthProfileContext: unlimited access active - access granted')
        return true
      }
    }
    
    // Check if book is purchased
    const bookKey = getBookKey(bookTitle, author)
    console.log('AuthProfileContext: generated bookKey:', bookKey)
    const isPurchased = profile.purchasedBooks?.includes(bookKey)
    console.log('AuthProfileContext: isPurchased:', isPurchased)
    if (isPurchased) {
      console.log('AuthProfileContext: book purchased - access granted')
      return true
    }
    
    // Check free explanations (3 per book)
    const bookExplanations = profile.bookExplanations?.[bookKey] || 0
    console.log('AuthProfileContext: bookExplanations for this book:', bookExplanations)
    if (bookExplanations < 3) {
      console.log('AuthProfileContext: under 3 free explanations - access granted')
      return true
    }
    
    // Check available credits
    const hasCredits = (profile.availableCredits || 0) > 0
    console.log('AuthProfileContext: hasCredits:', hasCredits)
    if (hasCredits) {
      console.log('AuthProfileContext: has credits - access granted')
      return true
    }
    
    console.log('AuthProfileContext: no access available')
    return false
  }

  const useExplanation = (bookTitle: string, author: string, useCustomLLM: boolean) => {
    if (!canUseExplanation(bookTitle, author, useCustomLLM)) {
      return false
    }
    
    // Server-side usage tracking will handle the actual deduction
    // This is just for client-side validation
    return true
  }
  
  const refreshProfileAfterExplanation = async () => {
    // Refresh profile data after explanation to sync with server-side changes
    await loadUserProfile()
  }

  const getBookExplanationsUsed = (bookTitle: string, author: string) => {
    const bookKey = getBookKey(bookTitle, author)
    return profile.bookExplanations?.[bookKey] || 0
  }

  const addCredits = async (amount: number) => {
    try {
      const response = await fetch('/api/user/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
      
      if (response.ok) {
        await loadUserProfile() // Refresh profile data
      }
    } catch (error) {
      console.error('AuthProfileContext: Error adding credits:', error)
    }
  }

  const purchaseBook = async (bookTitle: string, author: string, url?: string) => {
    try {
      console.log('AuthProfileContext: Purchasing book:', bookTitle, 'by', author)
      const response = await fetch('/api/user/purchase-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookTitle, author, url })
      })
      
      if (response.ok) {
        console.log('AuthProfileContext: Book purchase successful, refreshing profile...')
        await loadUserProfile() // Refresh profile data
        console.log('AuthProfileContext: Profile refreshed, purchasedBooks now:', profile.purchasedBooks)
      } else {
        console.error('AuthProfileContext: Book purchase failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('AuthProfileContext: Error purchasing book:', error)
    }
  }

  const grantUnlimitedAccess = async (duration: 'day' | 'month' | 'year') => {
    try {
      const response = await fetch('/api/user/unlimited-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration })
      })
      
      if (response.ok) {
        await loadUserProfile() // Refresh profile data
      }
    } catch (error) {
      console.error('AuthProfileContext: Error granting unlimited access:', error)
    }
  }

  const removePurchasedBook = async (bookTitle: string, author: string) => {
    try {
      const response = await fetch('/api/user/remove-book', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookTitle, author })
      })
      
      if (response.ok) {
        await loadUserProfile() // Refresh profile data
      }
    } catch (error) {
      console.error('AuthProfileContext: Error removing book:', error)
    }
  }

  const openProfile = () => setIsProfileOpen(true)
  const closeProfile = () => setIsProfileOpen(false)

  // Don't render anything until we know authentication status
  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#666', margin: 0 }}>Loading...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect to sign-in
  }

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
    refreshProfileAfterExplanation,
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

export const useAuthenticatedProfile = () => {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useAuthenticatedProfile must be used within an AuthenticatedProfileProvider')
  }
  return context
}

// Compatibility hook for existing components
export const useProfile = useAuthenticatedProfile
