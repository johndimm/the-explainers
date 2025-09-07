'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

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

// Page mapping interface
export interface PageMap {
  pages: string[]
  pageRanges: Array<{ start: number; end: number; pageIndex: number }>
}

// Page calculation utilities for page-by-page reading mode
export const calculatePageContent = (text: string, pageHeight: number, lineHeight: number, charsPerLine: number): PageMap => {
  const pages: string[] = []
  const pageRanges: Array<{ start: number; end: number; pageIndex: number }> = []
  const lines = text.split('\n')
  let currentPage: string[] = []
  let currentHeight = 0
  let currentStartPos = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Calculate how many lines this text will actually take up
    const estimatedLines = Math.max(1, Math.ceil(line.length / charsPerLine))
    const lineHeightPx = estimatedLines * lineHeight
    
    if (currentHeight + lineHeightPx > pageHeight) {
      // Current page is full, start a new one
      if (currentPage.length > 0) {
        const pageContent = currentPage.join('\n')
        pages.push(pageContent)
        pageRanges.push({
          start: currentStartPos,
          end: currentStartPos + pageContent.length,
          pageIndex: pages.length - 1
        })
        currentPage = []
        currentHeight = 0
        currentStartPos += pageContent.length

      }
      
      // If a single line is too long for a page, split it
      if (lineHeightPx > pageHeight) {
        // Split the long line into chunks that fit on a page
        let remainingLine = line
        while (remainingLine.length > 0) {
          const charsThatFit = Math.floor((pageHeight / lineHeight) * charsPerLine)
          const chunk = remainingLine.substring(0, charsThatFit)
          pages.push(chunk)
          pageRanges.push({
            start: currentStartPos,
            end: currentStartPos + chunk.length,
            pageIndex: pages.length - 1
          })
          currentStartPos += chunk.length
          remainingLine = remainingLine.substring(charsThatFit)
        }
        currentHeight = 0
      } else {
        currentPage = [line]
        currentHeight = lineHeightPx
      }
    } else {
      currentPage.push(line)
      currentHeight += lineHeightPx
    }
  }
  
  // Add the last page if it has content
  if (currentPage.length > 0) {
    const pageContent = currentPage.join('\n')
    pages.push(pageContent)
    pageRanges.push({
      start: currentStartPos,
      end: currentStartPos + pageContent.length,
      pageIndex: pages.length - 1
    })
  }
  

  
  return { pages, pageRanges }
}

export const estimateCharsPerLine = (containerWidth: number, fontSize: number, fontFamily: string): number => {
  // Rough estimation based on font characteristics
  const charWidth = fontFamily === 'monospace' ? fontSize * 0.6 : fontSize * 0.5
  return Math.floor(containerWidth / charWidth)
}

// Find which page contains a specific text position using page mapping
export const findPageForPosition = (position: number, pageMap: PageMap): number => {
  if (pageMap.pageRanges.length === 0) return 0
  
  // Find the page range that contains this position
  for (const range of pageMap.pageRanges) {
    if (position >= range.start && position < range.end) {
      return range.pageIndex
    }
  }
  
  // If position is beyond all pages, return last page
  return pageMap.pageRanges.length - 1
}

// Legacy function for backward compatibility
export const findPageForPositionLegacy = (text: string, position: number, pages: string[]): number => {
  if (pages.length === 0) return 0
  
  // For page mode, we need to find which page contains the search result
  // The position is the character index in the full text
  let currentPos = 0
  for (let i = 0; i < pages.length; i++) {
    const pageLength = pages[i].length
    if (position >= currentPos && position < currentPos + pageLength) {
      return i
    }
    currentPos += pageLength
  }
  
  // If position is beyond all pages, return last page
  return pages.length - 1
}

// Alternative approach: Find page by searching for text content
export const findPageByContent = (searchText: string, pages: string[]): number => {
  if (pages.length === 0) return 0
  
  // Search for the text in each page
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].includes(searchText)) {
      return i
    }
  }
  
  // If not found, return 0
  return 0
}

// Find page by searching for the actual search result text
export const findPageBySearchResult = (searchResult: { index: number; length: number }, text: string, pages: string[]): number => {
  if (pages.length === 0) return 0
  
  // Get the actual text that was found
  const foundText = text.substring(searchResult.index, searchResult.index + searchResult.length)
  
  // Search for this text in each page
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].includes(foundText)) {
      return i
    }
  }
  
  // If not found, return 0
  return 0
}

// Convert full text position to page-relative position using page mapping
export const convertToPagePosition = (fullTextPosition: number, pageMap: PageMap): { pageIndex: number; pagePosition: number } => {
  if (pageMap.pageRanges.length === 0) return { pageIndex: 0, pagePosition: 0 }
  
  // Find the page range that contains this position
  for (const range of pageMap.pageRanges) {
    if (fullTextPosition >= range.start && fullTextPosition < range.end) {
      return { pageIndex: range.pageIndex, pagePosition: fullTextPosition - range.start }
    }
  }
  
  // If position is beyond all pages, return last page
  return { pageIndex: pageMap.pageRanges.length - 1, pagePosition: 0 }
}

// Legacy function for backward compatibility
export const convertToPagePositionLegacy = (fullTextPosition: number, pages: string[]): { pageIndex: number; pagePosition: number } => {
  if (pages.length === 0) return { pageIndex: 0, pagePosition: 0 }
  
  let currentPos = 0
  for (let i = 0; i < pages.length; i++) {
    const pageLength = pages[i].length
    if (fullTextPosition >= currentPos && fullTextPosition < currentPos + pageLength) {
      return { pageIndex: i, pagePosition: fullTextPosition - currentPos }
    }
    currentPos += pageLength
  }
  
  // If position is beyond all pages, return last page
  return { pageIndex: pages.length - 1, pagePosition: 0 }
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
  let chapter: string | null = null
  let section: string | null = null
  let part: string | null = null
  let book: string | null = null

  const searchText = fullText.substring(0, selectedIndex + selectedText.length)
  
  // Shakespeare-specific context (Act & Scene)
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

  // General book context (Chapter, Section, Part, Book)
  const chapterMatches = searchText.match(/\bCHAPTER\s+([IVXLCDM0-9]+)\b/gi)
  if (chapterMatches) {
    const lastChapterMatch = chapterMatches[chapterMatches.length - 1]
    chapter = lastChapterMatch.replace(/\bCHAPTER\s+/i, '').trim()
  }

  const sectionMatches = searchText.match(/\bSECTION\s+([IVXLCDM0-9]+)\b/gi)
  if (sectionMatches) {
    const lastSectionMatch = sectionMatches[sectionMatches.length - 1]
    section = lastSectionMatch.replace(/\bSECTION\s+/i, '').trim()
  }

  const partMatches = searchText.match(/\bPART\s+([IVXLCDM0-9]+)\b/gi)
  if (partMatches) {
    const lastPartMatch = partMatches[partMatches.length - 1]
    part = lastPartMatch.replace(/\bPART\s+/i, '').trim()
  }

  const bookMatches = searchText.match(/\bBOOK\s+([IVXLCDM0-9]+)\b/gi)
  if (bookMatches) {
    const lastBookMatch = bookMatches[bookMatches.length - 1]
    book = lastBookMatch.replace(/\bBOOK\s+/i, '').trim()
  }

  // Alternative chapter formats (e.g., "Chapter 1", "Ch. 1", "I.")
  const altChapterMatches = searchText.match(/\b(?:Chapter|Ch\.?)\s+([IVXLCDM0-9]+)\b/gi)
  if (altChapterMatches && !chapter) {
    const lastAltChapterMatch = altChapterMatches[altChapterMatches.length - 1]
    chapter = lastAltChapterMatch.replace(/\b(?:Chapter|Ch\.?)\s+/i, '').trim()
  }

  // Roman numeral chapters (e.g., "I.", "II.", "III.")
  const romanChapterMatches = searchText.match(/\b([IVXLCDM]+)\.\s*\n/g)
  if (romanChapterMatches && !chapter) {
    const lastRomanMatch = romanChapterMatches[romanChapterMatches.length - 1]
    chapter = lastRomanMatch.replace(/\.\s*\n$/, '').trim()
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

  // Only extract stage directions and characters for plays (texts with Acts/Scenes)
  const isPlay = act !== null || scene !== null
  
  if (isPlay) {
    const textBeforeSelection = fullText.substring(0, selectedIndex)
    // More specific regex for actual stage directions
    const stageDirections = textBeforeSelection.match(/\n\s*Enter\s+[A-Z][A-Z\s&']+[^\r\n]*|\n\s*Exit\s+[A-Z][A-Z\s&']+[^\r\n]*|\n\s*Exeunt[^\r\n]*/gi) || []
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
  }

  return {
    bookTitle,
    author,
    act,
    scene,
    speaker,
    charactersOnStage,
    chapter,
    section,
    part,
    book,
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
  const { data: session } = useSession()

  useEffect(() => {
    const loadBookmark = async () => {
      if (!text || text.length < 100) return
      const title = bookTitle || 'Untitled'
      const auth = author || 'Unknown'

      // Try to load from database first if user is authenticated
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/user/bookmark?bookTitle=${encodeURIComponent(title)}&bookAuthor=${encodeURIComponent(auth)}`)
          if (response.ok) {
            const bookmark = await response.json()
            const position = bookmark.scroll_position
            setTimeout(() => {
              if (textReaderRef.current) {
                textReaderRef.current.scrollTop = position
              }
            }, 300)
            return
          }
        } catch (error) {
          console.error('Error loading bookmark from database:', error)
        }
      }

      // Fallback to localStorage for backward compatibility or non-authenticated users
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
    }

    loadBookmark()
  }, [text, bookTitle, author, textReaderRef, session])

  useEffect(() => {
    const handleScroll = () => {
      if (!textReaderRef.current) return
      const scrollPosition = textReaderRef.current.scrollTop
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(async () => {
        const title = bookTitle || 'Untitled'
        const auth = author || 'Unknown'

        // Save to database if user is authenticated
        if (session?.user?.email) {
          try {
            await fetch('/api/user/bookmark', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookTitle: title,
                bookAuthor: auth,
                scrollPosition: scrollPosition
              })
            })
          } catch (error) {
            console.error('Error saving bookmark to database:', error)
          }
        }

        // Also save to localStorage for backward compatibility or non-authenticated users
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
  }, [bookTitle, author, text, textReaderRef, session])
}

export const useSearchCore = (
  text: string,
  textReaderRef: React.RefObject<HTMLDivElement | null>,
  textContentRef: React.RefObject<HTMLDivElement | null>,
  onNavigateToPage?: (pageNum: number) => void,
  pageMap?: PageMap // Use PageMap instead of just pages array
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
    
    // If we have page navigation and page mapping, navigate to the correct page first
    if (onNavigateToPage && pageMap && pageMap.pages.length > 0) {
      // Use the more reliable method: search for the actual text in each page
      const targetPage = findPageBySearchResult(result, text, pageMap.pages)
      onNavigateToPage(targetPage)
    }
    
    setTimeout(() => {
      const highlightedElements = textContentRef.current?.querySelectorAll('span[style*="background"]')
      if (highlightedElements && highlightedElements.length > 0) {
        const targetElement = highlightedElements[resultIndex] as HTMLElement
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
          return
        }
      }
      
      // Only do scroll-based navigation if we're not in page mode
      if (!onNavigateToPage || !pageMap || pageMap.pages.length === 0) {
        const scrollContainer = textReaderRef.current
        if (scrollContainer) {
          const textPercentage = result.index / text.length
          const targetPosition = textPercentage * scrollContainer.scrollHeight * 0.8
          scrollContainer.scrollTop = Math.max(0, targetPosition - 200)
        }
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

  const renderTextWithSearchHighlight = (textToRender: string, isPageMode: boolean = false, currentPageIndex: number = 0) => {
    if (searchResults.length === 0 || !searchQuery.trim()) {
      return textToRender
    }

    // Simple approach: find and highlight the search query text in the current text
    const query = searchQuery.trim()
    if (!query) return textToRender

    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let currentIndex = 0

    // Find all occurrences of the search query in the current text
    while (true) {
      const index = textToRender.indexOf(query, currentIndex)
      if (index === -1) break

      // Add text before the match
      if (index > lastIndex) {
        parts.push(textToRender.slice(lastIndex, index))
      }

      // Check if this match corresponds to the current search result
      const isCurrentResult = searchResults[currentSearchIndex] && 
        searchResults[currentSearchIndex].index >= 0 &&
        textToRender.slice(index, index + query.length) === query

      // Add the highlighted match
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
          {query}
        </span>
      )

      lastIndex = index + query.length
      currentIndex = index + 1 // Move past this match to find next one
    }

    // Add remaining text
    if (lastIndex < textToRender.length) {
      parts.push(textToRender.slice(lastIndex))
    }

    return <>{parts}</>
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


