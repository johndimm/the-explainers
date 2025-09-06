'use client'

import { signIn, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ErrorBoundary from '@/components/ErrorBoundary'

function SignInContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if we're returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search)
    const hasCallbackParams = urlParams.has('callbackUrl') || urlParams.has('error') || urlParams.has('code')
    
    console.log('🔐 Sign-in page loaded:', {
      currentUrl: window.location.href,
      hasCallbackParams,
      callbackUrl: urlParams.get('callbackUrl'),
      error: urlParams.get('error'),
      code: urlParams.get('code'),
      timestamp: new Date().toISOString()
    })
    
    // Check simple session
    const checkSession = async () => {
      console.log('🔐 Checking simple session...')
      try {
        const response = await fetch('/api/oauth/session')
        const data = await response.json()
        
        console.log('🔐 Simple session check:', {
          hasUser: !!data.user,
          userEmail: data.user?.email,
          userName: data.user?.name,
          timestamp: new Date().toISOString()
        })
        
        if (data.user) {
          console.log('🔐 User already signed in, redirecting to library')
          router.push('/library')
        } else {
          console.log('🔐 No session found')
        }
      } catch (error) {
        console.error('🔐 Error checking simple session:', error)
      }
    }
    
    // Check immediately
    checkSession()
    
    // Check multiple times to catch OAuth callbacks
    const timeoutId1 = setTimeout(checkSession, 1000)
    const timeoutId2 = setTimeout(checkSession, 3000)
    const timeoutId3 = setTimeout(checkSession, 5000)
    
    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      clearTimeout(timeoutId3)
    }
    
    // Add client-side environment debugging
    console.log('🔐 Client-side environment check:', {
      currentUrl: window.location.href,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      timestamp: new Date().toISOString()
    })
    
    // Test NextAuth availability
    console.log('🔐 NextAuth availability check:', {
      hasSignIn: typeof signIn === 'function',
      hasGetSession: typeof getSession === 'function',
      signInType: typeof signIn,
      getSessionType: typeof getSession,
      windowLocation: window.location.href,
      isSecureContext: window.isSecureContext,
      hasLocalStorage: typeof localStorage !== 'undefined',
      hasSessionStorage: typeof sessionStorage !== 'undefined'
    })
    
    // Skip server tests on mobile to avoid "This site can't be reached" errors
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Test if we can make a basic fetch request (desktop only)
      fetch('/api/auth/csrf')
        .then(response => {
          console.log('🔐 CSRF test successful:', response.status)
          return response.text()
        })
        .then(text => {
          console.log('🔐 CSRF response:', text)
        })
        .catch(error => {
          console.error('🔐 CSRF test failed:', error)
        })
      
      // Test session endpoint specifically (desktop only)
      fetch('/api/auth/session')
        .then(response => {
          console.log('🔐 Session test successful:', response.status)
          return response.json()
        })
        .then(data => {
          console.log('🔐 Session response:', data)
        })
        .catch(error => {
          console.error('🔐 Session test failed:', error)
        })
      
      // Test basic API connectivity first (desktop only)
      fetch(`${window.location.origin}/api/test`)
        .then(response => {
          console.log('🔐 Basic API test successful:', response.status)
          return response.json()
        })
        .then(data => {
          console.log('🔐 Basic API response:', data)
        })
        .catch(error => {
          console.error('🔐 Basic API test failed:', error)
        })
      
      // Test NextAuth specifically (desktop only)
      fetch(`${window.location.origin}/api/test-nextauth`)
        .then(response => {
          console.log('🔐 NextAuth API test successful:', response.status)
          return response.json()
        })
        .then(data => {
          console.log('🔐 NextAuth API response:', data)
        })
        .catch(error => {
          console.error('🔐 NextAuth API test failed:', error)
        })
    }
    
    // Skip server tests on mobile to avoid "This site can't be reached" errors
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Test the direct signin endpoint only on desktop
      const signinUrl = `${window.location.origin}/api/auth/signin/google`
      console.log('🔐 Testing signin URL:', signinUrl)
      
      fetch(signinUrl)
        .then(response => {
          console.log('🔐 Direct signin test successful:', response.status, response.url)
          if (response.redirected) {
            console.log('🔐 Redirected to:', response.url)
          }
          return response.text()
        })
        .then(text => {
          console.log('🔐 Direct signin response:', text.substring(0, 200) + '...')
        })
        .catch(error => {
          console.error('🔐 Direct signin test failed:', error)
        })
    }
  }, [router])


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '48px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          Welcome to The Explainers
        </h1>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '32px',
          fontSize: '16px'
        }}>
          Sign in to access your credits, purchases, and reading history across all your devices.
        </p>

        {/* NextAuth Google button */}
        <button
          onClick={() => {
            console.log('🔐 NextAuth Google button clicked')
            setIsLoading(true)
            signIn('google', { callbackUrl: '/library' })
          }}
          onTouchEnd={(e) => {
            // Prevent double-tap on mobile
            e.preventDefault()
            if (!isLoading) {
              console.log('🔐 NextAuth Google button clicked (touch)')
              setIsLoading(true)
              signIn('google', { callbackUrl: '/library' })
            }
          }}
          disabled={isLoading}
          type="button"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px 24px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            transition: 'all 0.2s',
            // Mobile-specific styles
            minHeight: '48px', // Minimum touch target size
            touchAction: 'manipulation', // Prevent double-tap zoom
            WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
            WebkitTouchCallout: 'none', // Disable callout on iOS
            WebkitUserSelect: 'none', // Disable text selection
            userSelect: 'none',
            marginBottom: '12px'
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Signing in...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>


        {/* Debug session check button */}
        <button
          onClick={async () => {
            console.log('🔐 Manual simple session check...')
            try {
              const response = await fetch('/api/oauth/session')
              const data = await response.json()
              console.log('🔐 Manual simple session result:', data)
              if (data.user) {
                alert(`🔐 Session found!\n\nUser: ${data.user.name}\nEmail: ${data.user.email}`)
                router.push('/library')
              } else {
                alert('🔐 No session found')
              }
            } catch (error) {
              console.error('🔐 Manual session check error:', error)
              alert(`🔐 Session check error: ${error}`)
            }
          }}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Check Session (Debug)
        </button>

        <p style={{
          marginTop: '24px',
          fontSize: '14px',
          color: '#9ca3af'
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
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

export default function SignIn() {
  return (
    <ErrorBoundary>
      <SignInContent />
    </ErrorBoundary>
  )
}
