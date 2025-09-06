'use client'

import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { AuthProvider } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import React from 'react'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <SettingsProvider>
          <div>
            <Header />
            <main style={{ 
              minHeight: 'calc(100vh - 60px)',
              maxWidth: '1024px',
              margin: '0 auto',
              padding: '0 20px'
            }}>
              {children}
            </main>
          </div>
        </SettingsProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}