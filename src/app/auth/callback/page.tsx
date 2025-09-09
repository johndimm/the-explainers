'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { log } from '@/utils/log'

export default function AuthCallback() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    log('AuthCallback: Component mounted')
    log('AuthCallback: Session status:', status)
    log('AuthCallback: Session data:', session)

    const handleCallback = async () => {
      try {
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (status === 'authenticated' && session?.user) {
          log('AuthCallback: Authentication successful, redirecting to chat')
          router.push('/chat')
        } else if (status === 'unauthenticated') {
          log('AuthCallback: Authentication failed, redirecting to sign-in')
          router.push('/auth/signin')
        }
        // If status is 'loading', we'll wait for it to change
      } catch (error) {
        log('AuthCallback: Error during callback processing:', error)
        router.push('/auth/signin')
      } finally {
        setIsProcessing(false)
      }
    }

    if (status !== 'loading') {
      handleCallback()
    }

    // Add timeout to prevent infinite loops
    const timeout = setTimeout(() => {
      if (isProcessing) {
        log('AuthCallback: Timeout reached, redirecting to sign-in')
        router.push('/auth/signin')
        setIsProcessing(false)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [status, session, router, isProcessing])

  // Show loading while processing
  if (isProcessing || status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ margin: 0, color: '#666' }}>Completing sign-in...</p>
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

  return null
}
