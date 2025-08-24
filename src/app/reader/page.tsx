'use client'

import { useState, useEffect, Suspense } from 'react'
import TextReader from '@/components/TextReader'
import ReaderLayout from '@/components/ReaderLayout'
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext'
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext'
import { useRouter, useSearchParams } from 'next/navigation'

function ReaderContent() {
  const [bookText, setBookText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentBook, setCurrentBook] = useState({ title: '', author: '' })
  const { settings, updateSettings } = useSettings()
  const { profile } = useProfile()
  const router = useRouter()
  const searchParams = useSearchParams()

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
    return <div>Loading{currentBook.title ? ` ${currentBook.title}` : ''}...</div>
  }

  return (
    <ReaderLayout currentBook={currentBook}>
      <TextReader 
        text={bookText} 
        bookTitle={currentBook.title}
        author={currentBook.author}
        settings={settings}
        profile={profile}
        onSettingsChange={updateSettings}
      />
    </ReaderLayout>
  )
}

export default function ReaderPage() {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <ReaderContent />
        </Suspense>
      </SettingsProvider>
    </ProfileProvider>
  )
}