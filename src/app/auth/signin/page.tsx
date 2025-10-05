'use client'
import { log } from '@/utils/log'

import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

export default function SignIn() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [hasStoredContext, setHasStoredContext] = useState(false)

  useEffect(() => {
    // Detect iOS devices
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent)
    setIsIOS(isIOSDevice)
    
    // Check if there's stored chat context
    const storedContext = sessionStorage.getItem('chatContext')
    setHasStoredContext(!!storedContext)
  }, [])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      // For mobile, stay within the app webview
      if (Capacitor.isNativePlatform()) {
        const baseUrl = 'https://romeo-and-juliet-explained.vercel.app'
        const redirectUrl = `${baseUrl}/auth/callback`
        const googleAuthUrl = `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(redirectUrl)}`
        
        // Navigate within the app webview (don't open external browser)
        window.location.href = googleAuthUrl
      } else {
        // For web, use regular NextAuth
        await signIn('google', { 
          callbackUrl: '/chat',
          redirect: true
        })
      }
    } catch (error) {
      log('ui','Sign in error:', error)
      setIsLoading(false)
    }
  }

  const handleMobileGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      // For iOS, clear cookies only (no localStorage)
      if (isIOS) {
        // Clear NextAuth cookies specifically
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        })
        
        // Add a delay to ensure clearing is complete
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      await signIn('google', { 
        callbackUrl: '/chat',
        redirect: true
      })
    } catch (error) {
      log('ui','iOS Sign in error:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/chat')
      }
    })
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fafafa',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: '600',
          color: '#1a1a1a'
        }}>
          The Explainers
        </h1>
        <p style={{
          margin: '0 0 24px 0',
          color: '#666',
          fontSize: '16px'
        }}>
          Sign in to access the AI chat feature
        </p>
        
        {hasStoredContext && (
          <div style={{
            background: '#e0f2fe',
            border: '1px solid #0288d1',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#01579b'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
              📝 Your selected text is saved
            </div>
            <div>
              After signing in, you'll be taken directly to chat with your selected text ready to explain.
            </div>
          </div>
        )}
        
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#495057',
          textAlign: 'left'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#212529' }}>
            📧 Use any email address
          </div>
          <div style={{ lineHeight: '1.4' }}>
            Don't have a Gmail account? No problem! You can use any email address (Yahoo, Outlook, company email, etc.) by creating a Google account linked to your existing email.
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
            <strong>Quick setup:</strong> Visit <a href="https://accounts.google.com/signup" target="_blank" rel="noopener noreferrer" style={{ color: '#4285f4', textDecoration: 'none' }}>accounts.google.com</a> and choose "Use my current email address instead"
          </div>
        </div>
        
        {isIOS && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            <strong>iPhone users:</strong> If authentication doesn't work, try the cache clearing option below.
            <button
              onClick={() => {
                // Clear cookies only (no localStorage)
                document.cookie.split(";").forEach(function(c) { 
                  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                })
                window.location.reload()
              }}
              style={{
                display: 'block',
                marginTop: '8px',
                padding: '8px 16px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Cache & Reload
            </button>
          </div>
        )}
        
        <button
          onClick={isIOS ? handleMobileGoogleSignIn : handleGoogleSignIn}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = '#3367d6'
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = '#4285f4'
            }
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Signing in...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>
        
        <p style={{
          margin: '24px 0 0 0',
          fontSize: '14px',
          color: '#999'
        }}>
          You can still read books without signing in
        </p>
        
        <button
          onClick={() => router.push('/reader')}
          style={{
            marginTop: '16px',
            background: 'none',
            border: '1px solid #e0e0e0',
            color: '#666',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Continue as Guest
        </button>
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
