'use client'

import { useState, useEffect, Suspense } from 'react'
import TextReader from '@/components/TextReader'
import { useSettings } from '@/contexts/SettingsContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { debugBook } from '@/utils/debug'

interface ReaderContentProps {
  showHeader?: boolean
}

// Global singleton to persist reader state across ALL navigations and component recreations
class ReaderStateManager {
  private static instance: ReaderStateManager | null = null
  
  public bookText: string = ''
  public currentBook: { title: string; author: string; url?: string } = { title: '', author: '' }
  public loading: boolean = false
  public timestamp: number = 0
  
  public static getInstance(): ReaderStateManager {
    if (!ReaderStateManager.instance) {
      ReaderStateManager.instance = new ReaderStateManager()
    }
    return ReaderStateManager.instance
  }
  
  public updateState(bookText: string, currentBook: { title: string; author: string; url?: string }) {
    this.bookText = bookText
    this.currentBook = currentBook
    this.loading = false
    this.timestamp = Date.now()
    console.log('[ReaderStateManager] State updated:', { 
      textLength: bookText.length, 
      book: currentBook, 
      timestamp: this.timestamp 
    })
  }
  
  public hasValidCache(maxAgeMs = 30000): boolean {
    const age = Date.now() - this.timestamp
    const isValid = this.timestamp > 0 && age < maxAgeMs && this.bookText.length > 0
    console.log('[ReaderStateManager] Cache check:', { 
      hasTimestamp: this.timestamp > 0, 
      age, 
      maxAge: maxAgeMs, 
      hasText: this.bookText.length > 0, 
      isValid 
    })
    return isValid
  }
}

// Global singleton instance
const readerStateManager = ReaderStateManager.getInstance()

// Legacy cache object for compatibility (now uses singleton)
let readerCache = {
  get bookText() { return readerStateManager.bookText },
  get currentBook() { return readerStateManager.currentBook },
  get loading() { return readerStateManager.loading },
  get timestamp() { return readerStateManager.timestamp },
  set bookText(value: string) { readerStateManager.bookText = value },
  set currentBook(value: { title: string; author: string; url?: string }) { readerStateManager.currentBook = value },
  set loading(value: boolean) { readerStateManager.loading = value },
  set timestamp(value: number) { readerStateManager.timestamp = value }
}

function ReaderContentInner({ showHeader = false }: ReaderContentProps) {
  // Create a unique component ID to track individual component instances
  const [componentId] = useState(() => Math.random().toString(36).substr(2, 9))
  
  // Initialize state from singleton cache
  const initializeFromCache = () => {
    console.log(`[ReaderContent-${componentId}] UPDATED: Initializing from singleton cache`)
    
    if (readerStateManager.hasValidCache()) {
      console.log(`[ReaderContent-${componentId}] USING SINGLETON CACHE:`, readerStateManager.currentBook)
      return {
        bookText: readerStateManager.bookText,
        loading: false,
        currentBook: readerStateManager.currentBook
      }
    }
    console.log(`[ReaderContent-${componentId}] NO VALID CACHE - starting fresh`)
    return {
      bookText: '',
      loading: true,
      currentBook: { title: '', author: '' }
    }
  }

  const initial = initializeFromCache()
  const [bookText, setBookText] = useState(initial.bookText)
  const [loading, setLoading] = useState(initial.loading)
  const [currentBook, setCurrentBook] = useState(initial.currentBook)
  const [debugMsg, setDebugMsg] = useState('')
  const { settings, updateSettings } = useSettings()
  const { profile } = useProfile()
  const router = useRouter()
  const searchParams = useSearchParams()

  console.log(`[ReaderContent-${componentId}] RENDER - bookText: ${bookText.length} chars, loading: ${loading}, currentBook:`, currentBook)

  // Track component lifecycle
  useEffect(() => {
    console.log(`[ReaderContent-${componentId}] MOUNTED`)
    return () => {
      console.log(`[ReaderContent-${componentId}] UNMOUNTING`)
    }
  }, [componentId])

  useEffect(() => {
    // FIRST: Check URL parameters for book selection (highest priority)
    const title = searchParams.get('title')
    const author = searchParams.get('author')
    const url = searchParams.get('url')

    if (title && author && url) {
      handleBookSelect(title, author, decodeURIComponent(url))
      return
    }
    
    // SECOND: Check if there's a saved current book
    const savedBook = localStorage.getItem('current-book')
    if (savedBook) {
      try {
        const parsedBook = JSON.parse(savedBook)
        console.log(`[ReaderContent-${componentId}] Found saved book:`, parsedBook)
        
        // Check if we already have this exact book in our singleton cache
        const cacheHasSameBook = readerStateManager.currentBook.title === parsedBook.title && 
                                readerStateManager.currentBook.author === parsedBook.author && 
                                readerStateManager.bookText.length > 0
        
        // Check if component state already has this book loaded
        const stateHasSameBook = currentBook.title === parsedBook.title && 
                               currentBook.author === parsedBook.author && 
                               bookText.length > 0
        
        console.log(`[ReaderContent-${componentId}] Cache has same book: ${cacheHasSameBook}, state has same book: ${stateHasSameBook}`)
        
        if (cacheHasSameBook) {
          console.log(`[ReaderContent-${componentId}] Using singleton cached book data, no reload needed`)
          // Singleton cache has the book, no need to reload
          setBookText(readerStateManager.bookText)
          setCurrentBook(readerStateManager.currentBook)
          setLoading(false)
        } else if (stateHasSameBook) {
          console.log(`[ReaderContent-${componentId}] Book already in state, skipping reload - scroll position will be preserved`)
          setLoading(false)
        } else if (parsedBook.url) {
          // Load the book if we don't have it or it's different
          console.log(`[ReaderContent-${componentId}] Loading new book:`, parsedBook)
          handleBookSelect(parsedBook.title, parsedBook.author, parsedBook.url)
        } else {
          console.log(`[ReaderContent-${componentId}] No URL in saved book, setting not loading`)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading saved book:', error)
        setLoading(false)
      }
    } else {
      console.log(`[ReaderContent-${componentId}] No saved book found`)
      setLoading(false)
    }
  }, [componentId, searchParams])

  const handleBookSelect = async (title: string, author: string, url: string) => {
    setLoading(true)
    const newBook = { title, author, url }
    setCurrentBook({ title, author })
    
    localStorage.setItem('current-book', JSON.stringify(newBook))
    
    try {
      let text: string
      const isHtmlFile = url.toLowerCase().endsWith('.html')
      
      if (url.startsWith('blob:') || url.startsWith('/')) {
        const response = await fetch(url)
        text = await response.text()
        
        if (isHtmlFile) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(text, 'text/html')
          text = doc.body.textContent || doc.documentElement.textContent || text
        }
      } else {
        const response = await fetch('/api/download-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to download: ${response.statusText}`)
        }
        
        const data = await response.json()
        text = data.text
        
        if (isHtmlFile) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(text, 'text/html')
          text = doc.body.textContent || doc.documentElement.textContent || text
        }
      }
      
      setBookText(text)
      
      // Update singleton cache with new book data
      readerStateManager.updateState(text, newBook)
    } catch (error) {
      console.error('Error loading book:', error)
      alert('Failed to load book. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading{currentBook.title ? ` ${currentBook.title}` : ''}...</div>
  }

  if (!bookText) {
    return (
      <div style={{ padding: '20px' }}>
        <p>No book loaded. Please select a book from the library.</p>
        <button 
          onClick={() => router.push('/library')}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Go to Library
        </button>
      </div>
    )
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

// Wrapper component with Suspense boundary
function ReaderContent({ showHeader = false }: ReaderContentProps) {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
      <ReaderContentInner showHeader={showHeader} />
    </Suspense>
  )
}

export default ReaderContent