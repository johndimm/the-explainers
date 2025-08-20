'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import ChatInterface from '@/components/ChatInterface'
import { useSettings } from '@/contexts/SettingsContext'
import { useProfile } from '@/contexts/ProfileContext'

function ChatContent() {
  const { settings, updateSettings } = useSettings()
  const { profile } = useProfile()
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [contextData, setContextData] = useState<any>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMobileMenu])

  // Check for context data from text selection
  useEffect(() => {
    const storedContext = sessionStorage.getItem('chatContext')
    if (storedContext) {
      try {
        const parsedContext = JSON.parse(storedContext)
        setContextData(parsedContext)
        // Clear it so it doesn't persist on refresh
        sessionStorage.removeItem('chatContext')
      } catch (error) {
        console.error('Error parsing chat context:', error)
      }
    }
  }, [])

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
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '8px 12px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#333',
            lineHeight: '1.2'
          }}>
            The Explainers
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '11px', 
            color: '#666',
            lineHeight: '1.2'
          }}>
            Chat with AI
          </p>
        </div>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#333'
            }}
          >
            ☰
          </button>
          
          {showMobileMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '160px',
              zIndex: 1000
            }}>
              <button 
                onClick={() => {
                  router.push('/reader')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📖 Reader
              </button>
              <button 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  color: '#666'
                }}
              >
                💬 Chat (current)
              </button>
              <button 
                onClick={() => {
                  router.push('/library')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📚 Library
              </button>
              <button 
                onClick={() => {
                  router.push('/styles')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                🎭 Styles
              </button>
              <button 
                onClick={() => {
                  router.push('/credits')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                💳 Credits
              </button>
              <button 
                onClick={() => {
                  router.push('/profile')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                👤 Profile
              </button>
              <button 
                onClick={() => {
                  router.push('/settings')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                ⚙️ Settings
              </button>
              <button 
                onClick={() => {
                  router.push('/guide')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                📖 User Guide
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div style={{ 
        marginTop: '60px', 
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
            selectedText={contextData?.selectedText || ""}
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
  return (
    <ProfileProvider>
      <SettingsProvider>
        <ChatContent />
      </SettingsProvider>
    </ProfileProvider>
  )
}