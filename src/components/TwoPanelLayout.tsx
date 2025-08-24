'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSettings } from '../contexts/SettingsContext'

interface TwoPanelLayoutProps {
  readerContent: React.ReactNode
  sideContent?: React.ReactNode
  sidePanelType?: keyof typeof SIDE_PANEL_MIN_WIDTHS
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

const TwoPanelLayout: React.FC<TwoPanelLayoutProps> = ({ 
  readerContent, 
  sideContent,
  sidePanelType
}) => {
  const { settings } = useSettings()
  const [screenWidth, setScreenWidth] = useState(0)
  const [layoutMode, setLayoutMode] = useState<'single-page' | 'two-panel'>('single-page')

  // Calculate optimal reader width based on current font
  const calculateOptimalReaderWidth = () => {
    const charWidth = CHAR_WIDTHS[settings.textFont] || CHAR_WIDTHS['serif']
    const contentWidth = OPTIMAL_LINE_LENGTH * charWidth
    return contentWidth + READER_PADDING + SEARCH_BAR_SPACE
  }

  // Determine layout mode based on screen width and content requirements
  const determineLayoutMode = (width: number) => {
    // If no side content, always single page
    if (!sideContent || !sidePanelType) {
      return 'single-page'
    }
    
    const readerWidth = calculateOptimalReaderWidth()
    const sidePanelMinWidth = SIDE_PANEL_MIN_WIDTHS[sidePanelType] || 350
    const totalRequired = readerWidth + sidePanelMinWidth
    
    // Add some buffer space for comfortable viewing
    const bufferSpace = 50
    
    console.log('TwoPanelLayout calculation:', {
      screenWidth: width,
      readerWidth,
      sidePanelType,
      sidePanelMinWidth,
      totalRequired: totalRequired + bufferSpace,
      fontFamily: settings.textFont
    })
    
    return width >= (totalRequired + bufferSpace) ? 'two-panel' : 'single-page'
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
  }, [sideContent, settings.textFont])

  // Recalculate when font changes
  useEffect(() => {
    if (screenWidth > 0) {
      setLayoutMode(determineLayoutMode(screenWidth))
    }
  }, [settings.textFont, sideContent])

  const readerWidth = calculateOptimalReaderWidth()
  const sideWidth = screenWidth - readerWidth

  // Single-page mode: show only reader content
  if (layoutMode === 'single-page') {
    return (
      <div className="single-page-layout" style={{ width: '100%', height: '100vh' }}>
        {readerContent}
      </div>
    )
  }

  // Two-panel mode: reader on left, side content on right
  return (
    <div 
      className="two-panel-layout"
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
          overflow: 'hidden',
          background: 'white'
        }}
      >
        {readerContent}
      </div>

      {/* Right Panel - Side Content */}
      <div 
        className="side-panel"
        style={{
          width: `${sideWidth}px`,
          height: '100vh',
          overflow: 'auto',
          background: '#fafafa'
        }}
      >
        {sideContent || (
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
        .two-panel-layout {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

      `}</style>
    </div>
  )
}

export default TwoPanelLayout