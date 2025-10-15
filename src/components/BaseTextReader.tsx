'use client'

import React, { useState, useRef, useEffect } from 'react'
import { log } from '../utils/log'
import { getDeviceId } from '@/utils/deviceId'
import { API_BASE_URL } from '@/utils/apiConfig'
import { SettingsData } from './Settings'
import { ProfileData } from './Profile'
import { PageMap, calculatePageContent, findPageForPosition } from '../utils/pageUtils'
import { extractContextInfo as extractContext, ContextInfo } from '../utils/contextUtils'
import { 
  performSearch, 
  scrollToSearchResult, 
  renderTextWithSearchHighlight,
  SearchResult 
} from '../utils/searchUtils'

export interface ReaderCommonProps {
  text: string
  bookTitle?: string
  author?: string
  settings: SettingsData
  profile: ProfileData
  onSettingsChange: (settings: SettingsData) => void
}

// Bookmark management hook
export const useBookmarkRestoreAndSave = (
  textLength: number,
  bookTitle?: string,
  author?: string,
  disableBookmarkSaving: boolean = false
) => {
  const [isRestoring, setIsRestoring] = useState(false)
  const [currentPosition, setCurrentPosition] = useState(0)
  const lastSaveTime = useRef(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const saveBookmark = async (scrollPosition: number, fontSize: number) => {
    if (disableBookmarkSaving || !bookTitle || !author) return

    const now = Date.now()
    const timeSinceLastSave = now - lastSaveTime.current

    // Debounce saves - only save if it's been more than 2 seconds since last save
    if (timeSinceLastSave < 2000) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveBookmark(scrollPosition, fontSize)
      }, 2000 - timeSinceLastSave)
      return
    }

    lastSaveTime.current = now

    try {
      const deviceId = getDeviceId()
      const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle,
          bookAuthor: author,
          scrollPosition,
          fontSize,
          userId: deviceId
        })
      })

      if (response.ok) {
        log('debug', 'Bookmark saved successfully')
      }
    } catch (error) {
      log('error', 'Failed to save bookmark:', error)
    }
  }

  const loadBookmark = async (): Promise<{ position: number; fontSize: number } | null> => {
    if (!bookTitle || !author) return null

    try {
      const deviceId = getDeviceId()
      const response = await fetch(`${API_BASE_URL}/api/bookmarks?bookTitle=${encodeURIComponent(bookTitle)}&bookAuthor=${encodeURIComponent(author)}&userId=${deviceId}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.bookmark) {
          return {
            position: data.bookmark.scroll_position,
            fontSize: data.bookmark.font_size
          }
        }
      }
    } catch (error) {
      log('error', 'Failed to load bookmark:', error)
    }

    return null
  }

  return {
    saveBookmark,
    loadBookmark,
    isRestoring,
    setIsRestoring,
    currentPosition,
    setCurrentPosition
  }
}

// Search functionality hook
export const useSearchCore = (
  text: string,
  textReaderRef: React.RefObject<HTMLDivElement | null>,
  textContentRef: React.RefObject<HTMLDivElement | null>,
  onNavigateToPage?: (pageNum: number) => void,
  pageMap?: PageMap
) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)

  const handleSearch = (query: string) => {
    const results = performSearch(text, query)
    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)

    if (results.length > 0) {
      scrollToSearchResult(0, results, text, textContentRef, textReaderRef, onNavigateToPage, pageMap)
    }
  }

  const nextSearchResult = () => {
    if (searchResults.length === 0) return
    const newIndex = (currentSearchIndex + 1) % searchResults.length
    setCurrentSearchIndex(newIndex)
    scrollToSearchResult(newIndex, searchResults, text, textContentRef, textReaderRef, onNavigateToPage, pageMap)
  }

  const prevSearchResult = () => {
    if (searchResults.length === 0) return
    const newIndex = currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1
    setCurrentSearchIndex(newIndex)
    scrollToSearchResult(newIndex, searchResults, text, textContentRef, textReaderRef, onNavigateToPage, pageMap)
  }

  const renderTextWithHighlight = (textToRender: string) => {
    return renderTextWithSearchHighlight(textToRender, searchQuery, searchResults, currentSearchIndex)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setCurrentSearchIndex(-1)
  }

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    handleSearch,
    nextSearchResult,
    prevSearchResult,
    renderTextWithSearchHighlight: renderTextWithHighlight,
    clearSearch
  }
}

// Main context extraction function
export const extractContextInfo = (selectedText: string, fullText: string, bookTitle?: string, author?: string): ContextInfo | null => {
  return extractContext(selectedText, fullText, bookTitle, author)
}

// Re-export types for backward compatibility
export type { SettingsData, ProfileData }
export type { PageMap } from '../utils/pageUtils'
export type { ContextInfo } from '../utils/contextUtils'
export type { SearchResult } from '../utils/searchUtils'