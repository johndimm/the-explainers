'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import TextReader from '@/components/TextReader'
import { useSettings } from '@/contexts/SettingsContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useRouter, useSearchParams } from 'next/navigation'

function ReaderContent() {
  const [bookText, setBookText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentBook, setCurrentBook] = useState({ title: '', author: '' })
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { settings, updateSettings } = useSettings()
  const { profile } = useProfile()
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
    // Check URL parameters for book selection
    const title = searchParams.get('title')
    const author = searchParams.get('author') 
    const url = searchParams.get('url')

    if (title && author && url) {
      handleBookSelect(title, author, decodeURIComponent(url))
      return
    }

    // Check if there's a saved current book
    const savedBook = localStorage.getItem('current-book')
    if (savedBook) {
      try {
        const parsedBook = JSON.parse(savedBook)
        console.log('Restoring saved book:', parsedBook)
        
        if (parsedBook.url) {
          handleBookSelect(parsedBook.title, parsedBook.author, parsedBook.url)
        } else {
          router.push('/library')
        }
      } catch (error) {
        console.error('Error loading saved book:', error)
        router.push('/library')
      }
    } else {
      router.push('/library')
    }
  }, [searchParams, router])

  const handleBookSelect = async (title: string, author: string, url: string) => {
    setLoading(true)
    const newBook = { title, author, url }
    setCurrentBook({ title, author })
    
    localStorage.setItem('current-book', JSON.stringify(newBook))
    
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
      
      console.log('Setting book text:', {
        textLength: text.length,
        firstChars: text.substring(0, 100),
        hasNewlines: text.includes('\n'),
        newlineCount: (text.match(/\n/g) || []).length
      })
      setBookText(text)
    } catch (error) {
      console.error('Error loading book:', error)
      alert('Failed to load book. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading{currentBook.title ? ` ${currentBook.title}` : ''}...</div>
  }

  // Debug logging
  console.log('Reader page rendering with:', {
    bookTextLength: bookText?.length || 0,
    currentBook,
    hasSettings: !!settings,
    hasProfile: !!profile
  })

  if (!bookText || bookText.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No Book Content</h2>
        <p>No book text was loaded. Please try selecting a book from the library.</p>
        <button onClick={() => router.push('/library')} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Go to Library
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ minHeight: 'calc(100vh - 40px)' }}>
        {(() => {
          try {
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
          } catch (error) {
            console.error('Error rendering TextReader:', error)
            return (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Error Loading Reader</h2>
                <p>There was an error loading the text reader. Please try refreshing the page.</p>
                <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Refresh Page
                </button>
              </div>
            )
          }
        })()}
      </div>
    </div>
  )
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {(() => {
        try {
          return <ReaderContent />
        } catch (error) {
          console.error('Error in ReaderPage:', error)
          return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h2>Reader Error</h2>
              <p>Something went wrong loading the reader. Please try again.</p>
              <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Reload
              </button>
            </div>
          )
        }
      })()}
    </Suspense>
  )
}