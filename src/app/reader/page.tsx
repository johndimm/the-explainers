'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import TextReader from '@/components/TextReader'
import { useSettings } from '@/contexts/SettingsContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { log } from '@/utils/log'

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
    const loadCurrentBook = async () => {
      try {
        // Load from database only
        const response = await fetch('/api/user/current-book')
        if (response.ok) {
          const dbBook = await response.json()
          log('Restoring saved book from database:', dbBook)
          
          if (dbBook.url) {
            handleBookSelect(dbBook.title, dbBook.author, dbBook.url)
            return
          }
        }
      } catch (error) {
        console.error('Error loading current book from database:', error)
      }
      
      router.push('/library')
    }

    loadCurrentBook()
  }, [searchParams, router])

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
      console.error('Error saving current book to database:', error)
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
      console.error('Error loading book:', error)
      alert('Failed to load book. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading{currentBook.title ? ` ${currentBook.title}` : ''}...</div>
  }

  return (
    <div>
      <div style={{ minHeight: 'calc(100vh - 40px)' }}>
        <TextReader 
          text={bookText} 
          bookTitle={currentBook.title}
          author={currentBook.author}
          settings={settings}
          profile={profile}
          onSettingsChange={updateSettings}
        />
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