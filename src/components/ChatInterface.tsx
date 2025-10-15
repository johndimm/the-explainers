'use client'

import React from 'react'
import { SimplifiedChatInterface } from './chat/SimplifiedChatInterface'
import { SettingsData } from './Settings'

interface ChatInterfaceProps {
  selectedText: string
  bookTitle: string
  author: string
  isPageMode: boolean
  settings: SettingsData
  onSettingsChange: (settings: SettingsData) => void
  contextInfo?: any
  profile?: any
  onClose?: () => void
}

export default function ChatInterface({
  selectedText,
  bookTitle,
  author,
  isPageMode,
  settings,
  onSettingsChange,
  contextInfo,
  profile,
  onClose
}: ChatInterfaceProps) {
  return (
    <SimplifiedChatInterface
      selectedText={selectedText}
      bookTitle={bookTitle}
      author={author}
      isPageMode={isPageMode}
      settings={settings}
      onSettingsChange={onSettingsChange}
      contextInfo={contextInfo}
      profile={profile}
      onClose={onClose}
    />
  )
}

// Re-export the types for backward compatibility
export type { SettingsData } from './Settings'
export type { ProfileData } from './Profile'