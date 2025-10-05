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
      
      const isCapacitorEnvironment = isCapacitor || hasCapacitorPlatform
      
      log('AuthContext: Environment check:', { 
        isMobile, 
        isCapacitor, 
        hasCapacitorPlatform,
        isCapacitorEnvironment,
        userAgent: navigator.userAgent,
        hasCapacitor: !!(window as any).Capacitor
      })
      
      if (isMobile || isCapacitorEnvironment) {
        // For mobile/Capacitor, use window.open with _system to bypass webview
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://romeo-and-juliet-explained.vercel.app'
        const redirectUrl = `${baseUrl}/reader`
        const googleAuthUrl = `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(redirectUrl)}`
        
        log('AuthContext: Mobile/Capacitor detected, using window.open')
        log('AuthContext: OAuth URL:', googleAuthUrl)
        
        try {
          window.open(googleAuthUrl, '_system')
          log('AuthContext: window.open succeeded')
          
          // Show instructions to user
          alert('Please complete sign-in in the browser that opened, then return to this app.')
        } catch (openError) {
          log('AuthContext: window.open failed:', openError)
          alert('Failed to open browser: ' + (openError instanceof Error ? openError.message : String(openError)))
        }
      } else {
        log('AuthContext: Web environment detected, trying NextAuth first')
        try {
          // For web, use regular NextAuth
          await signIn('google', { 
            callbackUrl: window.location.href,
            redirect: true
          })
        } catch (nextAuthError) {
          log('AuthContext: NextAuth failed, falling back to window.open:', nextAuthError)
          // Fallback to window.open if NextAuth fails
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://romeo-and-juliet-explained.vercel.app'
          const redirectUrl = `${baseUrl}/reader`
          const googleAuthUrl = `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(redirectUrl)}`
          
          try {
            window.open(googleAuthUrl, '_system')
            log('AuthContext: Fallback window.open succeeded')
            alert('Please complete sign-in in the browser that opened, then return to this app.')
          } catch (openError) {
            log('AuthContext: Fallback window.open failed:', openError)
            alert('Failed to open browser: ' + (openError instanceof Error ? openError.message : String(openError)))
          }
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
