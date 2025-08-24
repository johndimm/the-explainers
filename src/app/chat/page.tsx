'use client'

import { useState, useEffect } from 'react'
import ChatInterface from '@/components/ChatInterface'
import { useSettings } from '@/contexts/SettingsContext'
import { useProfile } from '@/contexts/ProfileContext'
import { debugChat, debugContext } from '@/utils/debug'

function ChatContent() {
  const { settings, updateSettings } = useSettings()
  const { profile } = useProfile()
  const [contextData, setContextData] = useState<any>(null)


  // Check for context data from text selection
  useEffect(() => {
    const checkForNewContext = () => {
      debugChat(' Checking for chatContext in sessionStorage')
      const storedContext = sessionStorage.getItem('chatContext')
      debugChat(' storedContext:', storedContext)
      if (storedContext) {
        try {
          const parsedContext = JSON.parse(storedContext)
          debugChat(' parsedContext:', parsedContext)
          
          // Only update if it's different from current context
          if (!contextData || 
              contextData.selectedText !== parsedContext.selectedText ||
              contextData.bookTitle !== parsedContext.bookTitle) {
            setContextData(parsedContext)
          }
        } catch (error) {
          console.error('Error parsing chat context:', error)
        }
      }
    }
    
    // Check immediately when component mounts
    checkForNewContext()
    
    // Also check when the page becomes visible (user comes back from reader)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForNewContext()
      }
    }
    
    // Listen for custom event when new context is added while already on chat page
    const handleNewChatContext = (event: CustomEvent) => {
      debugContext('Received newChatContext event:', event.detail)
      setContextData(event.detail)
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('newChatContext', handleNewChatContext as EventListener)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('newChatContext', handleNewChatContext as EventListener)
    }
  }, [contextData])

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
        minHeight: '100vh', 
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
          </div>
          
          {contextData?.selectedText && (
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                    Selected Quote:
                  </h4>
                  <p style={{ margin: '0', fontSize: '14px', fontStyle: 'italic', color: '#6c757d' }}>
                    "{contextData.selectedText}"
                  </p>
                </div>
                <button
                  onClick={() => {
                    const encodedQuote = encodeURIComponent(contextData.selectedText)
                    const url = `https://www.playphrase.me/#/search?q=${encodedQuote}&pos=0&language=en`
                    window.open(url, '_blank')
                  }}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#218838'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#28a745'}
                >
                  🎬 Find in Movies
                </button>
              </div>
            </div>
          )}
          
          <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '16px' }}>
            Ask questions or get explanations about any text. Chat history is preserved during your session.
          </p>
          
          <ChatInterface
            selectedText={(() => {
              const text = contextData?.selectedText || "";
              debugChat(' Passing selectedText to ChatInterface:', text);
              return text;
            })()}
            contextInfo={contextData?.contextInfo || null}
            settings={settings}
            profile={profile}
            onClose={() => {}}
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