'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import ReaderContent from './ReaderContent'

// Import page components for side panel rendering
import ChatPage from '../app/chat/page'
import LibraryPage from '../app/library/page'
import SettingsPage from '../app/settings/page'
import CreditsPage from '../app/credits/page'
import ProfilePage from '../app/profile/page'
import StylesPage from '../app/styles/page'
import GuidePage from '../app/guide/page'

interface TwoPanelLayoutProps {
  initialPanel: string
  readerWidth: number
  sidePanelMinWidth: number
}

const TwoPanelLayoutNew: React.FC<TwoPanelLayoutProps> = ({ 
  initialPanel, 
  readerWidth, 
  sidePanelMinWidth 
}) => {
  const pathname = usePathname()
  const [currentPanel, setCurrentPanel] = useState(initialPanel)
  const [layoutId] = useState(() => Math.random().toString(36).substr(2, 9))
  


  // Listen for panel navigation events
  useEffect(() => {
    const handlePanelNavigation = (event: CustomEvent) => {
      setCurrentPanel(event.detail.panel)
    }

    window.addEventListener('navigateToPanel', handlePanelNavigation as EventListener)
    
    return () => {
      window.removeEventListener('navigateToPanel', handlePanelNavigation as EventListener)
    }
  }, [])

  // Update panel when URL changes (for direct navigation)
  useEffect(() => {
    if (pathname !== currentPanel) {
      setCurrentPanel(pathname)
    }
  }, [pathname])
  
  const getSidePanelContent = () => {
    switch (currentPanel) {
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
      case '/reader':
      case '/':
        // Show welcome panel for reader page
        return (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Welcome to The Explainers</h2>
            <p style={{ 
              margin: '0 0 30px 0', 
              fontSize: '16px', 
              color: '#666',
              lineHeight: '1.5',
              maxWidth: '400px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Select any text in the reader to get an AI explanation. The explanation will appear here.
            </p>
            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '2px dashed #ddd'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: '#888',
                fontStyle: 'italic' 
              }}>
                Explanations will appear in this panel
              </p>
            </div>
          </div>
        )
      default:
        return <ChatPage /> // Fallback to chat
    }
  }

  return (
    <div style={{ 
      height: '100vh', 
      margin: 0, 
      padding: 0, 
      overflow: 'hidden' 
    }}>
      {/* Two-panel layout for wide screens */}
      <div style={{ 
        display: 'flex', 
        height: '100%',
        maxHeight: '100%',
        gap: 0
      }}>
        {/* Reader panel - PERSISTENT READER */}
        <div 
          className="reader-panel"
          style={{ 
            width: `${readerWidth}px`,
            height: '100%',
            flexShrink: 0,
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            overflow: 'auto',
            overscrollBehavior: 'contain',
            scrollBehavior: 'smooth',
            isolation: 'isolate'
          }}>
          <ReaderContent key="persistent-reader" />
        </div>
        
        {/* Side panel */}
        <div 
          className="side-panel"
          style={{ 
            flex: 1, 
            minWidth: `${sidePanelMinWidth}px`,
            height: '100%',
            overflow: 'auto',
            position: 'relative',
            paddingTop: '10px',  // Small top padding to prevent content cutoff
            overscrollBehavior: 'contain',
            scrollBehavior: 'smooth',
            isolation: 'isolate'
          }}>
          {getSidePanelContent()}
        </div>
      </div>
    </div>
  )
}

export default TwoPanelLayoutNew