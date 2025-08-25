'use client'

import React, { useState, useEffect } from 'react'
import DesktopTextReader from './DesktopTextReader'
import MobileTextReader from './MobileTextReader'
import { SettingsData } from './Settings'
import { ProfileData } from './Profile'

interface TextReaderProps {
  text: string
  bookTitle?: string
  author?: string
  settings: SettingsData
  profile: ProfileData
  onSettingsChange: (settings: SettingsData) => void
}

const TextReader: React.FC<TextReaderProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings, profile, onSettingsChange }) => {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean | null>(null)

  // Detect device type on mount
  useEffect(() => {
    const checkDevice = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      
      // Consider it a touch device if it has touch capability OR is identified as mobile
      setIsTouchDevice(hasTouch || isMobile)
    }
    
    checkDevice()
  }, [])

  // Handle text selection callback
  const handleTextSelect = (selectedText: string) => {
    // This could route to chat or other functionality
    // For now, just log the selection - could be extended to handle routing
    console.log('Text selected:', selectedText)
  }

  // Show loading state while device detection is happening
  if (isTouchDevice === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading reader...
      </div>
    )
  }


  // Route to appropriate platform-specific component
  return isTouchDevice ? (
    <MobileTextReader
      text={text}
      bookTitle={bookTitle}
      author={author}
      onTextSelect={handleTextSelect}
    />
  ) : (
    <DesktopTextReader
      text={text}
      bookTitle={bookTitle}
      author={author}
      onTextSelect={handleTextSelect}
    />
  )
}

export default TextReader