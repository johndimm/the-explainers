'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession, signIn, signOut, getSession } from 'next-auth/react'
import { log } from '../utils/log'

interface User {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: session, status, update } = useSession()
  
  // In local development, start with loading false to bypass auth delays
  const isLocalDev = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
  const [isLoading, setIsLoading] = useState(!isLocalDev)

  useEffect(() => {
    log('AuthContext: Session status changed:', status)
    log('AuthContext: Session data:', session)
    
    if (status !== 'loading' || isLocalDev) {
      setIsLoading(false)
    }
  }, [status, session, isLocalDev])


  // Force session refresh on mobile after OAuth redirect
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile && status === 'unauthenticated' && !isLoading) {
      log('AuthContext: Mobile device detected, forcing session refresh')
      // Try multiple times with delays for mobile OAuth issues
      const retrySession = async () => {
        for (let i = 0; i < 3; i++) {
          log(`AuthContext: Session refresh attempt ${i + 1}`)
          await update()
          await new Promise(resolve => setTimeout(resolve, 1000))
          // Check if we have a session after the update
          const currentSession = await getSession()
          if (currentSession?.user) {
            log('AuthContext: Session refresh successful')
            break
          }
        }
      }
      retrySession()
    }
  }, [status, isLoading, update])

  const user = session?.user || null
  const isAuthenticated = !!user

  const handleSignIn = async () => {
    alert('handleSignIn called!')
    log('AuthContext: handleSignIn called')
    setIsLoading(true)
    try {
      // Check if we're in a mobile/Capacitor environment
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor
      
      // Also check for Capacitor platform method (more reliable)
      const hasCapacitorPlatform = typeof window !== 'undefined' && 
        (window as any).Capacitor && 
        typeof (window as any).Capacitor.getPlatform === 'function'
      
      // Check for Capacitor-specific properties
      const hasCapacitorPlugins = typeof window !== 'undefined' && 
        (window as any).Capacitor && 
        (window as any).Capacitor.Plugins
      
      // Check for Capacitor webview indicators
      const isCapacitorWebview = typeof window !== 'undefined' && 
        (window as any).Capacitor && 
        (window as any).Capacitor.isNativePlatform && 
        (window as any).Capacitor.isNativePlatform()
      
      // Force mobile detection for Capacitor apps - be very aggressive!
      const isCapacitorEnvironment = isCapacitor || hasCapacitorPlatform || hasCapacitorPlugins || isCapacitorWebview || isMobile
      
      log('AuthContext: Environment check:', { 
        isMobile, 
        isCapacitor, 
        hasCapacitorPlatform,
        isCapacitorEnvironment,
        userAgent: navigator.userAgent,
        hasCapacitor: !!(window as any).Capacitor
      })
      
      // Debug: Show the actual detection results
      alert(`Mobile: ${isMobile}, Capacitor: ${isCapacitor}, Platform: ${hasCapacitorPlatform}, Final: ${isCapacitorEnvironment}`)
      alert(`User Agent: ${navigator.userAgent}`)
      
      // For Capacitor, construct OAuth URL manually to avoid NextAuth browser issues
      if (isMobile || isCapacitorEnvironment) {
        log('AuthContext: Mobile/Capacitor detected - constructing OAuth URL manually')
        alert('Mobile/Capacitor detected - using manual OAuth URL')
        
        try {
          // Construct the OAuth URL manually instead of using NextAuth
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://romeo-and-juliet-explained.vercel.app'
          const callbackUrl = `${baseUrl}/reader` // Redirect back to reader after OAuth
          const googleAuthUrl = `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`
          
          log('AuthContext: Manual OAuth URL:', googleAuthUrl)
          alert('OAuth URL: ' + googleAuthUrl)
          
          // Add a delay to ensure alerts are seen before redirect
          setTimeout(() => {
            // Navigate directly to the OAuth URL within the app
            window.location.href = googleAuthUrl
            log('AuthContext: Navigated to OAuth URL within app')
          }, 2000) // 2 second delay
        } catch (error) {
          log('AuthContext: Manual OAuth failed:', error)
          alert('Sign in failed: ' + (error instanceof Error ? error.message : String(error)))
        }
      } else {
        // For web, use normal NextAuth
        log('AuthContext: Web environment - using normal NextAuth')
        alert('Web environment detected - using NextAuth')
        try {
          await signIn('google', { 
            callbackUrl: window.location.href,
            redirect: true
          })
        } catch (error) {
          log('AuthContext: NextAuth failed:', error)
          alert('Sign in failed: ' + (error instanceof Error ? error.message : String(error)))
        }
      }
    } catch (error) {
      log('ui','Sign in error:', error)
      alert('Sign in failed: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      log('AuthContext: handleSignIn finally block')
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    log('Sign out started')
    setIsLoading(true)
    try {
      // Sign out without redirect so the session state can update
      await signOut({ redirect: false })
      log('SignOut completed')
      // Force session refresh
      await update()
      log('Session updated')
    } catch (error) {
      log('ui','Sign out error:', error)
    } finally {
      log('Sign out finally block')
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      signIn: handleSignIn,
      signOut: handleSignOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
