'use client'

import { useState, useEffect } from 'react'
import TextReader from '@/components/TextReader'
import { useSettings } from '@/contexts/SettingsContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { debugBook } from '@/utils/debug'

interface ReaderContentProps {
  showHeader?: boolean
}

function ReaderContent({ showHeader = false }: ReaderContentProps) {
  const [bookText, setBookText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentBook, setCurrentBook] = useState({ title: '', author: '' })
  const [debugMsg, setDebugMsg] = useState('')
  const { settings, updateSettings } = useSettings()
  const { profile } = useProfile()
  const router = useRouter()

  useEffect(() => {
    // Check if there's a saved current book
    const savedBook = localStorage.getItem('current-book')
    if (savedBook) {
      try {
        const parsedBook = JSON.parse(savedBook)
        debugBook('Restoring saved book:', parsedBook)
        
        if (parsedBook.url) {
          handleBookSelect(parsedBook.title, parsedBook.author, parsedBook.url)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading saved book:', error)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

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

export default ReaderContent