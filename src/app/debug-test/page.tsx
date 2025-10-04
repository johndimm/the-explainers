'use client'

import { useState, useEffect } from 'react'

export default function DebugTest() {
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
      navigator: typeof navigator === 'object',
      timestamp: new Date().toISOString()
    }
    setDebugInfo(info)
  }, [])

  const handleTestProductionOAuth = () => {
    const productionUrl = 'https://romeo-and-juliet-explained.vercel.app'
    const authUrl = `${productionUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(productionUrl + '/test-callback')}`
    
    console.log('Testing Production OAuth with URL:', authUrl)
    
    try {
      window.open(authUrl, '_system')
    } catch (error) {
      console.error('Production OAuth failed:', error)
      alert('Production OAuth failed: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleTestLocalOAuth = () => {
    const localUrl = window.location.origin
    const authUrl = `${localUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(localUrl + '/test-callback')}`
    
    console.log('Testing Local OAuth with URL:', authUrl)
    
    try {
      window.open(authUrl, '_system')
    } catch (error) {
      console.error('Local OAuth failed:', error)
      alert('Local OAuth failed: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleTestWindowOpen = () => {
    try {
      console.log('Testing window.open with Google')
      window.open('https://www.google.com', '_system')
    } catch (error) {
      console.error('window.open failed:', error)
      alert('window.open failed: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleTestLocationHref = () => {
    try {
      console.log('Testing window.location.href with Google')
      window.location.href = 'https://www.google.com'
    } catch (error) {
      console.error('window.location.href failed:', error)
      alert('window.location.href failed: ' + (error instanceof Error ? error.message : String(error)))
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
            🔧
          </div>
          
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            Debug Test Page
          </h1>
          
          <p style={{
            margin: '0 0 0 0',
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Test OAuth and window.open functionality
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gap: '12px',
          marginBottom: '30px'
        }}>
          <button
            onClick={handleTestProductionOAuth}
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
            Test Production OAuth
          </button>
          
          <button
            onClick={handleTestLocalOAuth}
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
            Test Local OAuth
          </button>
          
          <button
            onClick={handleTestWindowOpen}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Test window.open (Google)
          </button>
          
          <button
            onClick={handleTestLocationHref}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Test location.href (Google)
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
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#666',
              lineHeight: '1.4',
              background: '#fff',
              padding: '15px',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '400px'
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
            onClick={() => window.location.href = '/reader'}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: '2px solid #8B5CF6',
              color: '#8B5CF6',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Go to Reader
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: '2px solid #6B7280',
              color: '#6B7280',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}