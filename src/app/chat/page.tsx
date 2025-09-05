'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuthenticatedProfile, AuthenticatedProfileProvider } from '@/contexts/AuthenticatedProfileContext'

function ChatContent() {
  const { settings, updateSettings } = useSettings()
  const { profile, isHydrated } = useAuthenticatedProfile()
  const router = useRouter()
  const [contextData, setContextData] = useState<any>(null)
  const [contextLoaded, setContextLoaded] = useState(false)

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
    setContextLoaded(true) // Mark context loading as complete
  }, [])

  // Calculate derived values
  const hasUnlimitedAccess = profile.hasUnlimitedAccess && profile.unlimitedAccessExpiry && new Date() < new Date(profile.unlimitedAccessExpiry)
  const hasCredits = (profile.availableCredits || 0) > 0
  const hasBookContext = contextData?.bookTitle && contextData?.author
  
  // Check if current book is purchased
  const isBookPurchased = hasBookContext ? (() => {
    const bookKey = `${contextData.bookTitle}-${contextData.author}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    console.log('Chat page: Generated bookKey:', bookKey)
    console.log('Chat page: Available purchasedBooks:', profile.purchasedBooks)
    console.log('Chat page: Book title from context:', contextData.bookTitle)
    console.log('Chat page: Author from context:', contextData.author)
    
    // Check for exact match first
    let isPurchased = profile.purchasedBooks?.includes(bookKey) || false
    console.log('Chat page: Exact match result:', isPurchased)
    
    // If not found, try some variations in case there are formatting differences
    if (!isPurchased && profile.purchasedBooks) {
      console.log('Chat page: Exact match not found, trying variations...')
      for (const purchasedBook of profile.purchasedBooks) {
        console.log('Chat page: Checking against purchased book:', purchasedBook)
        // Check if the purchased book contains the same title and author (case insensitive)
        const titleMatch = purchasedBook.includes(contextData.bookTitle.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
        const authorMatch = purchasedBook.includes(contextData.author.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
        console.log('Chat page: Title match:', titleMatch, 'Author match:', authorMatch)
        if (titleMatch && authorMatch) {
          console.log('Chat page: Found matching purchased book:', purchasedBook)
          isPurchased = true
          break
        }
      }
    }
    
    console.log('Chat page: Final isPurchased result:', isPurchased)
    return isPurchased
  })() : false
  
  console.log('Chat page: hasUnlimitedAccess:', hasUnlimitedAccess, 'hasCredits:', hasCredits, 'hasBookContext:', hasBookContext, 'isBookPurchased:', isBookPurchased)
  
  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    // Only redirect if we're sure the context data has been loaded and there's no access
    if (contextLoaded && !hasUnlimitedAccess && !hasCredits && !isBookPurchased && !hasBookContext) {
      console.log('Chat page: No credits, no unlimited access, no purchased book, no book context - redirecting to credits')
      router.push('/credits')
    }
  }, [contextLoaded, hasUnlimitedAccess, hasCredits, isBookPurchased, hasBookContext, router])

  // Show loading while profile data and context data are being loaded
  if (!isHydrated || !contextLoaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#666', margin: 0 }}>Loading...</p>
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
  
  // If no unlimited access, no credits, not purchased, but has book context, check if free explanations are available
  // Note: We don't redirect immediately here to allow users to read their last response
  // The ChatInterface component will handle preventing new requests when limits are reached
  if (!hasUnlimitedAccess && !hasCredits && !isBookPurchased && hasBookContext) {
    const bookKey = `${contextData.bookTitle}-${contextData.author}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const bookExplanationsUsed = profile.bookExplanations?.[bookKey] || 0
    
    if (bookExplanationsUsed >= 3) {
      console.log('Chat page: All free explanations used, but allowing user to stay on page to read response')
      // Don't redirect - let user read their response
      // The ChatInterface will prevent new requests
    }
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
            {contextData && (
              <button
                type="button"
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
  return (
    <AuthenticatedProfileProvider>
      <ChatContent />
    </AuthenticatedProfileProvider>
  )
}