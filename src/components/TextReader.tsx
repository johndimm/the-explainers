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
  const isMobile = typeof window !== 'undefined' && (
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    (navigator.maxTouchPoints > 0)
  )
  return isMobile ? <MobileTextReader {...props} /> : <DesktopTextReader {...props} />
}

export default TextReader


