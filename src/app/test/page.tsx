'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function TestPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleTestCallback = () => {
    router.push('/test-callback')
  }

  const handleTestSignIn = () => {
    setIsLoading(true)
    
    // Test local OAuth
    const baseUrl = window.location.origin
    const authUrl = `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(baseUrl + '/test-callback')}`
    
    // Open in same window for testing
    window.location.href = authUrl
  }

  const handleTestProductionSignIn = () => {
    setIsLoading(true)
    
    // Test production OAuth
    const productionUrl = 'https://romeo-and-juliet-explained.vercel.app'
    const authUrl = `${productionUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(productionUrl + '/test-callback')}`
    
    // Open in same window for testing
    window.location.href = authUrl
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
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>
            🧪
          </div>
          
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            OAuth Test Page
          </h1>
          
          <p style={{
            margin: '0 0 0 0',
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Test the OAuth flow and callback handling
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gap: '16px',
          marginBottom: '30px'
        }}>
          <button
            onClick={handleTestCallback}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#4B5563'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#6B7280'
            }}
          >
            Go to Callback Test Page
          </button>
          
          <button
            onClick={handleTestSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? 'Testing...' : 'Test Local OAuth'}
          </button>
          
          <button
            onClick={handleTestProductionSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? 'Testing...' : 'Test Production OAuth'}
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
            Current Environment
          </h3>
          
          <div style={{
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#666',
            lineHeight: '1.6'
          }}>
            <div><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</div>
            <div><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}</div>
            <div><strong>Platform:</strong> {typeof window !== 'undefined' && (window as any).Capacitor ? (window as any).Capacitor.getPlatform() : 'Web'}</div>
            <div><strong>Is Capacitor:</strong> {typeof window !== 'undefined' && !!(window as any).Capacitor ? 'Yes' : 'No'}</div>
          </div>
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
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#8B5CF6'
              e.currentTarget.style.color = 'white'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = '#8B5CF6'
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
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#6B7280'
              e.currentTarget.style.color = 'white'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = '#6B7280'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}