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

// Helper function to handle only essential character encoding issues
const normalizeText = (text: string): string => {
  return text
    .replace(/['']/g, "'") // Replace smart quotes with regular apostrophes
    .replace(/[""]/g, '"') // Replace smart double quotes with regular quotes
    .replace(/–/g, '-')    // Replace en-dash with regular dash
    .replace(/—/g, '-')    // Replace em-dash with regular dash
    // Removed whitespace normalization - it was causing text matching issues
}

const extractDramatisPersonae = (fullText: string): Set<string> => {
  const characterNames = new Set<string>()
  
  // Look for "Dramatis Personæ" or similar variations
  const dramatisMatch = fullText.match(/(?:Dramatis Personæ|Dramatis Personae|Characters|Cast of Characters|Persons of the Play)/i)
  
  if (dramatisMatch) {
    const startIndex = dramatisMatch.index! + dramatisMatch[0].length
    // Look for the end of the character list (usually when we hit "ACT" or similar)
    const endMatch = fullText.substring(startIndex).match(/\b(?:ACT|SCENE|THE END|EPILOGUE|PROLOGUE)\b/i)
    const endIndex = endMatch ? startIndex + endMatch.index! : startIndex + 2000 // Limit to 2000 chars if no clear end
    
    const characterListText = fullText.substring(startIndex, endIndex)
    
    // Extract character names from the list
    // Format is typically: "CHARACTER NAME, description." or "CHARACTER NAME."
    const characterMatches = characterListText.match(/^([A-Z][A-Z\s&'.-]+?)(?:\s*,\s*[^.\r\n]*)?\.?\s*$/gm)
    
    if (characterMatches) {
      characterMatches.forEach(match => {
        // Clean up the character name
        const characterName = match
          .replace(/,\s*.*$/, '') // Remove description after comma
          .replace(/\.$/, '') // Remove trailing period
          .trim()
          .toUpperCase()
        
        // Only add if it looks like a character name
        if (characterName.length >= 2 && 
            /^[A-Z][A-Z\s&'.-]+$/.test(characterName) &&
            !characterName.includes('THE END') &&
            !characterName.includes('ACT') &&
            !characterName.includes('SCENE')) {
          characterNames.add(characterName)
        }
      })
    }
  }
  
  return characterNames
}

export const extractContextInfo = (selectedText: string, fullText: string, bookTitle?: string, author?: string) => {
  // Try to find the selected text in the original text
  let selectedIndex = fullText.indexOf(selectedText)
  
  if (selectedIndex === -1) {
    // If not found, try with minimal character encoding fixes
    const normalizedSelectedText = normalizeText(selectedText)
    const normalizedFullText = normalizeText(fullText)
    
    selectedIndex = normalizedFullText.indexOf(normalizedSelectedText)
    
    if (selectedIndex === -1) {
      // If still not found, try a flexible search with first few words
      const words = normalizedSelectedText.split(/\s+/)
      if (words.length > 0) {
        const searchText = words.slice(0, Math.min(3, words.length)).join(' ')
        const flexibleIndex = normalizedFullText.indexOf(searchText)
        if (flexibleIndex !== -1) {
          // Found a partial match, use the original text for context extraction
          const originalIndex = fullText.indexOf(searchText)
          if (originalIndex !== -1) {
            return extractContextFromIndex(originalIndex, selectedText.length, fullText, bookTitle, author)
          }
        }
      }
      return null
    }
    
    // Convert back to original text index if we used normalized text
    const originalIndex = fullText.indexOf(normalizedSelectedText)
    if (originalIndex !== -1) {
      selectedIndex = originalIndex
    }
  }

  return extractContextFromIndex(selectedIndex, selectedText.length, fullText, bookTitle, author)
}

const extractContextFromIndex = (selectedIndex: number, selectedLength: number, fullText: string, bookTitle?: string, author?: string) => {
  const beforeText = fullText.substring(Math.max(0, selectedIndex - 1000), selectedIndex)
  const afterText = fullText.substring(selectedIndex + selectedLength, Math.min(fullText.length, selectedIndex + selectedLength + 500))

  let act: string | null = null
  let scene: string | null = null
  let speaker: string | null = null
  let charactersOnStage: string[] = []
  let chapter: string | null = null
  let section: string | null = null
  let part: string | null = null
  let book: string | null = null

  const searchText = fullText.substring(0, selectedIndex + selectedLength)
  
  // Shakespeare-specific context (Act & Scene) - support both Roman and Arabic numerals
  const actMatches = searchText.match(/\bACT\s+([IVXLCDM]+|\d+)\b/gi)
  if (actMatches) {
    const lastActMatch = actMatches[actMatches.length - 1]
    act = lastActMatch.replace(/\bACT\s+/i, '').trim()
  }

  const sceneMatches = searchText.match(/\bSCENE\s+([IVXLCDM]+|\d+)\b/gi)
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

  // Find the most recent speaker before the selection
  // Look for speaker patterns and find the one closest to the selection
  const speakerRegex = /\n([A-Z][A-Z\s&']+)\./g
  let speakerMatch
  let lastValidSpeaker = null
  let lastValidIndex = -1
  
  // Find all speaker matches and get the one closest to the selection
  while ((speakerMatch = speakerRegex.exec(beforeText)) !== null) {
    const speakerName = speakerMatch[1].trim()
    const matchIndex = speakerMatch.index
    
    // Skip if speaker name contains underscores or is too short
    if (!speakerName.includes('_') && speakerName.length >= 2) {
      const cleanSpeakerName = speakerName.replace(/\[.*?\]/g, '').trim()
      // Keep the speaker that appears closest to the selection (highest index)
      if (matchIndex > lastValidIndex) {
        lastValidSpeaker = cleanSpeakerName
        lastValidIndex = matchIndex
      }
    }
  }
  
  speaker = lastValidSpeaker

  // Only extract stage directions and characters for plays (texts with Acts/Scenes)
  const isPlay = act !== null || scene !== null
  
  if (isPlay) {
    const textBeforeSelection = fullText.substring(0, selectedIndex)
    
    // Extract character list from Dramatis Personæ at the beginning of the play
    const characterNames = extractDramatisPersonae(fullText)
    
    // Find the current scene to limit character detection to recent stage directions
    let sceneStartIndex = 0
    if (scene) {
      const sceneMatches = textBeforeSelection.match(new RegExp(`\\bSCENE\\s+${scene}\\b`, 'gi'))
      if (sceneMatches) {
        const lastSceneMatch = sceneMatches[sceneMatches.length - 1]
        sceneStartIndex = textBeforeSelection.lastIndexOf(lastSceneMatch)
      }
    }
    
    // Only look at stage directions from the current scene onwards
    const sceneText = textBeforeSelection.substring(sceneStartIndex)
    const stageDirections = sceneText.match(/(?:\[)?_?(Enter|Exit|Exeunt)_?\s+[A-Z][A-Z\s&']+[^\r\n]*(?:\])?/gi) || []
    const currentCharacters = new Set<string>()
    
    // Each scene starts fresh - no characters carry over from previous scenes
    // The empty Set above ensures we start with zero characters for each new scene
    
    // No hardcoded character names - let the system detect characters automatically
    // based on patterns and context
    
    stageDirections.forEach(direction => {
      const trimmedDirection = direction.trim()
      const isEnter = /^.*?Enter/i.test(trimmedDirection)
      const isExit = /^.*?Exit/i.test(trimmedDirection)
      const isExeunt = /^.*?Exeunt/i.test(trimmedDirection)
      
      if (isEnter) {
        const characterMatch = trimmedDirection.match(/Enter\s+(.+)/i)
        if (characterMatch) {
          const characterList = characterMatch[1].replace(/\.$/, '')
          const characters = characterList
            .split(/\s+and\s+|,\s*/)
            .map(c => c.trim().toUpperCase())
            .filter(c => {
              // Filter out invalid character names
              if (c.length === 0) return false
              if (c.includes('SERVANT') || c.includes('PAGE')) return false
              if (c.includes('WITH') || c.includes('DISGUISED') || c.includes('MEETING')) return false
              if (c.includes('LED BY') || c.includes('AS A') || c.includes('AND')) return false
              if (c.includes('ARMED') || c.includes('SWORDS') || c.includes('BUCKLERS')) return false
              if (c.includes('AND') && !c.match(/^[A-Z]+$/)) return false // Skip compound descriptions
              // Only include if it's a known character or looks like a proper name
              return characterNames.has(c) || (/^[A-Z][A-Z\s&']+$/.test(c) && c.length >= 2)
            })
          characters.forEach(char => currentCharacters.add(char))
        }
      } else if (isExit || isExeunt) {
        if (isExeunt && trimmedDirection.toLowerCase().includes('all')) {
          currentCharacters.clear()
        } else {
          const characterMatch = trimmedDirection.match(/(?:Exit|Exeunt)\s+(.+)/i)
          if (characterMatch) {
            const characterList = characterMatch[1].replace(/[\.\]_]+$/g, '')
            const characters = characterList
              .split(/\s+and\s+|,\s*/)
              .map(c => c.trim().toUpperCase().replace(/[\.\]_]+$/g, ''))
              .filter(c => {
                if (c.length === 0) return false
                if (c.includes('WITH') || c.includes('DISGUISED') || c.includes('MEETING')) return false
                if (c.includes('LED BY') || c.includes('AS A') || c.includes('AND')) return false
                if (c.includes('ARMED') || c.includes('SWORDS') || c.includes('BUCKLERS')) return false
                if (c.includes('AND') && !c.match(/^[A-Z]+$/)) return false // Skip compound descriptions
                return characterNames.has(c) || (/^[A-Z][A-Z\s&']+$/.test(c) && c.length >= 2)
              })
            characters.forEach(char => currentCharacters.delete(char))
          }
        }
      }
    })
    
    // If we have very few characters, try to get a more reasonable list by looking at recent dialogue
    // But only add characters who haven't exited
    if (currentCharacters.size < 3) {
      // Look for character names in recent dialogue (last 500 characters)
      const recentText = textBeforeSelection.substring(Math.max(0, textBeforeSelection.length - 500))
      const dialogueMatches = recentText.match(/\n([A-Z][A-Z\s&']+)\s*\./g) || []
      
      // Get list of characters who have exited in the recent text
      const recentExits = recentText.match(/(?:\[)?_?(Exit|Exeunt)_?\s+[A-Z][A-Z\s&']+[^\r\n]*(?:\])?/gi) || []
      const exitedCharacters = new Set()
      
      recentExits.forEach(exitDirection => {
        const characterMatch = exitDirection.match(/(?:Exit|Exeunt)\s+(.+)/i)
        if (characterMatch) {
          const characterList = characterMatch[1].replace(/[\.\]_]+$/g, '')
          const characters = characterList
            .split(/\s+and\s+|,\s*/)
            .map(c => c.trim().toUpperCase().replace(/[\.\]_]+$/g, ''))
            .filter(c => c.length > 0)
          characters.forEach(char => exitedCharacters.add(char))
        }
      })
      
      dialogueMatches.forEach(match => {
        const characterName = match.replace(/\n|\s*\./g, '').trim().toUpperCase()
        // Only add if it's a valid character name and they haven't exited
        if ((characterNames.has(characterName) || (/^[A-Z][A-Z\s&']+$/.test(characterName) && characterName.length >= 2)) && !exitedCharacters.has(characterName)) {
          currentCharacters.add(characterName)
        }
      })
    }
    
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
    selectedText: fullText.substring(selectedIndex, selectedIndex + selectedLength),
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

      // Wait for content to be fully rendered before attempting restoration
      const restorePosition = (position: number, source: string) => {
        console.log(`Attempting to restore bookmark from ${source} to position:`, position)
        // Use a longer delay and wait for scrollHeight to be available
        const attemptRestore = (attempts = 0) => {
          if (attempts > 10) {
            console.log('Bookmark restoration failed after 10 attempts')
            return // Give up after 10 attempts
          }
          
          if (textReaderRef.current && textReaderRef.current.scrollHeight > 0) {
            const maxScroll = textReaderRef.current.scrollHeight - textReaderRef.current.clientHeight
            const safePosition = Math.min(position, maxScroll)
            textReaderRef.current.scrollTop = safePosition
            console.log(`Bookmark restored from ${source} to position:`, safePosition, `(max: ${maxScroll})`)
          } else {
            console.log(`Attempt ${attempts + 1}: Content not ready (scrollHeight: ${textReaderRef.current?.scrollHeight || 0})`)
            setTimeout(() => attemptRestore(attempts + 1), 100)
          }
        }
        
        setTimeout(() => attemptRestore(), 200) // Initial delay
      }

      // Try to load from database first if user is authenticated
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/user/bookmark?bookTitle=${encodeURIComponent(title)}&bookAuthor=${encodeURIComponent(auth)}`)
          if (response.ok) {
            const bookmark = await response.json()
            const position = bookmark.scroll_position
            restorePosition(position, 'database')
            return
          }
        } catch (error) {
          console.error('Error loading bookmark from database:', error)
        }
      }

      // No saved bookmark found in database

      // No saved bookmark - scroll past Project Gutenberg header
      setTimeout(() => {
        if (textReaderRef.current) {
          // Find the start of book marker and scroll past it
          const markers = [
            "*** START OF THE PROJECT GUTENBERG EBOOK",
            "*** START OF THIS PROJECT GUTENBERG EBOOK",
            "*** START OF THE PROJECT GUTENBERG",
            "START OF THE PROJECT GUTENBERG"
          ]
          
          let startIndex = -1
          for (const marker of markers) {
            startIndex = text.indexOf(marker)
            if (startIndex !== -1) {
              console.log('Found Project Gutenberg marker:', marker, 'at position:', startIndex)
              break
            }
          }
          
          if (startIndex !== -1 && textReaderRef.current.scrollHeight > 0) {
            // Calculate scroll position to the marker
            const textPercentage = startIndex / text.length
            const targetPosition = textPercentage * textReaderRef.current.scrollHeight
            console.log('Scrolling to marker position:', targetPosition, 'textPercentage:', textPercentage)
            textReaderRef.current.scrollTop = Math.max(0, targetPosition)
          } else {
            console.log('No Project Gutenberg marker found in text or content not ready')
          }
        }
      }, 300) // Longer delay for Project Gutenberg header scrolling
    }

    loadBookmark()
  }, [text, bookTitle, author, session?.user?.email])

  useEffect(() => {
    const handleScroll = () => {
      if (!textReaderRef.current) return
      const scrollPosition = textReaderRef.current.scrollTop
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(async () => {
        const title = bookTitle || 'Untitled'
        const auth = author || 'Unknown'

        // Save to database if user is authenticated or in development mode
        const isLocalDev = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
        
        if (session?.user?.email || isLocalDev) {
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

        // Bookmark saved to database
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

  // Search query state managed locally

  // Search functionality

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

  const renderTextWithSearchHighlight = (textToRender: string, isPageMode: boolean = false, currentPageIndex: number = 0, isMobile: boolean = false) => {
    if (searchResults.length === 0 || !searchQuery.trim()) {
      return textToRender
    }

    // Simple approach: find and highlight the search query text in the current text
    const query = searchQuery.trim()
    if (!query) return textToRender

    const parts: React.ReactNode[] = []
    let lastIndex = 0

    // Use the same regex as the search function for case-insensitive highlighting
    const regex = buildFlexibleRegex(query)
    if (!regex) return textToRender

    let match: RegExpExecArray | null
    while ((match = regex.exec(textToRender)) !== null) {
      const index = match.index
      const matchedText = match[0]

      // Add text before the match
      if (index > lastIndex) {
        parts.push(textToRender.slice(lastIndex, index))
      }

      // Check if this match corresponds to the current search result
      const isCurrentResult = searchResults[currentSearchIndex] && 
        searchResults[currentSearchIndex].index >= 0 &&
        searchResults[currentSearchIndex].index === index

      // Add the highlighted match (use the actual matched text, not the query)
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
          {matchedText}
        </span>
      )

      lastIndex = index + matchedText.length
      regex.lastIndex = index + Math.max(1, matchedText.length)
    }

    // Add remaining text
    if (lastIndex < textToRender.length) {
      parts.push(textToRender.slice(lastIndex))
    }

    return <>{parts}</>
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
    renderTextWithSearchHighlight,
    clearSearch
  }
}

export type { SettingsData, ProfileData }


