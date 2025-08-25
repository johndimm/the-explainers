'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import TwoPanelLayout from './TwoPanelLayout'

// Import page components for side panel rendering
import ChatPage from '../app/chat/page'
import LibraryPage from '../app/library/page'
import SettingsPage from '../app/settings/page'
import CreditsPage from '../app/credits/page'
import ProfilePage from '../app/profile/page'
import StylesPage from '../app/styles/page'
import GuidePage from '../app/guide/page'

interface ReaderLayoutProps {
  children: React.ReactNode
  currentBook: { title: string; author: string }
}

const ReaderLayout: React.FC<ReaderLayoutProps> = ({ children, currentBook }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(40)
  const [displayBook, setDisplayBook] = useState<{ title: string; author: string }>(() => {
    if (currentBook.title) return currentBook
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('current-book') : null
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.title && parsed.author) {
          return { title: parsed.title, author: parsed.author }
        }
      }
    } catch {}
    return currentBook
  })

  // Measure header height to correctly offset content in single-page layout
  useEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Keep displayed book in sync; fall back to localStorage if prop is empty
  useEffect(() => {
    if (currentBook.title) {
      setDisplayBook(currentBook)
      return
    }
    try {
      const saved = localStorage.getItem('current-book')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.title && parsed.author) {
          setDisplayBook({ title: parsed.title, author: parsed.author })
        }
      }
    } catch {}
  }, [currentBook])

  // Proactively watch for localStorage changes shortly after mount to catch async book loads
  useEffect(() => {
    const updateFromStorage = () => {
      try {
        const saved = localStorage.getItem('current-book')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.title && parsed.author) {
            setDisplayBook((prev) => (
              prev.title !== parsed.title || prev.author !== parsed.author
                ? { title: parsed.title, author: parsed.author }
                : prev
            ))
          }
        }
      } catch {}
    }

    // Poll briefly to catch updates made right after mount
    const t1 = setTimeout(updateFromStorage, 50)
    const t2 = setTimeout(updateFromStorage, 200)
    const t3 = setTimeout(updateFromStorage, 600)
    const t4 = setTimeout(updateFromStorage, 1200)

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'current-book') updateFromStorage()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Determine side panel content based on current pathname
  const getSidePanelContent = () => {
    switch (pathname) {
      case '/chat':
        return <ChatPage />
      case '/library':
        return <LibraryPage />
      case '/settings':
        return <SettingsPage />
      case '/credits':
        return <CreditsPage />
      case '/profile':
        return <ProfilePage />
      case '/styles':
        return <StylesPage />
      case '/guide':
        return <GuidePage />
      default:
        return null
    }
  }

  // Determine side panel type for width calculations
  const getSidePanelType = () => {
    switch (pathname) {
      case '/chat': return 'chat'
      case '/library': return 'library'
      case '/settings': return 'settings'
      case '/credits': return 'credits'
      case '/profile': return 'profile'
      case '/styles': return 'styles'
      case '/guide': return 'guide'
      default: return undefined
    }
  }

  const sideContent = getSidePanelContent()
  const sidePanelType = getSidePanelType()
  

  // Close menu when clicking outside
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

  const readerContentWithHeader = (
    <div>
      {/* Persistent Header */}
      <header ref={headerRef} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderBottom: 'none',
        padding: '12px 16px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'none'
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
          {displayBook.title ? (
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#666',
              lineHeight: '1.2'
            }}>
              {displayBook.title} by {displayBook.author}
            </p>
          ) : null}
        </div>
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
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
                minWidth: '180px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
              <button 
                onClick={() => {
                  router.push('/chat')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  transition: 'background-color 0.15s ease',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.04)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                💬 Chat
              </button>
              <button 
                onClick={() => {
                  router.push('/library')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  transition: 'background-color 0.15s ease',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.04)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                📚 Library
              </button>
              <button 
                onClick={() => {
                  router.push('/styles')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  transition: 'background-color 0.15s ease',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.04)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                🎭 Styles
              </button>
              <button 
                onClick={() => {
                  router.push('/credits')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  transition: 'background-color 0.15s ease',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.04)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                💳 Credits
              </button>
              <button 
                onClick={() => {
                  router.push('/profile')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  transition: 'background-color 0.15s ease',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.04)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                👤 Profile
              </button>
              <button 
                onClick={() => {
                  router.push('/settings')
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
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.04)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                ⚙️ Settings
              </button>
              <button 
                onClick={() => {
                  router.push('/guide')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.04)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                📖 User Guide
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* Content fills viewport beneath fixed header */}
      <div style={{ 
        height: `calc(100vh - ${headerHeight}px)`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff'
      }}>
        {children}
      </div>
    </div>
  )

  return (
    <TwoPanelLayout 
      readerContent={readerContentWithHeader}
      sideContent={sideContent}
      sidePanelType={sidePanelType}
    />
  )
}

export default ReaderLayout