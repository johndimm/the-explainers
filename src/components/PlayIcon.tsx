'use client'

import React from 'react'
import { useTheme } from '@/hooks/useTheme'
import { generatePlayIcon } from '@/utils/iconGenerator'

interface PlayIconProps {
  size?: number
  className?: string
  showShakespeare?: boolean
}

export default function PlayIcon({ 
  size = 64, 
  className = '',
  showShakespeare = true 
}: PlayIconProps) {
  const { 
    isSinglePlay, 
    playTitle, 
    appIconText, 
    themeColor,
    themeType,
    iconStyle,
    mood,
    iconColor,
    backgroundColor,
    textColor
  } = useTheme()

  // Only show icon in single play mode
  if (!isSinglePlay) {
    return null
  }

  // Generate the icon
  const icon = generatePlayIcon({
    playTitle,
    appIconText,
    theme: {
      type: themeType as any,
      color: themeColor,
      iconStyle,
      mood,
      iconColor,
      backgroundColor,
      textColor
    },
    size
  })

  return (
    <div 
      className={`play-icon ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-block'
      }}
      dangerouslySetInnerHTML={{ __html: icon.svg }}
    />
  )
}

// Export a preview component for testing different themes
export function PlayIconPreview({ 
  playTitle = "Romeo and Juliet",
  appIconText = "R&J",
  themeType = "tragedy",
  size = 128,
  className = ""
}: {
  playTitle?: string
  appIconText?: string
  themeType?: 'tragedy' | 'comedy' | 'history' | 'romance'
  size?: number
  className?: string
}) {
  // Mock theme config for preview
  const mockTheme = {
    tragedy: {
      type: 'tragedy' as const,
      color: '#8B5CF6',
      iconStyle: 'crown',
      mood: 'dramatic',
      iconColor: '#8B5CF6',
      backgroundColor: '#F8F7FF',
      textColor: '#1F2937'
    },
    comedy: {
      type: 'comedy' as const,
      color: '#10B981',
      iconStyle: 'mask',
      mood: 'playful',
      iconColor: '#10B981',
      backgroundColor: '#F0FDF4',
      textColor: '#1F2937'
    },
    history: {
      type: 'history' as const,
      color: '#DC2626',
      iconStyle: 'scroll',
      mood: 'epic',
      iconColor: '#DC2626',
      backgroundColor: '#FEF2F2',
      textColor: '#1F2937'
    },
    romance: {
      type: 'romance' as const,
      color: '#7C3AED',
      iconStyle: 'heart',
      mood: 'mystical',
      iconColor: '#7C3AED',
      backgroundColor: '#FAF5FF',
      textColor: '#1F2937'
    }
  }

  const icon = generatePlayIcon({
    playTitle,
    appIconText,
    theme: mockTheme[themeType],
    size
  })

  return (
    <div 
      className={`play-icon-preview ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-block'
      }}
      dangerouslySetInnerHTML={{ __html: icon.svg }}
    />
  )
}