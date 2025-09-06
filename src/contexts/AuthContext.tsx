'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

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
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  const user = session?.user || null
  const isAuthenticated = !!user

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/chat' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      // Try the standard signOut first
      const result = await signOut({ 
        callbackUrl: '/',
        redirect: false 
      })
      
      // If signOut returns a URL, redirect manually
      if (result?.url) {
        window.location.href = result.url
      } else {
        // Fallback: clear session and redirect
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback: clear localStorage and redirect
      try {
        localStorage.removeItem('next-auth.session-token')
        localStorage.removeItem('__Secure-next-auth.session-token')
      } catch (e) {
        console.log('Could not clear localStorage:', e)
      }
      // Force reload the page
      window.location.href = '/'
    } finally {
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
