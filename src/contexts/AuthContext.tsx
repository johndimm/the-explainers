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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    log('AuthContext: Session status changed:', status)
    log('AuthContext: Session data:', session)
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status, session])

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
    setIsLoading(true)
    try {
      // Force account selection and proper redirect on mobile
      await signIn('google', { 
        callbackUrl: window.location.href,
        redirect: true
      })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
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
      console.error('Sign out error:', error)
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
