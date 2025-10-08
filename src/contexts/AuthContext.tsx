'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  user: any
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
  const value: AuthContextType = {
    isAuthenticated: true, // Always authenticated since no auth required
    user: {}, // Mock user object
    isLoading: false
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}