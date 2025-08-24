'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSettings } from '../contexts/SettingsContext'

interface AdaptiveLayoutProps {
  children: React.ReactNode
  rightPanelContent?: React.ReactNode
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

// Minimum widths for right panel content (in pixels)
const RIGHT_PANEL_MIN_WIDTHS = {
  reader: 0,      // No right panel needed
  chat: 400,      // Conversation bubbles need space
  library: 350,   // Book grid layout
  settings: 350,  // Form controls
  credits: 400,   // Pricing cards
  profile: 350,   // Profile form
  styles: 350,    // Style options
  guide: 350      // User guide content
}

const AdaptiveLayout: React.FC<AdaptiveLayoutProps> = ({ 
  children,
  rightPanelContent
}) => {
  const { settings } = useSettings()
  const router = useRouter()
  const pathname = usePathname()
  const [screenWidth, setScreenWidth] = useState(0)
  const [layoutMode, setLayoutMode] = useState<'single-page' | 'two-panel'>('single-page')
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Determine current page from pathname
  const currentPage = pathname === '/' || pathname === '/reader' ? 'reader' : 
    (pathname.replace('/', '') as 'chat' | 'library' | 'settings' | 'credits' | 'profile' | 'styles' | 'guide')

  // Calculate optimal reader width based on current font
  const calculateOptimalReaderWidth = () => {
    const charWidth = CHAR_WIDTHS[settings.textFont] || CHAR_WIDTHS['serif']
    const contentWidth = OPTIMAL_LINE_LENGTH * charWidth
    return contentWidth + READER_PADDING + SEARCH_BAR_SPACE
  }

  // Determine layout mode based on screen width and content requirements
  const determineLayoutMode = (width: number) => {
    // Always use single page mode for reader-only pages
    if (currentPage === 'reader' && !rightPanelContent) {
      return 'single-page'
    }
    
    const readerWidth = calculateOptimalReaderWidth()
    const rightPanelMinWidth = RIGHT_PANEL_MIN_WIDTHS[currentPage] || 0
    const totalRequired = readerWidth + rightPanelMinWidth
    
    // Add some buffer space for comfortable viewing
    const bufferSpace = 50
    
    console.log('Layout calculation:', {
      screenWidth: width,
      readerWidth,
      rightPanelMinWidth,
      totalRequired: totalRequired + bufferSpace,
      fontFamily: settings.textFont,
      currentPage,
      hasRightPanel: !!rightPanelContent
    })

    return width >= (totalRequired + bufferSpace) && rightPanelContent ? 'two-panel' : 'single-page'
  }

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setScreenWidth(width)
      setLayoutMode(determineLayoutMode(width))
    }

    // Initial calculation
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentPage, settings.textFont])

  // Recalculate when font changes
  useEffect(() => {
    if (screenWidth > 0) {
      setLayoutMode(determineLayoutMode(screenWidth))
    }
  }, [settings.textFont, currentPage])

  const readerWidth = calculateOptimalReaderWidth()
  const rightPanelWidth = screenWidth - readerWidth

  // Single-page mode: show only current page (mobile/narrow screens or reader-only)
  if (layoutMode === 'single-page') {
    return (
      <div className="single-page-layout" style={{ width: '100%', height: '100vh' }}>
        {children}
      </div>
    )
  }

  // Two-panel mode: reader on left, current page on right (desktop/tablet)
  return (
    <div 
      ref={containerRef}
      className="adaptive-layout"
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Left Panel - Reader Content */}
      <div 
        className="reader-panel"
        style={{
          width: `${readerWidth}px`,
          height: '100vh',
          flexShrink: 0,
          borderRight: '1px solid #e0e0e0',
          overflow: 'hidden'
        }}
      >
        {currentPage === 'reader' ? children : (
          <div style={{ padding: '20px', fontSize: '14px', color: '#666' }}>
            Reader content will appear here when on other pages
          </div>
        )}
      </div>

      {/* Right Panel - Current Page Content */}
      <div 
        className="content-panel"
        style={{
          width: `${rightPanelWidth}px`,
          height: '100vh',
          overflow: 'auto',
          background: '#fafafa'
        }}
      >
        {rightPanelContent || (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#666',
            marginTop: '50px'
          }}>
            <h2>Select a page from the menu</h2>
            <p>Choose Chat, Library, Settings, or other options from the navigation.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .adaptive-layout {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        
        .reader-panel {
          background: white;
        }
        
        .content-panel {
          position: relative;
        }

        /* Debug info in development */
        .adaptive-layout::before {
          content: 'Layout: ${layoutMode} | Screen: ${screenWidth}px | Reader: ${readerWidth}px | Font: ${settings.textFont}';
          position: fixed;
          top: 0;
          left: 0;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 4px 8px;
          font-size: 10px;
          z-index: 9999;
          display: ${process.env.NODE_ENV === 'development' ? 'block' : 'none'};
        }
      `}</style>
    </div>
  )
}

export default AdaptiveLayout