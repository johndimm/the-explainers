'use client'

import { useState, useEffect } from 'react'
import TextReader from '@/components/TextReader'
import Settings from '@/components/Settings'
import Profile from '@/components/Profile'
import Library from '@/components/Library'
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext'
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext'

function HomeContent() {
  const [bookText, setBookText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentBook, setCurrentBook] = useState({ title: 'Romeo and Juliet', author: 'William Shakespeare' })
  const [showLibrary, setShowLibrary] = useState(false)
  const { settings, updateSettings, isSettingsOpen, openSettings, closeSettings } = useSettings()
  const { profile, updateProfile, isProfileOpen, openProfile, closeProfile } = useProfile()

  useEffect(() => {
    loadDefaultBook()
  }, [])

  const loadDefaultBook = () => {
    fetch('/public-domain-texts/shakespeare-romeo-and-juliet.txt')
      .then(response => response.text())
      .then(text => {
        setBookText(text)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading text:', error)
        setLoading(false)
      })
  }

  const handleBookSelect = async (title: string, author: string, url: string) => {
    setLoading(true)
    setCurrentBook({ title, author })
    
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
    return <div>Loading {currentBook.title}...</div>
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