'use client'

import React, { useEffect, useRef, useState } from 'react'

// Shared types pulled from existing components
import { SettingsData } from './Settings'
import { ProfileData } from './Profile'

export interface ReaderCommonProps {
  text: string
  bookTitle?: string
  author?: string
  settings: SettingsData
  profile: ProfileData
  onSettingsChange: (settings: SettingsData) => void
}

export const buildFlexibleRegex = (query: string): RegExp | null => {
  const trimmed = query.trim()
  if (!trimmed) return null
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const tokens = trimmed
    .split(/[\s\u00A0,.;:!?\-—–'"“”‘’]+/)
    .filter(Boolean)
    .map(escapeRegex)
  if (tokens.length === 0) return null
  const sep = "[\\s\\u00A0,.;:!?\\-—–'\"“”‘’]*"
  const pattern = tokens.join(sep)
  try {
    return new RegExp(pattern, 'gi')
  } catch {
    return null
  }
}

export const extractContextInfo = (selectedText: string, fullText: string, bookTitle?: string, author?: string) => {
  const selectedIndex = fullText.indexOf(selectedText)
  if (selectedIndex === -1) return null

  const beforeText = fullText.substring(Math.max(0, selectedIndex - 1000), selectedIndex)
  const afterText = fullText.substring(selectedIndex + selectedText.length, Math.min(fullText.length, selectedIndex + selectedText.length + 500))

  let act: string | null = null
  let scene: string | null = null
  let speaker: string | null = null
  let charactersOnStage: string[] = []

  const searchText = fullText.substring(0, selectedIndex + selectedText.length)
  const actMatches = searchText.match(/\bACT\s+([IVXLCDM]+)\b/gi)
  if (actMatches) {
    const lastActMatch = actMatches[actMatches.length - 1]
    act = lastActMatch.replace(/\bACT\s+/i, '').trim()
  }

  const sceneMatches = searchText.match(/\bSCENE\s+([IVXLCDM]+)\b/gi)
  if (sceneMatches) {
    const lastSceneMatch = sceneMatches[sceneMatches.length - 1]
    scene = lastSceneMatch.replace(/\bSCENE\s+/i, '').trim()
  }

  const speakerMatches = beforeText.match(/\n([A-Z][A-Z\s&']+)\./g)
  if (speakerMatches && speakerMatches.length > 0) {
    const lastSpeakerMatch = speakerMatches[speakerMatches.length - 1]
    const speakerName = lastSpeakerMatch.replace(/^\n/, '').replace(/\.$/, '').trim()
    speaker = speakerName.replace(/\[.*?\]/g, '').trim()
    if (speaker.includes('_') || speaker.length < 2) {
      speaker = null
    }
  }

  const textBeforeSelection = fullText.substring(0, selectedIndex)
  const stageDirections = textBeforeSelection.match(/\s+Enter\s+[^\r\n]+|Exit\s+[^\r\n]+|Exeunt[^\r\n]*/gi) || []
  const currentCharacters = new Set<string>()
  stageDirections.forEach(direction => {
    const trimmedDirection = direction.trim()
    const isEnter = /^Enter/i.test(trimmedDirection)
    const isExit = /^Exit/i.test(trimmedDirection)
    const isExeunt = /^Exeunt/i.test(trimmedDirection)
    if (isEnter) {
      const characterMatch = trimmedDirection.match(/Enter\s+(.+)/i)
      if (characterMatch) {
        const characterList = characterMatch[1].replace(/\.$/, '')
        const characters = characterList
          .split(/\s+and\s+|,\s*/)
          .map(c => c.trim().toUpperCase())
          .filter(c => c.length > 0 && !c.includes('SERVANT') && !c.includes('PAGE'))
        characters.forEach(char => currentCharacters.add(char))
      }
    } else if (isExit || isExeunt) {
      if (isExeunt && trimmedDirection.toLowerCase().includes('all')) {
        currentCharacters.clear()
      } else {
        const characterMatch = trimmedDirection.match(/(?:Exit|Exeunt)\s+(.+)/i)
        if (characterMatch) {
          const characterList = characterMatch[1].replace(/\.$/, '')
          const characters = characterList
            .split(/\s+and\s+|,\s*/)
            .map(c => c.trim().toUpperCase())
            .filter(c => c.length > 0)
          characters.forEach(char => currentCharacters.delete(char))
        }
      }
    }
  })
  charactersOnStage = Array.from(currentCharacters)

  return {
    bookTitle,
    author,
    act,
    scene,
    speaker,
    charactersOnStage,
    selectedText,
    beforeContext: beforeText.slice(-200),
    afterContext: afterText.slice(0, 200)
  }
}

export const useBookmarkRestoreAndSave = (
  textReaderRef: React.RefObject<HTMLDivElement | null>,
  text: string,
  bookTitle?: string,
  author?: string
) => {
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!text || text.length < 100) return
    const title = bookTitle || 'Untitled'
    const auth = author || 'Unknown'
    const bookmarkKey = `bookmark-${title}-${auth}`

    const savedPosition = typeof window !== 'undefined' ? localStorage.getItem(bookmarkKey) : null
    if (savedPosition) {
      const position = parseInt(savedPosition)
      setTimeout(() => {
        if (textReaderRef.current) {
          textReaderRef.current.scrollTop = position
        }
      }, 300)
    }
  }, [text, bookTitle, author, textReaderRef])

  useEffect(() => {
    const handleScroll = () => {
      if (!textReaderRef.current) return
      const scrollPosition = textReaderRef.current.scrollTop
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        const title = bookTitle || 'Untitled'
        const auth = author || 'Unknown'
        const bookmarkKey = `bookmark-${title}-${auth}`
        localStorage.setItem(bookmarkKey, scrollPosition.toString())
      }, 500)
    }

    const el = textReaderRef.current
    if (!el) return
    setTimeout(() => el.addEventListener('scroll', handleScroll), 100)
    return () => {
      el.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [bookTitle, author, text, textReaderRef])
}

export const useSearchCore = (
  text: string,
  textReaderRef: React.RefObject<HTMLDivElement | null>,
  textContentRef: React.RefObject<HTMLDivElement | null>
) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ index: number, length: number }[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setCurrentSearchIndex(-1)
      return
    }
    const results: { index: number, length: number }[] = []
    const regex = buildFlexibleRegex(query)
    if (!regex) {
      setSearchResults([])
      setCurrentSearchIndex(-1)
      return
    }
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      const start = match.index
      const length = match[0].length
      results.push({ index: start, length })
      regex.lastIndex = start + Math.max(1, length)
    }
    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)

    if (results.length > 0) {
      scrollToSearchResult(0, results)
    }
  }

  const scrollToSearchResult = (resultIndex: number, results: { index: number, length: number }[]) => {
    if (resultIndex < 0 || resultIndex >= results.length || !textContentRef.current) return
    const result = results[resultIndex]
    setTimeout(() => {
      const highlightedElements = textContentRef.current?.querySelectorAll('span[style*="background"]')
      if (highlightedElements && highlightedElements.length > 0) {
        const targetElement = highlightedElements[resultIndex] as HTMLElement
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
          return
        }
      }
      const scrollContainer = textReaderRef.current
      if (scrollContainer) {
        const textPercentage = result.index / text.length
        const targetPosition = textPercentage * scrollContainer.scrollHeight * 0.8
        scrollContainer.scrollTop = Math.max(0, targetPosition - 200)
      }
    }, 100)
  }

  const nextSearchResult = () => {
    if (searchResults.length === 0) return
    const newIndex = (currentSearchIndex + 1) % searchResults.length
    setCurrentSearchIndex(newIndex)
    scrollToSearchResult(newIndex, searchResults)
  }

  const prevSearchResult = () => {
    if (searchResults.length === 0) return
    const newIndex = currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1
    setCurrentSearchIndex(newIndex)
    scrollToSearchResult(newIndex, searchResults)
  }

  const renderTextWithSearchHighlight = (textToRender: string) => {
    if (searchResults.length > 0 && searchQuery.trim()) {
      const parts: React.ReactNode[] = []
      let lastIndex = 0
      searchResults.forEach((result, index) => {
        if (result.index > lastIndex) {
          parts.push(textToRender.slice(lastIndex, result.index))
        }
        const isCurrentResult = index === currentSearchIndex
        const searchText = textToRender.slice(result.index, result.index + result.length)
        parts.push(
          <span 
            key={`search-${index}`}
            style={{
              backgroundColor: isCurrentResult ? '#8b5cf6' : '#ffeb3b',
              color: isCurrentResult ? 'white' : 'black',
              padding: '1px 2px',
              borderRadius: '2px'
            }}
          >
            {searchText}
          </span>
        )
        lastIndex = result.index + result.length
      })
      if (lastIndex < textToRender.length) {
        parts.push(textToRender.slice(lastIndex))
      }
      return <>{parts}</>
    }
    return textToRender
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
    renderTextWithSearchHighlight
  }
}

export type { SettingsData, ProfileData }


