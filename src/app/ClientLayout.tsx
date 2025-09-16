'use client'

import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { AuthProvider } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import styles from './ClientLayout.module.css'
import React from 'react'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <SettingsProvider>
          <div>
            <Header />
            <main className={styles.main}>
              {children}
            </main>
          </div>
        </SettingsProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
