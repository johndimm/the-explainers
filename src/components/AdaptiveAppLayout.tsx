'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSettings } from '../contexts/SettingsContext'
import ReaderContent from './ReaderContent'

// Import page components for side panel rendering
import ChatPage from '../app/chat/page'
import LibraryPage from '../app/library/page'
import SettingsPage from '../app/settings/page'
import CreditsPage from '../app/credits/page'
import ProfilePage from '../app/profile/page'
import StylesPage from '../app/styles/page'
import GuidePage from '../app/guide/page'

interface AdaptiveAppLayoutProps {
  children: React.ReactNode
}

// Character width estimation for 16px fonts (in pixels)
const CHAR_WIDTHS = {
  'serif': 9.6,      // Georgia average character width
  'sans-serif': 8.8, // Arial/Helvetica average 
  'monospace': 9.6   // Fixed width fonts
}

const OPTIMAL_LINE_LENGTH = 70 // characters for optimal readability
const READER_PADDING = 40      // 20px each side
const SEARCH_BAR_SPACE = 20    // extra space for search bar

// Minimum widths for side panel content (in pixels)
const SIDE_PANEL_MIN_WIDTHS = {
  chat: 400,      // Conversation bubbles need space
  library: 450,   // Book grid layout needs room to display collections
  settings: 300,  // Form controls work in smaller space
  credits: 350,   // Pricing info
  profile: 300,   // Profile form is compact
  styles: 280,    // Style options are simple
  guide: 320      // User guide content
}

const SIDE_PANEL_PAGES = ['/chat', '/library', '/settings', '/credits', '/profile', '/styles', '/guide']

const AdaptiveAppLayout: React.FC<AdaptiveAppLayoutProps> = ({ children }) => {
  const { settings } = useSettings()
  const pathname = usePathname()
  const router = useRouter()
  const [screenWidth, setScreenWidth] = useState(0)
  const [shouldUseAdaptiveLayout, setShouldUseAdaptiveLayout] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Calculate optimal reader width based on current font
  const calculateOptimalReaderWidth = () => {
    const charWidth = CHAR_WIDTHS[settings.textFont] || CHAR_WIDTHS['serif']
    const contentWidth = OPTIMAL_LINE_LENGTH * charWidth
    return contentWidth + READER_PADDING + SEARCH_BAR_SPACE
  }

  // Update screen width on resize
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth)
    }

    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth)
    return () => window.removeEventListener('resize', updateScreenWidth)
  }, [])

  // Determine if we should use adaptive layout
  useEffect(() => {
    if (screenWidth === 0) return

    const isOnSidePanelPage = SIDE_PANEL_PAGES.includes(pathname)
    
    if (!isOnSidePanelPage) {
      setShouldUseAdaptiveLayout(false)
      return
    }

    const readerWidth = calculateOptimalReaderWidth()
    const sidePanelMinWidth = getSidePanelMinWidth(pathname)
    const totalRequiredWidth = readerWidth + sidePanelMinWidth
    
    setShouldUseAdaptiveLayout(screenWidth >= totalRequiredWidth)
  }, [screenWidth, pathname, settings.textFont])

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

  const getSidePanelMinWidth = (path: string) => {
    switch (path) {
      case '/chat': return SIDE_PANEL_MIN_WIDTHS.chat
      case '/library': return SIDE_PANEL_MIN_WIDTHS.library
      case '/settings': return SIDE_PANEL_MIN_WIDTHS.settings
      case '/credits': return SIDE_PANEL_MIN_WIDTHS.credits
      case '/profile': return SIDE_PANEL_MIN_WIDTHS.profile
      case '/styles': return SIDE_PANEL_MIN_WIDTHS.styles
      case '/guide': return SIDE_PANEL_MIN_WIDTHS.guide
      default: return 300
    }
  }

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

  return (
    <div style={{ height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      {/* Global Persistent Header - always visible */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        padding: '12px 16px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
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
              {!shouldUseAdaptiveLayout && (
                <button 
                  onClick={() => {
                    router.push('/')
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
                  📖 Reader
                </button>
              )}
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

      {/* Content area - changes based on screen size */}
      <div style={{ 
        marginTop: '20px', 
        height: 'calc(100vh - 20px)', 
        overflow: 'auto'
      }}>
        {shouldUseAdaptiveLayout ? (
          /* Two-panel layout for wide screens */
          <div style={{ 
            display: 'flex', 
            height: '100%',
            gap: 0
          }}>
            {/* Reader panel */}
            <div style={{ 
              width: `${calculateOptimalReaderWidth()}px`,
              flexShrink: 0,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)'
            }}>
              <ReaderContent />
            </div>
            
            {/* Side panel */}
            <div style={{ 
              flex: 1, 
              minWidth: `${getSidePanelMinWidth(pathname)}px`,
              height: '100%',
              overflow: 'auto',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'relative',
                minHeight: '100%',
                padding: '0'
              }}>
                {getSidePanelContent()}
              </div>
            </div>
          </div>
        ) : (
          /* Full-screen layout for narrow screens */
          <>{children}</>
        )}
      </div>
    </div>
  )
}

export default AdaptiveAppLayout