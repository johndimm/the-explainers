'use client'

import { useState, useEffect, useRef } from 'react'
import TextReader from '@/components/TextReader'
import Settings from '@/components/Settings'
import Profile from '@/components/Profile'
import Library from '@/components/Library'
import Pricing from '@/components/Pricing'
import PWAInstaller from '@/components/PWAInstaller'
import ExplainerStyles from '@/components/ExplainerStyles'
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext'
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext'

function HomeContent() {
  const [bookText, setBookText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentBook, setCurrentBook] = useState({ title: '', author: '' })
  const [showLibrary, setShowLibrary] = useState(true)
  const [showPricing, setShowPricing] = useState(false)
  const [showExplainerStyles, setShowExplainerStyles] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { settings, updateSettings, isSettingsOpen, openSettings, closeSettings } = useSettings()
  const { profile, updateProfile, isProfileOpen, openProfile, closeProfile } = useProfile()

  useEffect(() => {
    // Check if there's a saved current book
    const savedBook = localStorage.getItem('current-book')
    if (savedBook) {
      try {
        const parsedBook = JSON.parse(savedBook)
        console.log('Restoring saved book:', parsedBook)
        
        // Check if URL is saved with the book (new format)
        if (parsedBook.url) {
          handleBookSelect(parsedBook.title, parsedBook.author, parsedBook.url)
        } else {
          // Legacy format without URL - just show library
          console.log('Legacy saved book without URL, showing library')
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

  const handleBookSelect = async (title: string, author: string, url: string) => {
    setLoading(true)
    const newBook = { title, author, url }
    setCurrentBook({ title, author })
    
    // Save current book to localStorage with URL
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
    return <Library 
      onBookSelect={handleBookSelect} 
      onBackToCurrentBook={() => setShowLibrary(false)}
    />
  }

  if (showExplainerStyles) {
    return (
      <div>
        <div style={{ padding: '20px 20px 10px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <button 
            onClick={() => setShowExplainerStyles(false)}
            style={{
              padding: '6px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← Back
          </button>
        </div>
        <ExplainerStyles
          isOpen={true}
          onClose={() => setShowExplainerStyles(false)}
          selectedStyle={settings.explanationStyle}
          onStyleChange={(style) => {
            updateSettings({ ...settings, explanationStyle: style })
            setShowExplainerStyles(false)
          }}
        />
      </div>
    )
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
          {currentBook.title ? (
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#666',
              lineHeight: '1.2'
            }}>
              {currentBook.title} by {currentBook.author}
            </p>
          ) : (
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              fontStyle: 'italic',
              color: '#666',
              lineHeight: '1.2'
            }}>
              understand difficult texts
            </p>
          )}
        </div>
        {/* Hamburger menu for all devices */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#333'
            }}
          >
            ☰
          </button>
          
          {showMobileMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '160px',
              zIndex: 1000
            }}>
              <a 
                href="/user-guide.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  color: '#333',
                  textDecoration: 'none',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={() => setShowMobileMenu(false)}
              >
                📖 User Guide
              </a>
              <button 
                onClick={() => {
                  setShowLibrary(true)
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📚 Library
              </button>
              <button 
                onClick={() => {
                  setShowExplainerStyles(true)
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                🎭 Styles
              </button>
              <button 
                onClick={() => {
                  setShowPricing(true)
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                💳 Credits ({profile.availableCredits || 0})
              </button>
              <button 
                onClick={() => {
                  openProfile()
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                👤 Profile
              </button>
              <button 
                onClick={() => {
                  openSettings()
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Settings
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div style={{ marginTop: '50px' }}>
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