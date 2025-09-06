'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'
import { useSettings } from '@/contexts/SettingsContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useAuth } from '@/contexts/AuthContext'

function ChatContent() {
  const { settings, updateSettings } = useSettings()
  const { profile } = useProfile()
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [contextData, setContextData] = useState<any>(null)

  // Check for context data from text selection
  useEffect(() => {
    console.log('Chat page: Checking for chatContext in sessionStorage')
    const storedContext = sessionStorage.getItem('chatContext')
    console.log('Chat page: storedContext:', storedContext)
    if (storedContext) {
      try {
        const parsedContext = JSON.parse(storedContext)
        console.log('Chat page: parsedContext:', parsedContext)
        setContextData(parsedContext)
        // Don't clear it immediately - let it persist for refreshes
        // It will be cleared when navigating to a new selection
      } catch (error) {
        console.error('Error parsing chat context:', error)
      }
    }
  }, [])

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading state while checking authentication
  if (isLoading) {
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
          <p style={{ margin: 0, color: '#666' }}>Loading...</p>
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

  // Don't render chat if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div>
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-padding {
            padding: 8px !important;
          }
          .mobile-card {
            border-radius: 12px !important;
            padding: 16px !important;
          }
        }
      `}</style>
      
      <div style={{ 
        marginTop: '0', 
        minHeight: 'calc(100vh - 60px)', 
        padding: '20px', 
        background: '#fafafa' 
      }} className="mobile-padding">
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column'
        }} className="mobile-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600', color: '#1a1a1a' }}>
                Chat with AI
              </h2>
              {user?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {user?.image && (
                    <img 
                      src={user.image} 
                      alt={user.name || 'User'} 
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%',
                        border: '2px solid #e0e0e0'
                      }} 
                    />
                  )}
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                    Signed in as {user.email}
                  </p>
                </div>
              )}
              {contextData?.bookTitle && (
                <p style={{ margin: '0', color: '#8b5cf6', fontSize: '14px', fontWeight: '500' }}>
                  Discussing: {contextData.bookTitle} by {contextData.author}
                </p>
              )}
            </div>
            {contextData && (
              <button
                onClick={() => router.push('/reader')}
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#7c3aed'}
                onMouseOut={(e) => e.currentTarget.style.background = '#8b5cf6'}
              >
                ← Back to Reader
              </button>
            )}
          </div>
          <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '16px' }}>
            Ask questions or get explanations about any text. Chat history is preserved during your session.
          </p>
          
          <ChatInterface
            selectedText={(() => {
              const text = contextData?.selectedText || "";
              console.log('Chat page: Passing selectedText to ChatInterface:', text);
              return text;
            })()}
            contextInfo={contextData?.contextInfo || null}
            settings={settings}
            profile={profile}
            onClose={() => router.push('/reader')}
            onSettingsChange={updateSettings}
            bookTitle={contextData?.bookTitle || ""}
            author={contextData?.author || ""}
            isPageMode={true}
          />
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return <ChatContent />
}