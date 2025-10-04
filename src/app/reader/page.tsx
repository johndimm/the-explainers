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

  return (
    <TextReader
      text={bookText}
      bookTitle={currentBook.title}
      author={currentBook.author}
      settings={settings}
      profile={profile}
      onSettingsChange={updateSettings}
    />
  )
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReaderContent />
    </Suspense>
  )
}