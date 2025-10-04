'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function MobileSignIn() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = () => {
    setIsLoading(true)
    
    // For mobile, redirect to the production URL for authentication
    const productionUrl = 'https://romeo-and-juliet-explained.vercel.app'
    const authUrl = `${productionUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(productionUrl + '/reader')}`
    
    // Use window.location.href to force a full page redirect
    window.location.href = authUrl
  }

  const handleSkipAuth = () => {
    // Skip authentication and go directly to reader
    router.push('/reader')
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
          Understand Shakespeare's timeless tragedy with AI-powered explanations
        </p>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)'
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Opening Browser...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
          
          <button
            onClick={handleSkipAuth}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: 'none',
              border: '2px solid #8B5CF6',
              color: '#8B5CF6',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
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
            Continue without Sign-in
          </button>
        </div>
        
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.4'
        }}>
          <strong>Sign-in benefits:</strong> Save your progress, access chat features, and get personalized explanations.
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}