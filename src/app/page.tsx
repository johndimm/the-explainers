'use client'

import { useState, useEffect } from 'react'
import TextReader from '@/components/TextReader'
import Settings from '@/components/Settings'
import Profile from '@/components/Profile'
import Library from '@/components/Library'
import Pricing from '@/components/Pricing'
import PWAInstaller from '@/components/PWAInstaller'
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext'
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext'

function HomeContent() {
  const [bookText, setBookText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentBook, setCurrentBook] = useState({ title: '', author: '' })
  const [showLibrary, setShowLibrary] = useState(true)
  const [showPricing, setShowPricing] = useState(false)
  const { settings, updateSettings, isSettingsOpen, openSettings, closeSettings } = useSettings()
  const { profile, updateProfile, isProfileOpen, openProfile, closeProfile } = useProfile()

  useEffect(() => {
    // Check if there's a saved current book
    const savedBook = localStorage.getItem('current-book')
    if (savedBook) {
      try {
        const parsedBook = JSON.parse(savedBook)
        console.log('Restoring saved book:', parsedBook)
        
        // We need to reconstruct the URL - for now, just handle a few key books
        let url = ''
        if (parsedBook.title === 'Hamlet') {
          url = 'https://www.gutenberg.org/cache/epub/1524/pg1524.txt'
        } else if (parsedBook.title === 'Romeo and Juliet') {
          url = '/public-domain-texts/shakespeare-romeo-and-juliet.txt'
        }
        
        if (url) {
          // Use the same handleBookSelect logic
          handleBookSelect(parsedBook.title, parsedBook.author, url)
        } else {
          console.log('No URL mapping for saved book, showing library')
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading saved book:', error)
        setLoading(false)
      }
    } else {
      // No saved book - library is already shown by default
      setLoading(false)
    }
  }, [])

  const handleBookSelect = async (title: string, author: string, url: string) => {
    setLoading(true)
    const newBook = { title, author }
    setCurrentBook(newBook)
    
    // Save current book to localStorage
    localStorage.setItem('current-book', JSON.stringify(newBook))
    
    try {
      let text: string
      const isHtmlFile = url.toLowerCase().endsWith('.html')
      
      if (url.startsWith('blob:') || url.startsWith('/')) {
        // Local file or blob URL
        const response = await fetch(url)
        text = await response.text()
        
        // If it's an HTML file, extract the text content from HTML
        if (isHtmlFile) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(text, 'text/html')
          text = doc.body.textContent || doc.documentElement.textContent || text
        }
      } else {
        // External URL - use our API to avoid CORS
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
        
        // If it's an HTML file, extract the text content from HTML
        if (isHtmlFile) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(text, 'text/html')
          text = doc.body.textContent || doc.documentElement.textContent || text
        }
      }
      
      setBookText(text)
      setShowLibrary(false)
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

  if (showLibrary) {
    return <Library onBookSelect={handleBookSelect} />
  }

  return (
    <div>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '8px 12px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#333',
            lineHeight: '1.2'
          }}>
            The Explainers
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '11px', 
            fontStyle: 'italic',
            color: '#666',
            lineHeight: '1.2'
          }}>
            understand difficult texts
          </p>
        </div>
        <div style={{ 
          display: 'flex',
          gap: '6px',
          flexShrink: 0
        }}>
        <a 
          href="/user-guide.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '6px 10px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Guide
        </a>
        <button 
          onClick={() => setShowLibrary(true)}
          style={{
            padding: '6px 10px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Library
        </button>
        <button 
          onClick={() => setShowPricing(true)}
          style={{
            padding: '6px 10px',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Credits ({profile.availableCredits || 0})
        </button>
        <button 
          onClick={openProfile}
          style={{
            padding: '6px 10px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Profile
        </button>
        <button 
          onClick={openSettings}
          style={{
            padding: '6px 10px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Settings
        </button>
        </div>
      </header>
      
      <div style={{ marginTop: '60px' }}>
        <TextReader 
          text={bookText} 
          bookTitle={currentBook.title}
          author={currentBook.author}
          settings={settings}
          profile={profile}
          onSettingsChange={updateSettings}
        />
      </div>
      
      <Profile
        isOpen={isProfileOpen}
        onClose={closeProfile}
        profile={profile}
        onProfileChange={updateProfile}
      />
      
      <Settings
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        settings={settings}
        onSettingsChange={updateSettings}
      />
      
      <Pricing
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        bookTitle={currentBook.title}
        author={currentBook.author}
      />
      
      <PWAInstaller />
    </div>
  )
}

export default function Home() {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <HomeContent />
      </SettingsProvider>
    </ProfileProvider>
  )
}