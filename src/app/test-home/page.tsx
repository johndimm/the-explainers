'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function TestHome() {
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    // Collect debug information
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isCapacitor: !!(window as any).Capacitor,
      capacitorPlatform: (window as any).Capacitor?.getPlatform ? (window as any).Capacitor.getPlatform() : 'unknown',
      url: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      windowOpen: typeof window.open === 'function',
      windowLocation: typeof window.location === 'object',
      navigator: typeof navigator === 'object'
    }
    setDebugInfo(info)
  }, [])

  const handleTestOAuth = () => {
    // Test OAuth with production URL
    const productionUrl = 'https://romeo-and-juliet-explained.vercel.app'
    const authUrl = `${productionUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(productionUrl + '/test-callback')}`
    
    console.log('Attempting OAuth with URL:', authUrl)
    
    // Try different methods to open the URL
    try {
      // Method 1: window.open with _system
      window.open(authUrl, '_system')
    } catch (error) {
      console.error('Method 1 failed:', error)
      try {
        // Method 2: window.location.href
        window.location.href = authUrl
      } catch (error2) {
        console.error('Method 2 failed:', error2)
        alert('Failed to open OAuth URL: ' + (error2 instanceof Error ? error2.message : String(error2)))
      }
    }
  }

  const handleTestLocalOAuth = () => {
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
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            🧪
          </div>
          
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            Mobile OAuth Test
          </h1>
          
          <p style={{
            margin: '0 0 0 0',
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Test OAuth flow on mobile device
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gap: '16px',
          marginBottom: '30px'
        }}>
          <button
            onClick={handleTestOAuth}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Test Production OAuth
          </button>
          
          <button
            onClick={handleTestLocalOAuth}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Test Local OAuth
          </button>
        </div>
        
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#495057'
          }}>
            Debug Information
          </h3>
          
          {debugInfo ? (
            <div style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#666',
              lineHeight: '1.6',
              background: '#fff',
              padding: '15px',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          ) : (
            <div>Loading debug information...</div>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => router.push('/reader')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: '2px solid #8B5CF6',
              color: '#8B5CF6',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Go to Reader
          </button>
          
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: '2px solid #6B7280',
              color: '#6B7280',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}