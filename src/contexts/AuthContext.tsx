'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  user: any
  userAgent: string
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Use navigator.userAgent as the unique identifier
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent : ''

  const value: AuthContextType = {
    isAuthenticated: true, // Always authenticated since no auth required
    user: { userAgent }, // Mock user object with userAgent
    userAgent,
    isLoading: false
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}