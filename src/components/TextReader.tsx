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
  profile?: ProfileData | null
  onSettingsChange: (settings: SettingsData) => void
}

const TextReader: React.FC<TextReaderProps> = (props) => {
  // More reliable mobile detection - only use touch points if user agent also indicates mobile
  const isMobile = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
  
  // Debug logging to help troubleshoot
  if (typeof window !== 'undefined') {
    try {
      log('TextReader detection:', {
        isMobile,
        userAgent: navigator.userAgent,
        maxTouchPoints: navigator.maxTouchPoints,
        hasTouchPoints: navigator.maxTouchPoints > 0,
        isMobileUserAgent: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        component: isMobile ? 'MobileTextReader' : 'DesktopTextReader',
        isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
      })
    } catch (error) {
      console.error('🚨 Error in TextReader detection:', error)
    }
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


