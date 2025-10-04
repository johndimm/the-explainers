'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import TextReader from '@/components/TextReader'
import { useSettings } from '@/contexts/SettingsContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { log } from '@/utils/log'
import { useTheme } from '@/hooks/useTheme'
import { loadSinglePlayText } from '@/utils/singlePlayLoader'
import { getSinglePlayConfig } from '@/utils/themeConfig'

function ReaderContent() {
  const [bookText, setBookText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentBook, setCurrentBook] = useState({ title: '', author: '' })
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { settings, updateSettings } = useSettings()
  const { profile } = useProfile()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { isSinglePlay, playTitle, playAuthor, playFilename } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

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

  useEffect(() => {
log('ui','Reader: Auth state - isLoading:', authLoading, 'isAuthenticated:', isAuthenticated)
log('ui','Reader: Single play mode:', isSinglePlay, 'playTitle:', playTitle)
    
    // In local development, bypass authentication loading
    const isLocalDev = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
    
    // Don't try to load anything until authentication is resolved (unless in local dev)
    if (authLoading && !isLocalDev) {
log('ui','Reader: Waiting for authentication...')
      return
    }

    // Check URL parameters for book selection
    const title = searchParams.get('title')
    const author = searchParams.get('author') 
    const url = searchParams.get('url')

    if (title && author && url) {
      handleBookSelect(title, author, decodeURIComponent(url))
      return
    }

    // Handle single play mode
    if (isSinglePlay) {
      loadSinglePlay()
      return
    }

    // Check if there's a saved current book
    const loadCurrentBook = async () => {
      try {
        // Load from database only
        const response = await fetch('/api/user/current-book')
log('ui','Reader: Current book API response status:', response.status)
        
        if (response.ok) {
          const dbBook = await response.json()
log('ui','Reader: Restoring saved book from database:', dbBook)
          
          if (dbBook.url) {
            handleBookSelect(dbBook.title, dbBook.author, dbBook.url)
            return
          }
        } else {
log('ui','Reader: No current book found, status:', response.status)
        }
      } catch (error) {
        log('ui','Reader: Error loading current book from database:', error)
      }
      
log('ui','Reader: Redirecting to library - no current book found')
      router.push('/library')
    }

    loadCurrentBook()
  }, [searchParams, router, authLoading, isSinglePlay, playTitle, playAuthor, playFilename])

  const loadSinglePlay = async () => {
    setLoading(true)
    setCurrentBook({ title: playTitle, author: playAuthor })
    
    try {
      const singlePlayConfig = getSinglePlayConfig()
      const playTextData = await loadSinglePlayText(singlePlayConfig)
      
      log('ui', 'Reader: Loaded single play text:', {
        title: playTitle,
        textLength: playTextData.text.length,
        firstChars: playTextData.text.substring(0, 100)
      })
      
      setBookText(playTextData.text)
    } catch (error) {
      log('ui', 'Reader: Error loading single play:', error)
      alert('Failed to load the play. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBookSelect = async (title: string, author: string, url: string) => {
    setLoading(true)
    const newBook = { title, author, url }
    setCurrentBook({ title, author })
    
    // Save to database
    try {
      await fetch('/api/user/current-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      })
    } catch (error) {
      log('ui','Error saving current book to database:', error)
    }
    
    // Dispatch custom event to notify header of the change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('currentBookChanged', { 
        detail: { title, author } 
      }))
    }
    
    try {
      let text: string
      const isHtmlFile = url.toLowerCase().endsWith('.html')
      
      if (url.startsWith('blob:') || url.startsWith('/')) {
        // Handle local files and blob URLs directly
        const response = await fetch(url)
        text = await response.text()
        
        if (isHtmlFile) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(text, 'text/html')
          text = doc.body.textContent || doc.documentElement.textContent || text
        }
      } else {
        // Route external URLs through our API to avoid CORS
        const response = await fetch('/api/download-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to download: ${response.statusText}`)
        }
        
        text = await response.text()
        
        if (isHtmlFile) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(text, 'text/html')
          text = doc.body.textContent || doc.documentElement.textContent || text
        }
      }
      
      log('Setting book text:', {
        textLength: text.length,
        firstChars: text.substring(0, 100),
        hasNewlines: text.includes('\n'),
        newlineCount: (text.match(/\n/g) || []).length
      })
      setBookText(text)
    } catch (error) {
      log('ui','Error loading book:', error)
      alert('Failed to load book. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show test interface instead of normal content
  console.log('READER PAGE: Rendering test interface')
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
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            🔧
          </div>
          
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            OAuth Test Interface
          </h1>
          
          <p style={{
            margin: '0 0 0 0',
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Test OAuth and window.open functionality
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gap: '12px',
          marginBottom: '30px'
        }}>
          <button
            onClick={() => {
              const productionUrl = 'https://romeo-and-juliet-explained.vercel.app'
              const authUrl = `${productionUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(productionUrl + '/test-callback')}`
              console.log('Testing Production OAuth with URL:', authUrl)
              try {
                window.open(authUrl, '_system')
              } catch (error) {
                console.error('Production OAuth failed:', error)
                alert('Production OAuth failed: ' + (error instanceof Error ? error.message : String(error)))
              }
            }}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Test Production OAuth
          </button>
          
          <button
            onClick={() => {
              const localUrl = window.location.origin
              const authUrl = `${localUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(localUrl + '/test-callback')}`
              console.log('Testing Local OAuth with URL:', authUrl)
              try {
                window.open(authUrl, '_system')
              } catch (error) {
                console.error('Local OAuth failed:', error)
                alert('Local OAuth failed: ' + (error instanceof Error ? error.message : String(error)))
              }
            }}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Test Local OAuth
          </button>
          
          <button
            onClick={() => {
              console.log('Testing window.open with Google')
              try {
                window.open('https://www.google.com', '_system')
              } catch (error) {
                console.error('window.open failed:', error)
                alert('window.open failed: ' + (error instanceof Error ? error.message : String(error)))
              }
            }}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Test window.open (Google)
          </button>
          
          <button
            onClick={() => {
              console.log('Testing window.location.href with Google')
              try {
                window.location.href = 'https://www.google.com'
              } catch (error) {
                console.error('window.location.href failed:', error)
                alert('window.location.href failed: ' + (error instanceof Error ? error.message : String(error)))
              }
            }}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Test location.href (Google)
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
            Debug Information
          </h3>
          
          <div style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#666',
            lineHeight: '1.4',
            background: '#fff',
            padding: '15px',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            <div><strong>Platform:</strong> {typeof window !== 'undefined' && (window as any).Capacitor ? (window as any).Capacitor.getPlatform() : 'Web'}</div>
            <div><strong>Is Capacitor:</strong> {typeof window !== 'undefined' && !!(window as any).Capacitor ? 'Yes' : 'No'}</div>
            <div><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</div>
            <div><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}</div>
            <div><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Loading...'}</div>
            <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => {
              // Restore normal reader functionality
              setLoading(false)
              setBookText('This is a test of the reader functionality. The OAuth test interface has been replaced with normal reader content.')
              setCurrentBook({ title: 'Test Book', author: 'Test Author' })
            }}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: '2px solid #8B5CF6',
              color: '#8B5CF6',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Show Normal Reader
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReaderContent />
    </Suspense>
  )
}