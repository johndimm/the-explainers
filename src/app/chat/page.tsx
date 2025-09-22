'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'
import PageLayout from '@/components/PageLayout'
import { useSettings } from '@/contexts/SettingsContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useAuth } from '@/contexts/AuthContext'
import { log } from '@/utils/log'

function ChatContent() {
  const { settings, updateSettings } = useSettings()
  const { profile } = useProfile()
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [contextData, setContextData] = useState<any>(null)
  

  // Monitor settings changes
  useEffect(() => {
    // Settings changed
  }, [settings])

  // Check for context data from text selection
  useEffect(() => {
    log('Chat page: Checking for chatContext in sessionStorage')
    const storedContext = sessionStorage.getItem('chatContext')
    log('Chat page: storedContext:', storedContext)
    if (storedContext) {
      try {
        const parsedContext = JSON.parse(storedContext)
        log('Chat page: parsedContext:', parsedContext)
        setContextData(parsedContext)
        // Don't clear it immediately - let it persist for refreshes
        // It will be cleared when navigating to a new selection
      } catch (error) {
        console.error('Error parsing chat context:', error)
      }
    }
  }, [])

  // Redirect to sign-in if not authenticated (except in development)
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development'
    log('Chat page: Auth check - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'isDev:', isDev)
    if (!isLoading && !isAuthenticated && !isDev) {
      log('Chat page: Redirecting to sign-in')
      router.push('/auth/signin')
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="card text-center">
          <div className="card-body">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="m-0 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Don't render chat if not authenticated (except in development)
  const isDev = process.env.NODE_ENV === 'development'
  if (!isAuthenticated && !isDev) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="card max-w-md mx-auto text-center">
          <div className="card-body">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              🔒
            </div>
            <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-4">
              Please sign in to access the AI chat feature.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm">
              <div className="font-medium text-blue-900 mb-2">📧 Use any email address</div>
              <div className="text-blue-800">
                Don't have a Gmail account? You can use any email address (Yahoo, Outlook, company email, etc.) by creating a Google account linked to your existing email.
              </div>
            </div>
            <button
              onClick={() => router.push('/auth/signin')}
              className="btn btn-primary"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageLayout 
      title="Chat with AI"
      subtitle="Ask questions or get explanations about any text. Chat history is preserved during your session."
    >
      <div className="card">
        <div className="card-body">
          {/* User Info & Context */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {user?.email && (
                <div className="flex items-center gap-2 mb-2">
                  {user?.image && (
                    <img 
                      src={user.image} 
                      alt={user.name || 'User'} 
                      className="w-6 h-6 rounded-full border-2 border-gray-200" 
                    />
                  )}
                  <p className="m-0 text-gray-600 text-sm">
                    Signed in as {user.email}
                  </p>
                </div>
              )}
              {contextData?.bookTitle && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="m-0 text-purple-700 text-sm font-medium">
                    📖 Discussing: {contextData.bookTitle} by {contextData.author}
                  </p>
                </div>
              )}
            </div>
            {contextData && (
              <button
                onClick={() => router.push('/reader')}
                className="btn btn-secondary btn-sm"
              >
                ← Back to Reader
              </button>
            )}
          </div>
          
          <ChatInterface
            selectedText={(() => {
              const text = contextData?.selectedText || "";
              log('Chat page: Passing selectedText to ChatInterface:', text);
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
    </PageLayout>
  )
}

export default function ChatPage() {
  return <ChatContent />
}
