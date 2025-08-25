'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSettings } from '../contexts/SettingsContext'
import OnePanelLayout from './OnePanelLayout'
import TwoPanelLayoutNew from './TwoPanelLayoutNew'

interface LayoutRouterProps {
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

const LayoutRouter: React.FC<LayoutRouterProps> = ({ children }) => {
  const { settings } = useSettings()
  const pathname = usePathname()
  const [screenWidth, setScreenWidth] = useState(0)
  const [shouldUseTwoPanelLayout, setShouldUseTwoPanelLayout] = useState(false)
  const [routerId] = useState(() => Math.random().toString(36).substr(2, 9))
  
  console.log(`[LayoutRouter-${routerId}] RENDER - pathname: ${pathname}, screenWidth: ${screenWidth}, shouldUseTwoPanelLayout: ${shouldUseTwoPanelLayout}`)

  // Calculate optimal reader width based on current font
  const calculateOptimalReaderWidth = () => {
    const charWidth = CHAR_WIDTHS[settings.textFont as keyof typeof CHAR_WIDTHS] || CHAR_WIDTHS['serif']
    const contentWidth = OPTIMAL_LINE_LENGTH * charWidth
    return contentWidth + READER_PADDING + SEARCH_BAR_SPACE
  }

  const getSidePanelMinWidth = (path: string) => {
    const pageName = path.replace('/', '') as keyof typeof SIDE_PANEL_MIN_WIDTHS
    return SIDE_PANEL_MIN_WIDTHS[pageName] || 300
  }

  // Update screen width on resize
  useEffect(() => {
    const updateScreenWidth = () => {
      const width = window.innerWidth
      console.log(`[LayoutRouter-${routerId}] Screen width updated:`, width)
      setScreenWidth(width)
    }

    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth)
    return () => window.removeEventListener('resize', updateScreenWidth)
  }, [routerId])

  // Determine if we should use two-panel layout
  useEffect(() => {
    if (screenWidth === 0) return

    // For wide screens, ALWAYS use two-panel layout (even for /reader)
    // This way we never have navigation that causes reloads
    const readerWidth = calculateOptimalReaderWidth()
    const sidePanelMinWidth = Math.max(...Object.values(SIDE_PANEL_MIN_WIDTHS))
    const totalRequiredWidth = readerWidth + sidePanelMinWidth
    const shouldUseTwo = screenWidth >= totalRequiredWidth
    
    console.log(`[LayoutRouter-${routerId}] Layout decision: screenWidth=${screenWidth}, readerWidth=${readerWidth}, sidePanelMinWidth=${sidePanelMinWidth}, totalRequired=${totalRequiredWidth}, shouldUseTwo=${shouldUseTwo}`)
    setShouldUseTwoPanelLayout(shouldUseTwo)
  }, [screenWidth, settings.textFont, routerId])

  // Clean separation: route to appropriate layout
  // Force two-panel layout for testing when screen width is detected or >= 1000px
  if (shouldUseTwoPanelLayout || screenWidth >= 1000) {
    return (
      <TwoPanelLayoutNew
        initialPanel={pathname}
        readerWidth={calculateOptimalReaderWidth()}
        sidePanelMinWidth={getSidePanelMinWidth(pathname)}
      />
    )
  } else {
    return (
      <OnePanelLayout>
        {children}
      </OnePanelLayout>
    )
  }
}

export default LayoutRouter