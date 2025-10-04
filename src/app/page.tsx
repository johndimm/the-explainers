'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrentBook } from '@/utils/currentBookStorage'
import { log } from '@/utils/log'
import { useTheme } from '@/hooks/useTheme'

function HomeContent() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { isSinglePlay, playTitle, playAuthor, playFilename } = useTheme()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Redirect to debug test page immediately
    console.log('MAIN PAGE: Redirecting to debug-test')
    router.push('/debug-test')
  }, [router])

  // Show loading while checking
  if (isChecking || isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>
            🎭
          </div>
          
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            Romeo and Juliet Explained
          </h1>
          
          <p style={{
            margin: '0 0 32px 0',
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Loading...
          </p>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <button
              onClick={() => {
                // Test OAuth with production URL
                const productionUrl = 'https://romeo-and-juliet-explained.vercel.app'
                const authUrl = `${productionUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(productionUrl + '/test-callback')}`
                
                console.log('Attempting OAuth with URL:', authUrl)
                
                try {
                  window.open(authUrl, '_system')
                } catch (error) {
                  console.error('OAuth failed:', error)
                  alert('Failed to open OAuth URL: ' + (error instanceof Error ? error.message : String(error)))
                }
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Test OAuth (Production)
            </button>
            
            <button
              onClick={() => {
                // Test OAuth with local URL
                const localUrl = window.location.origin
                const authUrl = `${localUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(localUrl + '/test-callback')}`
                
                console.log('Attempting local OAuth with URL:', authUrl)
                
                try {
                  window.open(authUrl, '_system')
                } catch (error) {
                  console.error('Local OAuth failed:', error)
                  alert('Failed to open local OAuth URL: ' + (error instanceof Error ? error.message : String(error)))
                }
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Test OAuth (Local)
            </button>
            
            <button
              onClick={() => router.push('/reader')}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Go to Reader
            </button>
          </div>
          
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666',
            lineHeight: '1.4'
          }}>
            <div><strong>Platform:</strong> {typeof window !== 'undefined' && (window as any).Capacitor ? (window as any).Capacitor.getPlatform() : 'Web'}</div>
            <div><strong>Is Capacitor:</strong> {typeof window !== 'undefined' && !!(window as any).Capacitor ? 'Yes' : 'No'}</div>
            <div><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '20px'
        }}>
          🎭
        </div>
        
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '28px',
          fontWeight: '700',
          color: '#1a1a1a'
        }}>
          Romeo and Juliet Explained
        </h1>
        
        <p style={{
          margin: '0 0 32px 0',
          color: '#666',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          Loading...
        </p>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button
            onClick={() => router.push('/mobile-test')}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Test Mobile OAuth
          </button>
          
          <button
            onClick={() => router.push('/reader')}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Go to Reader
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return <HomeContent />
}