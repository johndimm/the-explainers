'use client'

import React from 'react'
import MobileTextReader from './MobileTextReader'
import DesktopTextReader from './DesktopTextReader'
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

const TextReader: React.FC<TextReaderProps> = (props) => {
  try {
    // More robust mobile detection with fallbacks
    let isMobile = false
    
    if (typeof window !== 'undefined') {
      // Primary detection methods
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        isMobile = true
      } else if (navigator.maxTouchPoints > 0) {
        isMobile = true
      } else if (navigator.userAgent) {
        // Fallback to user agent detection
        const ua = navigator.userAgent.toLowerCase()
        isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
      }
      
      // Debug logging
      console.log('TextReader mobile detection:', {
        isMobile,
        matchMedia: window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : 'N/A',
        maxTouchPoints: navigator.maxTouchPoints,
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height
      })
    }
    
    return isMobile ? <MobileTextReader {...props} /> : <DesktopTextReader {...props} />
  } catch (error) {
    console.error('Error in TextReader:', error)
    // Fallback to desktop reader if there's an error
    return <DesktopTextReader {...props} />
  }
}

export default TextReader


