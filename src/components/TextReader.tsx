'use client'

import React from 'react'
import MobileTextReader from './MobileTextReader'
import DesktopTextReader from './DesktopTextReader'
import { SettingsData } from './Settings'
import { ProfileData } from './Profile'
import { log, warn } from '../utils/log'

interface TextReaderProps {
  text: string
  bookTitle?: string
  author?: string
  settings: SettingsData
  profile: ProfileData
  onSettingsChange: (settings: SettingsData) => void
}

const TextReader: React.FC<TextReaderProps> = (props) => {
  // Simple, reliable mobile detection
  const isMobile = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0)
  )
  
  // Debug logging to help troubleshoot
  if (typeof window !== 'undefined') {
    log('TextReader detection:', {
      isMobile,
      userAgent: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
      component: isMobile ? 'MobileTextReader' : 'DesktopTextReader'
    })
  }
  
  // Ensure we have text content
  if (!props.text || props.text.length === 0) {
    warn('TextReader: No text content provided')
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No Text Content</h2>
        <p>No text was provided to the reader. Please try loading a book again.</p>
      </div>
    )
  }
  
  return isMobile ? <MobileTextReader {...props} /> : <DesktopTextReader {...props} />
}

export default TextReader


