'use client'

// Import log early to disable // console.log
import '@/utils/log'

import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { AuthProvider } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import styles from './ClientLayout.module.css'
import React, { useEffect, useRef, useState } from 'react'
// Import log early to wire mobile overlay
import '@/utils/log'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    // Check if mobile after component mounts (client-side only)
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      // Debug logging disabled
      // // console.log('🔍 Mobile detection:', mobile, 'User agent:', navigator.userAgent)
      setIsMobile(mobile)
    }
    
    checkMobile()
    
    return () => {
      // no-op
    }
  }, [])

  return (
    <AuthProvider>
      <ProfileProvider>
        <SettingsProvider>
          <div>
            <Header />
            <main className={styles.main}>
              {children}
            </main>
            {/* Mobile console overlay now created by utils/log.ts */}
          </div>
        </SettingsProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
