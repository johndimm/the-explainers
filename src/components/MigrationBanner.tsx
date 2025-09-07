'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { extractLocalStorageData, migrateToDatabase, clearLocalStorageData } from '@/utils/migrateLocalStorage'

export const MigrationBanner: React.FC = () => {
  const { data: session, status } = useSession()
  const [showBanner, setShowBanner] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)

  useEffect(() => {
    // Only show banner for authenticated users who have localStorage data
    if (status === 'loading' || !session?.user?.email) return

    // Check if user has localStorage data that needs migration
    const hasLocalStorageData = localStorage.getItem('explainer-profile') || 
                               localStorage.getItem('explainer-settings') || 
                               localStorage.getItem('current-book') ||
                               Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
                                 .some(key => key && key.startsWith('bookmark-'))

    // Check if user has already been shown the migration banner (to avoid showing it again)
    const migrationShown = localStorage.getItem('migration-banner-shown')
    
    if (hasLocalStorageData && !migrationShown) {
      setShowBanner(true)
    }
  }, [session, status])

  const handleMigration = async () => {
    setIsMigrating(true)
    try {
      const localStorageData = extractLocalStorageData()
      const success = await migrateToDatabase(localStorageData)
      
      if (success) {
        clearLocalStorageData()
        // Mark that migration banner has been shown to prevent it from showing again
        localStorage.setItem('migration-banner-shown', 'true')
        setMigrationComplete(true)
        setTimeout(() => {
          setShowBanner(false)
        }, 3000)
      } else {
        alert('Migration failed. Please try again.')
      }
    } catch (error) {
      console.error('Migration error:', error)
      alert('Migration failed. Please try again.')
    } finally {
      setIsMigrating(false)
    }
  }

  const handleDismiss = () => {
    // Mark that migration banner has been shown to prevent it from showing again
    localStorage.setItem('migration-banner-shown', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#4CAF50',
      color: 'white',
      padding: '12px 20px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ flex: 1 }}>
        {migrationComplete ? (
          <span>✅ Data migrated successfully! Your reading progress and settings are now synced across devices.</span>
        ) : (
          <span>
            📱 <strong>Sync your data across devices!</strong> Migrate your reading progress and settings to the cloud.
          </span>
        )}
      </div>
      
      {!migrationComplete && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            style={{
              background: 'white',
              color: '#4CAF50',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: isMigrating ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: isMigrating ? 0.7 : 1
            }}
          >
            {isMigrating ? 'Migrating...' : 'Migrate Now'}
          </button>
          
          <button
            onClick={handleDismiss}
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Later
          </button>
        </div>
      )}
    </div>
  )
}