'use client'

// Import log early to disable console.log
import '@/utils/log'

import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { AuthProvider } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import styles from './ClientLayout.module.css'
import React, { useEffect, useRef, useState } from 'react'
import { setMobileConsole } from '@/utils/log'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const mobileConsoleRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile after component mounts (client-side only)
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    
    checkMobile()
    
    // Set the mobile console element reference
    setMobileConsole(mobileConsoleRef.current)
    
    return () => {
      // Clean up on unmount
      setMobileConsole(null)
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
            {/* Mobile Console - only show on mobile */}
            {false && isMobile && (
              <div 
                ref={mobileConsoleRef}
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '200px',
                  backgroundColor: '#f0f0f0',
                  borderTop: '2px solid #ccc',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{
                  padding: '8px',
                  backgroundColor: '#333',
                  color: 'white',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #666'
                }}>
                  Mobile Console (Debug Logs)
                </div>
                <div style={{ flex: 1, padding: '4px' }}>
                  {/* Log entries will be appended here */}
                </div>
              </div>
            )}
          </div>
        </SettingsProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
