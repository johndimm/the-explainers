'use client'

import React, { useEffect, useRef, useState } from 'react'
import { log } from '../utils/log'
import { getDeviceId } from '@/utils/deviceId'
import { API_BASE_URL } from '@/utils/apiConfig'

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
log('debug', '🔍 EXTRACT CONTEXT INFO DEBUG:')
log('debug', 'Selected text:', JSON.stringify(selectedText))
log('debug', 'Selected text length:', selectedText.length)
log('debug', 'Full text length:', fullText.length)
log('debug', 'First 200 chars of full text:', JSON.stringify(fullText.substring(0, 200)))
  
  // Search for Olivia's actual quote in the text with different line break formats
  const oliviaQuote1 = "There is no slander in an allowed fool"
  const oliviaQuote2 = "There is\r\nno slander in an allowed fool"
  const oliviaQuote3 = "There is\nno slander in an allowed fool"
  
  const oliviaIndex1 = fullText.indexOf(oliviaQuote1)
  const oliviaIndex2 = fullText.indexOf(oliviaQuote2)
  const oliviaIndex3 = fullText.indexOf(oliviaQuote3)
  
log('🔍 SEARCHING FOR OLIVIA QUOTE WITH DIFFERENT LINE BREAKS:')
log('debug', 'Quote 1 (no breaks):', oliviaIndex1)
log('debug', 'Quote 2 (\\r\\n):', oliviaIndex2)
log('debug', 'Quote 3 (\\n):', oliviaIndex3)
  
  const foundIndex = Math.max(oliviaIndex1, oliviaIndex2, oliviaIndex3)
  if (foundIndex !== -1) {
    const oliviaContext = fullText.substring(Math.max(0, foundIndex - 200), foundIndex + 200)
log('debug', 'Olivia context (400 chars around quote):', JSON.stringify(oliviaContext))
  }
  
  // Normalize line breaks in selected text to match stored text format
  const normalizedSelectedText = selectedText.replace(/\n/g, '\r\n')
log('debug', 'Normalized selected text:', JSON.stringify(normalizedSelectedText))
  
  // Try to find the selected text in the original text (both formats)
  let selectedIndex = fullText.indexOf(selectedText)
  let normalizedIndex = fullText.indexOf(normalizedSelectedText)
  
log('debug', 'Original text index:', selectedIndex)
log('debug', 'Normalized text index:', normalizedIndex)
  
  // Use the normalized version if it's found
  if (normalizedIndex !== -1) {
    selectedIndex = normalizedIndex
log('debug', 'Using normalized text index:', selectedIndex)
  }
  
  // If found, check if it's preceded by OLIVIA to make sure we found the right occurrence
  if (selectedIndex !== -1) {
    const textBeforeFound = fullText.substring(Math.max(0, selectedIndex - 100), selectedIndex)
    const hasOliviaBefore = /OLIVIA\.?\s*$/m.test(textBeforeFound.split('\n').slice(-3).join('\n'))
    
log('debug', 'Text before first occurrence (last 100 chars):', JSON.stringify(textBeforeFound))
log('debug', 'Has OLIVIA before first occurrence:', hasOliviaBefore)
    
    if (!hasOliviaBefore) {
      // This is not Olivia's speech, search for the next occurrence
log('debug', 'First occurrence is not Olivia, searching for next occurrence...')
      let searchStart = selectedIndex + 1
      let occurrenceCount = 1
      while (true) {
        const nextIndex = fullText.indexOf(selectedText, searchStart)
        if (nextIndex === -1) {
log(`No more occurrences found after ${occurrenceCount} attempts`)
          break
        }
        
        occurrenceCount++
        const textBeforeNext = fullText.substring(Math.max(0, nextIndex - 100), nextIndex)
        const hasOliviaBeforeNext = /OLIVIA\.?\s*$/m.test(textBeforeNext.split('\n').slice(-3).join('\n'))
        
log('debug', `Occurrence ${occurrenceCount} at index ${nextIndex}:`, JSON.stringify(textBeforeNext))
log('debug', `Has OLIVIA before occurrence ${occurrenceCount}:`, hasOliviaBeforeNext)
        
        if (hasOliviaBeforeNext) {
          selectedIndex = nextIndex
log(`✅ FOUND CORRECT OCCURRENCE at index ${selectedIndex}`)
          break
        }
        searchStart = nextIndex + 1
      }
    } else {
log('✅ First occurrence is correct (has OLIVIA before)')
    }
  }
  
  if (selectedIndex === -1) {
log('❌ SELECTED TEXT NOT FOUND - TRYING FALLBACK LOGIC')
    // If not found, try with minimal character encoding fixes
    const normalizedSelectedText = normalizeText(selectedText)
    const normalizedFullText = normalizeText(fullText)
    
    selectedIndex = normalizedFullText.indexOf(normalizedSelectedText)
log('debug', 'Normalized text search index:', selectedIndex)
    
    if (selectedIndex === -1) {
log('❌ NORMALIZED TEXT ALSO NOT FOUND - TRYING FLEXIBLE SEARCH')
      // If still not found, try a flexible search with first few words
      const words = normalizedSelectedText.split(/\s+/)
      if (words.length > 0) {
        const searchText = words.slice(0, Math.min(3, words.length)).join(' ')
log('debug', 'Trying flexible search with:', JSON.stringify(searchText))
        const flexibleIndex = normalizedFullText.indexOf(searchText)
log('debug', 'Flexible search index:', flexibleIndex)
        if (flexibleIndex !== -1) {
          // Found a partial match, use the original text for context extraction
          const originalIndex = fullText.indexOf(searchText)
log('debug', 'Original text index for partial match:', originalIndex)
          if (originalIndex !== -1) {
log('🚨 USING FALLBACK LOGIC - THIS IS WRONG!')
            return extractContextFromIndex(originalIndex, selectedText.length, fullText, bookTitle, author)
          }
        }
      }
log('❌ ALL FALLBACK ATTEMPTS FAILED')
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

// Character tracking cache for Shakespeare plays
const characterMapCache = new Map<string, Array<{position: number, characters: string[], act?: string, scene?: string}>>()

// Import dynamic character map generator (for logging only)
// import { logCharacterMap } from '../utils/dynamicCharacterMap'

// Efficient character tracking for Shakespeare plays using dynamic character map
const getCharactersOnStageAtPosition = (position: number, fullText: string): string[] => {
  // Check if this is a Shakespeare play
  const isShakespeare = fullText.includes('ACT') && fullText.includes('SCENE') && 
                       (fullText.includes('Enter ') || fullText.includes('_Enter_') || fullText.includes('[Enter'))
  
  if (!isShakespeare) {
    log('debug', 'character-map', `⚠️ Not a Shakespeare play - no character tracking`)
    return []
  }
  
  // Use cached character map or generate new one
  const playKey = fullText.substring(0, 100)
  let characterMap = characterMapCache.get(playKey)
  
  if (!characterMap) {
    log('debug', 'character-map', `🔍 Generating character map for play using 2-scan approach`)
    characterMap = buildCharacterMap(fullText, playKey)
    characterMapCache.set(playKey, characterMap)
    
    // Log the character map to console  
    log('debug', 'character-map', `🎭 Character map generated with ${characterMap.length} entries`)
    characterMap.forEach((entry, index) => {
      log('debug', 'character-map', `  ${index + 1}. Position ${entry.position}: [${entry.characters.join(', ')}]${entry.act ? ` (ACT ${entry.act})` : ''}${entry.scene ? ` (SCENE ${entry.scene})` : ''}`)
    })
  } else {
    log('debug', 'character-map', `🔍 Using cached character map with ${characterMap.length} entries`)
  }
  
  // Find the most recent character state before this position
  let currentCharacters: string[] = []
  
  log('debug', 'character-map', `🔍 Looking up position ${position} in character map with ${characterMap.length} entries`)
  
  // More efficient: work backwards from the end to find the right entry
  for (let i = characterMap.length - 1; i >= 0; i--) {
    const entry = characterMap[i]
    if (entry.position <= position) {
      currentCharacters = entry.characters
      log('debug', 'character-map', `🔍 ✅ Found entry at position ${entry.position}: [${entry.characters.join(', ')}]`)
      break
    }
  }
  
  log('debug', 'character-map', `🔍 Final characters at position ${position}: [${currentCharacters.join(', ')}]`)
  return currentCharacters
}

// Get the full character map entry at a position (including act/scene)
const getCharacterMapEntryAtPosition = (position: number, fullText: string): {position: number, characters: string[], act?: string, scene?: string} | null => {
  // Check if this is a Shakespeare play
  const isShakespeare = fullText.includes('ACT') && fullText.includes('SCENE') && 
                       (fullText.includes('Enter ') || fullText.includes('_Enter_') || fullText.includes('[Enter'))
  
  if (!isShakespeare) {
    return null
  }
  
  // Use cached character map or generate new one
  const playKey = fullText.substring(0, 100)
  let characterMap = characterMapCache.get(playKey)
  
  if (!characterMap) {
    characterMap = buildCharacterMap(fullText, playKey)
    characterMapCache.set(playKey, characterMap)
  }
  
  // Find the most recent character map entry before this position
  let lastEntry = null
  
  // More efficient: work backwards from the end to find the right entry
  for (let i = characterMap.length - 1; i >= 0; i--) {
    const entry = characterMap[i]
    if (entry.position <= position) {
      lastEntry = entry
      break
    }
  }
  
  if (lastEntry) {
log('debug', '🔍 Character map entry at position', position, ':', lastEntry)
log('debug', '🔍 Act/Scene from character map:', lastEntry.act, lastEntry.scene)
  } else {
log('debug', '🔍 No character map entry found before position', position)
  }
  
  return lastEntry
}

// Build character map when text loads (call this from the text reader component)
export const buildCharacterMapForText = (fullText: string) => {
  const playKey = fullText.substring(0, 100)
  
  // Check if this is a Shakespeare play
  const isShakespeare = fullText.includes('ACT') && fullText.includes('SCENE') && 
                       (fullText.includes('Enter ') || fullText.includes('_Enter_') || fullText.includes('[Enter'))
  
  if (isShakespeare && !characterMapCache.has(playKey)) {
    log('debug', 'character-map', `🎭 Building character map for Shakespeare play using 2-scan approach`)
    const characterMap = buildCharacterMap(fullText, playKey)
    characterMapCache.set(playKey, characterMap)
    
    // Log the character map to console when file is loaded
    log('debug', 'character-map', `🎭 Character map built with ${characterMap.length} entries`)
    
    // Print the character map in the user's format
log('CHARACTER MAP (Runtime Generated):')
log('=====================================')
    characterMap.forEach((entry, index) => {
      const actScene = entry.act && entry.scene ? `ACT ${entry.act} SCENE ${entry.scene}` : 
                       entry.act ? `ACT ${entry.act}` : 
                       entry.scene ? `SCENE ${entry.scene}` : 'UNKNOWN'
log('debug', `${entry.position} ${actScene} [${entry.characters.join(', ')}]`)
    })
log('=====================================')
log(`Total entries: ${characterMap.length}`)
  }
}

// Old implementation removed - now using dynamic character map generator

// Build a complete character map for a Shakespeare play using 2-scan approach
const buildCharacterMap = (fullText: string, playKey: string) => {
  interface StructuralEvent {
    offset: number
    type: 'ACT' | 'SCENE' | 'ENTER' | 'EXIT' | 'EXEUNT'
    content: string
    act?: string
    scene?: string
    characters?: string[]
  }
  
  interface SpeakerEvent {
    offset: number
    speaker: string
  }
  
  interface GenericExitEvent {
    offset: number
    type: 'GENERIC_EXIT'
  }
  
  // SCAN 1: Extract structural elements
  const structuralEvents: StructuralEvent[] = []
  const lines = fullText.split('\n')
  let position = 0
  let currentAct = ''
  let currentScene = ''
  
  // Regex patterns from README.txt
  const SPEAKERS = /^[A-Z]{3,}\.\s*$/
  const ACTS = /ACT [IV]+\.?/
  const SCENES = /SCENE [IV]+\.?/
  const ENTERS = /^\s*Enter|\[_Enter[^\]]*_\]/
  const EXITS = /_Exit |\[_Exit[^\]]*_\]/
  const EXEUNTS = /_Exeunt_|\[_Exeunt[^\]]*_\]/
  
  // Debug: Test the specific exeunt text
  const testExeunt = '[_Exeunt Othello, Lodovico and Attendants._]'
log('debug', '🔍 TESTING EXEUNT REGEX:', {
    pattern: EXEUNTS.toString(),
    testText: testExeunt,
    matches: EXEUNTS.test(testExeunt)
  })
  
  // Debug: Test all patterns
  const testEnter = 'Enter Othello, Iago, and Attendants'
  const testExit = '[_Exit Othello._]'
log('debug', '🔍 TESTING ALL PATTERNS:', {
    ENTERS: { pattern: ENTERS.toString(), test: testEnter, matches: ENTERS.test(testEnter) },
    EXITS: { pattern: EXITS.toString(), test: testExit, matches: EXITS.test(testExit) },
    EXEUNTS: { pattern: EXEUNTS.toString(), test: testExeunt, matches: EXEUNTS.test(testExeunt) }
  })
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineOffset = position
    
    // Check for ACT
    if (ACTS.test(line)) {
log('debug', '🔍 ACT LINE DETECTED:', line.trim())
      const actMatch = line.match(/ACT ([IV]+)\.?/)
      if (actMatch) {
        currentAct = actMatch[1]
log('debug', '🔍 Found ACT event:', currentAct, 'at line:', i, 'offset:', lineOffset)
        structuralEvents.push({
          offset: lineOffset,
          type: 'ACT',
          content: line.trim(),
          act: currentAct
        })
      } else {
log('debug', '🔍 ACT line but no match:', line.trim())
      }
    }
    // Check for SCENE
    else if (SCENES.test(line)) {
      const sceneMatch = line.match(/SCENE ([IV]+)\.?/)
      if (sceneMatch) {
        currentScene = sceneMatch[1]
        structuralEvents.push({
          offset: lineOffset,
          type: 'SCENE',
          content: line.trim(),
          act: currentAct,
          scene: currentScene
        })
      }
    }
    // Check for Enter
    else if (ENTERS.test(line)) {
      const enterMatch = line.match(/^\s*Enter\s+(.+)/i)
      if (enterMatch) {
        const characters = parseCharacterList(enterMatch[1])
        structuralEvents.push({
          offset: lineOffset,
          type: 'ENTER',
          content: line.trim(),
          act: currentAct,
          scene: currentScene,
          characters
        })
      }
    }
    // Check for specific Exit
    else if (EXITS.test(line) && !line.includes('[_Exit._]')) {
      const exitMatch = line.match(/\[_Exit\s+([A-Z][A-Z\s&']+)\._?\]/i)
      if (exitMatch) {
        const characters = parseCharacterList(exitMatch[1])
        structuralEvents.push({
          offset: lineOffset,
          type: 'EXIT',
          content: line.trim(),
          act: currentAct,
          scene: currentScene,
          characters
        })
      }
    }
    // Check for Exeunt (all exit)
    else if (EXEUNTS.test(line)) {
log('debug', '🔍 EXEUNT DETECTED:', line.trim(), 'at offset:', lineOffset)
      
      // Parse characters from Exeunt stage direction
      let exeuntCharacters: string[] = []
      
      // Check if specific characters are mentioned in the Exeunt
      if (line.includes('[') && line.includes(']')) {
        // Extract characters from square bracket format: [_Exeunt Othello, Lodovico and Attendants._]
        const match = line.match(/\[_Exeunt\s+([^\]]+)_\]/i)
        if (match) {
          exeuntCharacters = parseCharacterList(match[1])
log('debug', '🔍 EXEUNT CHARACTERS PARSED:', exeuntCharacters)
        }
      } else {
        // Check for other formats like "Exeunt Othello, Lodovico"
        const match = line.match(/Exeunt\s+(.+)/i)
        if (match) {
          exeuntCharacters = parseCharacterList(match[1])
log('debug', '🔍 EXEUNT CHARACTERS PARSED:', exeuntCharacters)
        }
      }
      
      structuralEvents.push({
        offset: lineOffset,
        type: 'EXEUNT',
        content: line.trim(),
        act: currentAct,
        scene: currentScene,
        characters: exeuntCharacters // Specific characters to exit, or empty if all exit
      })
log('debug', '🔍 EXEUNT ADDED TO STRUCTURAL EVENTS, total count:', structuralEvents.length, 'characters:', exeuntCharacters)
    }
    
    position += line.length + 1 // +1 for newline
  }
  
  // SCAN 2: Extract speakers and generic exits
  const speakerEvents: SpeakerEvent[] = []
  const genericExitEvents: GenericExitEvent[] = []
  position = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineOffset = position
    
    // Check for speakers
    if (SPEAKERS.test(line.trim())) {
      const speaker = line.trim().replace('.', '')
      speakerEvents.push({
        offset: lineOffset,
        speaker
      })
    }
    // Check for generic exits
    else if (line.includes('[_Exit._]')) {
      genericExitEvents.push({
        offset: lineOffset,
        type: 'GENERIC_EXIT'
      })
    }
    
    position += line.length + 1
  }
  
  // Resolve generic exits to explicit exits
  const explicitExits: StructuralEvent[] = []
  let lastSpeaker = ''
  let speakerIndex = 0
  let exitIndex = 0
  
  // Process events in chronological order
  while (speakerIndex < speakerEvents.length && exitIndex < genericExitEvents.length) {
    const speaker = speakerEvents[speakerIndex]
    const exit = genericExitEvents[exitIndex]
    
    if (speaker.offset < exit.offset) {
      lastSpeaker = speaker.speaker
      speakerIndex++
    } else {
      // Generic exit found - assign to last speaker
      if (lastSpeaker) {
        explicitExits.push({
          offset: exit.offset,
          type: 'EXIT',
          content: `[_Exit ${lastSpeaker}._]`,
          characters: [lastSpeaker]
        })
      }
      exitIndex++
    }
  }
  
  // Merge structural events with explicit exits and sort by offset
  const allEvents = [...structuralEvents, ...explicitExits].sort((a, b) => a.offset - b.offset)
  
  // Build character map from merged events
  const characterMap: Array<{position: number, characters: string[], act?: string, scene?: string}> = []
  let currentCharacters = new Set<string>()
  let lastCharacterState: string[] = []
  let mapCurrentAct = ''
  let mapCurrentScene = ''
  
  const addEntryIfChanged = (position: number, characters: string[]) => {
    const sortedCharacters = [...characters].sort()
    
    if (JSON.stringify(sortedCharacters) !== JSON.stringify(lastCharacterState)) {
      const entry = {position, characters: sortedCharacters, act: mapCurrentAct, scene: mapCurrentScene}
      characterMap.push(entry)
log('debug', '🔍 Character map: Adding entry:', entry, 'currentAct:', mapCurrentAct, 'currentScene:', mapCurrentScene)
      lastCharacterState = sortedCharacters
    } else {
log('debug', '🔍 Character map: Skipping entry (no change):', {position, characters: sortedCharacters, act: mapCurrentAct, scene: mapCurrentScene})
    }
  }
  
log('debug', '🔍 PROCESSING ALL EVENTS:', allEvents.length, 'events')
  
  for (const event of allEvents) {
log('debug', '🔍 PROCESSING EVENT:', event.type, 'at offset:', event.offset, 'content:', event.content)
    
    switch (event.type) {
      case 'ACT':
        mapCurrentAct = event.act || ''
log('debug', '🔍 Character map: Processing ACT event:', event.act, 'at offset:', event.offset)
        // Just update the current act state - no need for special handling
        break
        
      case 'SCENE':
        mapCurrentScene = event.scene || ''
        // New scene - clear all characters
        currentCharacters.clear()
        addEntryIfChanged(event.offset, [])
        break
        
      case 'ENTER':
        if (event.characters) {
          event.characters.forEach(char => currentCharacters.add(char))
          addEntryIfChanged(event.offset, Array.from(currentCharacters))
        }
        break
        
      case 'EXIT':
        if (event.characters) {
          event.characters.forEach(char => currentCharacters.delete(char))
          addEntryIfChanged(event.offset, Array.from(currentCharacters))
        }
        break
        
      case 'EXEUNT':
        // Handle Exeunt - remove specific characters or all if none specified
log('debug', '🔍 EXEUNT EVENT: Characters to exit:', event.characters, 'current count:', currentCharacters.size, 'before exit:', Array.from(currentCharacters))
        
        if (event.characters && event.characters.length > 0) {
          // Remove only the specified characters
          event.characters.forEach(char => currentCharacters.delete(char))
log('debug', '🔍 EXEUNT EVENT: Removed specific characters, remaining:', Array.from(currentCharacters))
        } else {
          // No specific characters mentioned - all characters exit
          currentCharacters.clear()
log('debug', '🔍 EXEUNT EVENT: No specific characters, cleared all, remaining:', Array.from(currentCharacters))
        }
        
        addEntryIfChanged(event.offset, Array.from(currentCharacters))
log('debug', '🔍 EXEUNT EVENT: After addEntryIfChanged, character map length:', characterMap.length)
        break
    }
  }
  
  log('debug', 'character-map', `🎭 Built character map with ${characterMap.length} entries using 2-scan approach`)
  
  // Debug: Log the final character map
log('debug', '🔍 FINAL CHARACTER MAP:', characterMap)
log('debug', '🔍 STRUCTURAL EVENTS COUNT:', structuralEvents.length)
log('debug', '🔍 SAMPLE STRUCTURAL EVENTS:', structuralEvents.slice(0, 10))
  
  return characterMap
}

// Parse character list from stage directions
const parseCharacterList = (characterText: string): string[] => {
  const characters: string[] = []
  
  // First split by commas and "and"
  const parts = characterText.split(/,\s*|\s+and\s+/)
  
  for (const part of parts) {
    const trimmed = part.trim().toUpperCase().replace(/[\.\]_]+$/g, '')
    
    // Skip stage directions and act/scene markers
    if (isStageDirectionOrMarker(trimmed)) {
      continue
    }
    
    // Handle "with" pattern: "Olivia with Malvolio" -> ["OLIVIA", "MALVOLIO"]
    if (trimmed.toLowerCase().includes(' with ')) {
      const withParts = trimmed.split(/\s+with\s+/i)
      withParts.forEach(p => {
        const cleanName = p.trim()
        if (isValidCharacterName(cleanName)) {
          characters.push(cleanName)
        }
      })
    } else {
      // Regular character name
      if (isValidCharacterName(trimmed)) {
        characters.push(trimmed)
      }
    }
  }
  
  return characters
}

// Check if a string is a stage direction or act/scene marker
const isStageDirectionOrMarker = (text: string): boolean => {
  const lowerText = text.toLowerCase()
  
  // Common stage directions
  const stageDirections = [
    'enter', 'exit', 'exeunt', 'aside', 'within', 'above', 'below',
    'act', 'scene', 'prologue', 'epilogue', 'chorus', 'music',
    'flourish', 'alarm', 'retreat', 'drum', 'trumpet'
  ]
  
  // Check if it starts with common stage directions
  for (const direction of stageDirections) {
    if (lowerText.startsWith(direction)) {
      return true
    }
  }
  
  // Check for act/scene patterns
  if (/^act\s+[ivxlcdm\d]+$/i.test(text)) return true
  if (/^scene\s+[ivxlcdm\d]+$/i.test(text)) return true
  
  return false
}

// Check if a string is a valid character name
const isValidCharacterName = (text: string): boolean => {
  // Must be at least 2 characters
  if (text.length < 2) return false
  
  // Must match character name pattern
  if (!/^[A-Z][A-Z\s&']+$/.test(text)) return false
  
  // Must not be a stage direction or marker
  if (isStageDirectionOrMarker(text)) return false
  
  // Additional character name validation
  // Character names should have at least one space or be single words
  const words = text.split(/\s+/)
  if (words.length === 1 && words[0].length < 3) return false // Single short words are likely not character names
  
  return true
}

const extractContextFromIndex = (selectedIndex: number, selectedLength: number, fullText: string, bookTitle?: string, author?: string) => {
  const beforeText = fullText.substring(Math.max(0, selectedIndex - 1000), selectedIndex)
  const afterText = fullText.substring(selectedIndex + selectedLength, Math.min(fullText.length, selectedIndex + selectedLength + 500))
  const textBeforeSelection = fullText.substring(0, selectedIndex)
  const selectedText = fullText.substring(selectedIndex, selectedIndex + selectedLength)

log('🔍 CONTEXT EXTRACTION DEBUG:')
log('debug', 'Selected index:', selectedIndex)
log('debug', 'Selected length:', selectedLength)
log('debug', 'Selected text:', JSON.stringify(selectedText))
log('debug', 'Text before selection (last 200 chars):', JSON.stringify(textBeforeSelection.slice(-200)))
log('debug', 'Text before selection (last 500 chars):', JSON.stringify(textBeforeSelection.slice(-500)))
  
  // Show the context that should end with the selected text
  const contextEnding = fullText.substring(Math.max(0, selectedIndex - 300), selectedIndex + selectedLength)
log('debug', '🔍 CONTEXT ENDING WITH SELECTED TEXT (last 300 chars + selection):', JSON.stringify(contextEnding))
  
  // Show what comes after the selected text
  const contextAfter = fullText.substring(selectedIndex + selectedLength, selectedIndex + selectedLength + 100)
log('debug', '🔍 CONTEXT AFTER SELECTED TEXT (next 100 chars):', JSON.stringify(contextAfter))

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
  // Look for ACT markers in a much larger context window
  const contextForActScene = fullText.substring(Math.max(0, selectedIndex - 5000), selectedIndex)
  const actMatches = contextForActScene.match(/\bACT\s+([IVXLCDM]+|\d+)\.?\b/gi)
  if (actMatches) {
    const lastActMatch = actMatches[actMatches.length - 1]
    act = lastActMatch.replace(/\bACT\s+/i, '').replace(/\.$/, '').trim()
log('debug', '🔍 Regex-based Act detection found:', act)
  } else {
log('🔍 No Act found by regex detection')
  }

  const sceneMatches = contextForActScene.match(/\bSCENE\s+([IVXLCDM]+|\d+)\.?\b/gi)
  if (sceneMatches) {
    const lastSceneMatch = sceneMatches[sceneMatches.length - 1]
    scene = lastSceneMatch.replace(/\bSCENE\s+/i, '').replace(/\.$/, '').trim()
log('debug', '🔍 Regex-based Scene detection found:', scene)
  } else {
log('🔍 No Scene found by regex detection')
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

  // Bible book and verse detection
  let bibleBook: string | null = null
  let bibleVerse: string | null = null
  
  // Check if this is Bible content by author or book title
  const isBible = author?.toLowerCase().includes('bible') || 
                 bookTitle?.toLowerCase().includes('bible') ||
                 bookTitle?.toLowerCase().includes('king james')
  
  if (isBible) {
log('debug', '🔍 Detected Bible content, looking for book and verse')
    
    // Look for Bible book titles (e.g., "The Book of Joshua", "Genesis", "Matthew")
    const bookTitleMatches = searchText.match(/(?:The\s+)?(?:Book\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/gm)
    if (bookTitleMatches) {
      // Get the most recent book title before the selection
      const beforeLines = textBeforeSelection.split('\n')
      for (let i = beforeLines.length - 1; i >= 0; i--) {
        const line = beforeLines[i].trim()
        if (line.match(/^(?:The\s+)?(?:Book\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/)) {
          bibleBook = line.replace(/^(?:The\s+)?(?:Book\s+of\s+)?/, '').trim()
log('debug', '🔍 Bible book found:', bibleBook)
          break
        }
      }
    }
    
    // Look for verse numbers (e.g., "1:1", "2:15", "10:25")
    const verseMatches = searchText.match(/\b(\d+):(\d+)\b/g)
    if (verseMatches) {
      // Get the most recent verse before the selection
      const beforeText = textBeforeSelection
      const beforeVerseMatches = beforeText.match(/\b(\d+):(\d+)\b/g)
      if (beforeVerseMatches) {
        const lastVerse = beforeVerseMatches[beforeVerseMatches.length - 1]
        bibleVerse = lastVerse
log('debug', '🔍 Bible verse found:', bibleVerse)
      }
    }
  }

  // Simple speaker detection: find the most recent speaker name before the selection
  const beforeLines = textBeforeSelection.split('\n')
  let speakerStartIndex = -1
  
  // Look backwards from the selection point to find the most recent speaker
  for (let i = beforeLines.length - 1; i >= 0; i--) {
    const line = beforeLines[i].trim()
    
    // Check if this line is a speaker name (ALL CAPS followed by period)
    if (/^[A-Z][A-Z\s&'\.]+\.$/.test(line)) {
      speaker = line.replace(/\.$/, '').trim()
      speakerStartIndex = i
      break
    }
  }
  
log('🔍 SPEAKER DETECTION:')
log('debug', 'Speaker found:', speaker)
log('debug', 'Speaker starts at line:', speakerStartIndex)
  
  // Extract the complete speech from this speaker
  let completeSpeech = ''
  if (speaker && speakerStartIndex >= 0) {
    // Get all lines from the speaker until we hit another speaker or end of text
    const allLines = [...beforeLines, ...afterText.split('\n')]
    const speechLines = []
    for (let i = speakerStartIndex + 1; i < allLines.length; i++) {
      const line = allLines[i].trim()
      // Stop if we hit another speaker or empty line followed by speaker
      if (/^[A-Z][A-Z\s&'\.]+\.$/.test(line) || (line === '' && i + 1 < allLines.length && /^[A-Z][A-Z\s&'\.]+\.$/.test(allLines[i + 1]?.trim()))) {
        break
      }
      if (line && !line.startsWith('[') && !line.startsWith('_')) {
        speechLines.push(line)
      }
    }
    completeSpeech = speechLines.join(' ')
  }
  
log('🔍 COMPLETE SPEECH:')
log('debug', 'Complete speech length:', completeSpeech.length)
log('debug', 'Complete speech preview:', completeSpeech.substring(0, 200) + '...')

  // Check if this is a Shakespeare play by looking for ACT/SCENE markers
  const isShakespearePlay = fullText.includes('ACT') && fullText.includes('SCENE') && 
                           (fullText.includes('Enter ') || fullText.includes('_Enter_') || fullText.includes('[Enter'))
  
  if (isShakespearePlay) {
    // For Shakespeare plays, use character map lookup
log('debug', '🔍 Shakespeare play detected - looking up characters at selectedIndex:', selectedIndex)
    charactersOnStage = getCharactersOnStageAtPosition(selectedIndex, fullText)
log('debug', '🔍 Characters on stage from character map:', charactersOnStage)
    
    // Also get act/scene from character map lookup
    const characterMapEntry = getCharacterMapEntryAtPosition(selectedIndex, fullText)
    if (characterMapEntry) {
      // Only override if character map has act/scene info, otherwise keep regex-based detection
      if (characterMapEntry.act) act = characterMapEntry.act
      if (characterMapEntry.scene) scene = characterMapEntry.scene
log('debug', '🔍 Act/Scene from character map:', characterMapEntry.act, characterMapEntry.scene)
log('debug', '🔍 Final Act/Scene after character map:', act, scene)
    }
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
    bibleBook,
    bibleVerse,
    selectedText: fullText.substring(selectedIndex, selectedIndex + selectedLength),
    completeSpeech: completeSpeech || fullText.substring(selectedIndex, selectedIndex + selectedLength),
    beforeContext: beforeText.slice(-200),
    afterContext: afterText.slice(0, 200)
  }
}

export const useBookmarkRestoreAndSave = (
  textReaderRef: React.RefObject<HTMLDivElement | null>,
  text: string,
  bookTitle?: string,
  author?: string,
  disableBookmarkSaving: boolean = false,
  setIsRestoringPosition?: (restoring: boolean) => void,
  setDebugLogs?: (logs: string[] | ((prev: string[]) => string[])) => void,
  allowScrollHandling?: boolean,
  settings?: any,
  onSettingsChange?: (settings: any) => void,
  currentFontSize?: number
) => {
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
log('debug', '🔍 BOOKMARK RESTORE EFFECT TRIGGERED:', { textLength: text?.length, bookTitle, author, disableBookmarkSaving })
    const loadBookmark = async () => {
      if (!text || text.length < 100) {
log('debug', '🔍 Skipping bookmark load - text too short:', text?.length)
        return
      }
      const title = bookTitle || 'Untitled'
      const auth = author || 'Unknown'
log('debug', '🔍 Loading bookmark for:', title, 'by', auth)


      // Wait for content to be fully rendered before attempting restoration
      const restorePosition = (position: number, source: string) => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        const isCapacitor = (window as any).Capacitor && (window as any).Capacitor.isNativePlatform()
        const isMobileOrCapacitor = isMobile || isCapacitor
        log('debug', '🔍 RESTORE POSITION:', { position, source, textReaderRef: textReaderRef.current, isMobile })
        
        // Set restoring state for mobile or Capacitor (simplified)
        if (isMobileOrCapacitor && setIsRestoringPosition) {
          setIsRestoringPosition(true)
        }
        
        // Use a longer delay and wait for scrollHeight to be available
        const attemptRestore = (attempts = 0) => {
          
          
          if (attempts > 20) {
            log('❌ Failed to restore position after 20 attempts')
            // Clear restoring state
            if (isMobile && setIsRestoringPosition) {
              setIsRestoringPosition(false)
            }
            return // Give up after 20 attempts
          }
          
          if (textReaderRef.current && textReaderRef.current.scrollHeight > 0) {
            // Use requestAnimationFrame to avoid forced reflow
            requestAnimationFrame(() => {
              const maxScroll = textReaderRef.current!.scrollHeight - textReaderRef.current!.clientHeight
              const safePosition = Math.min(position, maxScroll)
              log('debug', '✅ Restoring position:', { position, maxScroll, safePosition, isMobile })
              textReaderRef.current!.scrollTop = safePosition
            
            // For mobile, add additional verification after a short delay
            if (isMobile) {
              setTimeout(() => {
                if (textReaderRef.current) {
                  const actualPosition = textReaderRef.current.scrollTop
                  log('debug', '🔍 Mobile position verification:', { expected: safePosition, actual: actualPosition, difference: Math.abs(actualPosition - safePosition) })
                  if (Math.abs(actualPosition - safePosition) > 50) {
                    log('debug', '🔍 Mobile position was reset, restoring again...')
                    textReaderRef.current.scrollTop = safePosition
                    
                    // Try one more time after another delay
                    setTimeout(() => {
                      if (textReaderRef.current) {
                        const finalPosition = textReaderRef.current.scrollTop
                        // Clear restoring state after final attempt
                        if (isMobile && setIsRestoringPosition) {
                          setIsRestoringPosition(false)
                        }
                      }
                    }, 200)
                  } else {
                    // Position was restored successfully
                    if (isMobile && setIsRestoringPosition) {
                      setIsRestoringPosition(false)
                    }
                  }
                }
              }, 100)
            } else {
              // Clear restoring state for non-mobile
              if (setIsRestoringPosition) {
                setIsRestoringPosition(false)
              }
            }
            })
          } else {
            log(`⏳ Attempt ${attempts + 1}: Waiting for content to load...`)
            setTimeout(() => attemptRestore(attempts + 1), 200) // Increased delay between attempts
          }
        }
        
        // Use longer delay for mobile or Capacitor to ensure all handlers are set up
        const initialDelay = isMobileOrCapacitor ? 3000 : 500
        setTimeout(() => attemptRestore(), initialDelay)
      }

      // Always try to load bookmark using device ID (no authentication required)
      const deviceId = getDeviceId()
      // Debug logging disabled - uncomment for troubleshooting
      // console.log('🔍 BOOKMARK RESTORE: Loading bookmark with device ID:', deviceId)
      // console.log('🔍 BOOKMARK RESTORE: Book title:', title)
      // console.log('🔍 BOOKMARK RESTORE: Book author:', auth)
      // console.log('🔍 BOOKMARK RESTORE: API URL:', `${API_BASE_URL}/api/user/bookmark?bookTitle=${encodeURIComponent(title)}&bookAuthor=${encodeURIComponent(auth)}&userId=${encodeURIComponent(deviceId)}`)
      log('debug', '🔍 BOOKMARK: Loading bookmark with device ID:', deviceId)
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/bookmark?bookTitle=${encodeURIComponent(title)}&bookAuthor=${encodeURIComponent(auth)}&userId=${encodeURIComponent(deviceId)}`)
        log('debug', 'bookmark', 'Bookmark API response status:', response.status)
        
        if (response.ok) {
          const bookmark = await response.json()
          // console.log('🔍 BOOKMARK RESTORE: Bookmark found in database:', bookmark)
          // console.log('🔍 BOOKMARK RESTORE: Bookmark scroll position:', bookmark.scroll_position)
          log('debug', 'bookmark', 'Bookmark found in database:', bookmark)
          const position = bookmark.scroll_position
          const fontSize = bookmark.font_size
          // console.log('🔍 BOOKMARK RESTORE: About to restore position:', position)
          log('debug', '🔍 Bookmark loaded from database:', { position, fontSize, bookmark })
          restorePosition(position, 'database')
          
          // Restore font size if available
          log('debug', '🔍 Font size restoration check:', { fontSize, hasSettings: !!settings, hasOnSettingsChange: !!onSettingsChange })
          if (fontSize && settings && onSettingsChange) {
            log('debug', '🔍 Restoring font size from', settings.textFontSize, 'to', fontSize)
            onSettingsChange({
              ...settings,
              textFontSize: fontSize
            })
            log('debug', '🔍 Font size restored successfully:', fontSize)
          } else {
            log('debug', '🔍 Font size NOT restored:', { fontSize, hasSettings: !!settings, hasOnSettingsChange: !!onSettingsChange })
          }
          return
        } else {
          const errorText = await response.text()
          // console.log('🔍 BOOKMARK RESTORE: No bookmark found in database (404) - Response:', errorText)
          log('debug', 'bookmark', 'No bookmark found in database (404)')
        }
      } catch (error) {
        console.error('🔍 BOOKMARK RESTORE: Error loading bookmark from database:', error)
        log('debug', 'bookmark', 'Error loading bookmark from database:', error)
      }

      // No saved bookmark found in database - scroll past Project Gutenberg header for new books
      log('debug', 'bookmark', 'No bookmark found in database, checking for Project Gutenberg header')
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
              log('debug', 'bookmark', 'Found Project Gutenberg marker:', marker, 'at position:', startIndex)
              break
            }
          }
          
          if (startIndex !== -1 && textReaderRef.current.scrollHeight > 0) {
            // Calculate scroll position to the marker
            const textPercentage = startIndex / text.length
            // Use requestAnimationFrame to avoid forced reflow
            requestAnimationFrame(() => {
              const targetPosition = textPercentage * textReaderRef.current!.scrollHeight
              log('debug', 'bookmark', 'Scrolling to marker position:', targetPosition, 'textPercentage:', textPercentage)
              textReaderRef.current!.scrollTop = Math.max(0, targetPosition)
            })
          } else {
            log('debug', 'bookmark', 'No Project Gutenberg marker found in text or content not ready')
          }
        }
      }, 300) // Longer delay for Project Gutenberg header scrolling
    }

    loadBookmark()
  }, [text, bookTitle, author])

  useEffect(() => {
    log('debug', 'bookmark', 'Setting up scroll effect, textReaderRef:', textReaderRef.current)
    
    const handleScroll = () => {
      console.log('🔍 SCROLL HANDLER CALLED!')
      log('debug', 'SCROLL HANDLER CALLED - disableBookmarkSaving:', disableBookmarkSaving)
      console.log('🔍 SCROLL HANDLER CALLED - disableBookmarkSaving:', disableBookmarkSaving)
      // Skip bookmark saving if disabled (e.g., during chat operations)
      if (disableBookmarkSaving) {
        log('debug', 'SCROLL HANDLER - Skipping due to disableBookmarkSaving')
        return
      }
      
      // Store scroll position immediately to avoid forced reflow
      let scrollPosition = 0
      if (textReaderRef.current) {
        scrollPosition = textReaderRef.current.scrollTop
      } else {
        return
      }
      
      // Debounce scroll events to reduce performance impact
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(() => {
        // Use requestAnimationFrame to avoid forced reflow
        requestAnimationFrame(() => {
          // Store values for async bookmark saving
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
          const title = bookTitle || 'Untitled'
          const auth = author || 'Unknown'
          const userId = getDeviceId()
          
          // Move async bookmark saving outside of requestAnimationFrame
          if (userId) {
            // Use setTimeout to defer the async operation
            setTimeout(async () => {
              try {
            
            // Use settings.textFontSize as the primary source since currentFontSize might be undefined
            const finalFontSize = settings?.textFontSize ?? 18
            console.log('🔍 DESKTOP: SAVING BOOKMARK: Font size =', finalFontSize)
            console.log('🔍 DESKTOP: Testing log function')
            log('desktop', 'SAVING BOOKMARK: Font size =', finalFontSize)
            console.log('🔍 DESKTOP: After log function call')
            log('debug', 'BOOKMARK SAVE: Using settings font size', {
              settingsFontSize: settings?.textFontSize,
              finalFontSize
            })
            
            const requestBody = {
              bookTitle: title,
              bookAuthor: auth,
              scrollPosition: Math.round(scrollPosition),
              fontSize: finalFontSize,
              userId: userId
            }
            alert(`API REQUEST: ${JSON.stringify(requestBody)}`)
            log('debug', 'SAVING BOOKMARK - Full debug info:', {
              requestBody,
              currentFontSize,
              settingsFontSize: settings?.textFontSize,
              hasCurrentFontSize: currentFontSize !== undefined,
              finalFontSize: currentFontSize ?? settings?.textFontSize ?? 18
            })
            console.log('🔍 SAVING BOOKMARK - Full debug info:', {
              requestBody,
              currentFontSize,
              settingsFontSize: settings?.textFontSize,
              hasCurrentFontSize: currentFontSize !== undefined,
              finalFontSize: currentFontSize ?? settings?.textFontSize ?? 18
            })
            log('debug', '🔍 Saving bookmark with font size:', { 
              fontSize: requestBody.fontSize, 
              currentFontSize, 
              settingsFontSize: settings?.textFontSize,
              hasCurrentFontSize: currentFontSize !== undefined
            })
            
            const apiCallInfo = {
              url: `${API_BASE_URL}/api/user/bookmark`,
              method: 'POST',
              body: requestBody,
              timestamp: new Date().toISOString()
            }
            
            
            // Add to debug logs if available
            if (typeof setDebugLogs === 'function') {
              setDebugLogs(prev => [...prev, `📤 API Call: ${apiCallInfo.method} ${apiCallInfo.url}`])
              setDebugLogs(prev => [...prev, `📤 Body: ${JSON.stringify(apiCallInfo.body, null, 2)}`])
            }
            
            const response = await fetch(`${API_BASE_URL}/api/user/bookmark`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            })
            
            console.log('🔍 API RESPONSE STATUS:', response.status)
            const responseText = await response.text()
            console.log('🔍 API RESPONSE BODY:', responseText)
            
            const responseInfo = {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
              timestamp: new Date().toISOString()
            }
            
            
            // Add response to debug logs
            if (typeof setDebugLogs === 'function') {
              setDebugLogs(prev => [...prev, `📥 Response: ${responseInfo.status} ${responseInfo.statusText} (${responseInfo.ok ? 'OK' : 'ERROR'})`])
            }
            
            if (response.ok) {
              const result = await response.json()
              log('debug', 'bookmark', `Bookmark saved successfully: ${title} by ${auth} at position ${scrollPosition}`)
              
              // Add success to debug logs
              if (typeof setDebugLogs === 'function') {
                setDebugLogs(prev => [...prev, `✅ Success: ${JSON.stringify(result, null, 2)}`])
              }
            } else {
              const errorText = await response.text()
              console.error('❌ BOOKMARK: Failed to save:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
              })
              log('debug', 'bookmark', `Failed to save bookmark: ${response.status} ${response.statusText}`)
              
              // Add error to debug logs
              if (typeof setDebugLogs === 'function') {
                setDebugLogs(prev => [...prev, `❌ Error: ${response.status} ${response.statusText} - ${errorText}`])
              }
            }
          } catch (error) {
            log('debug', 'bookmark', 'Error saving bookmark to database:', error)
            log('debug', '❌ Error saving bookmark:', error)
          }
            }, 0) // Use 0ms timeout to defer async operation
          } else {
            log('debug', 'bookmark', 'No session and not in dev mode, skipping bookmark save')
            log('debug', '❌ No session, skipping bookmark save')
          }
        })
      }, 500)
    }

    // Try both window scroll and element scroll
    log('debug', 'bookmark', 'Setting up scroll handlers for both window and element')
    
    const setupScrollHandlers = () => {
      
      // Window scroll (most likely)
      window.addEventListener('scroll', handleScroll, { passive: true })
      log('debug', 'bookmark', 'Window scroll handler attached')
      
      // Element scroll (if element is scrollable)
    const el = textReaderRef.current
      if (el) {
        el.addEventListener('scroll', handleScroll, { passive: true })
        log('debug', 'bookmark', 'Element scroll handler attached')
      } else {
        log('debug', 'bookmark', 'No textReaderRef element found for scroll handler')
      }
    }
    
    setTimeout(setupScrollHandlers, 100)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      const el = textReaderRef.current
      if (el) {
      el.removeEventListener('scroll', handleScroll)
      }
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [bookTitle, author, text, textReaderRef])
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
          
          // Save bookmark after scrolling to search result
          setTimeout(async () => {
            if (textReaderRef.current) {
              const scrollPosition = textReaderRef.current.scrollTop
log('debug', '🔍 Saving bookmark after search navigation to position:', scrollPosition)
              
              // Trigger the scroll event to save bookmark
              const scrollEvent = new Event('scroll')
              window.dispatchEvent(scrollEvent)
            }
          }, 500)
          return
        }
      }
      
      // Only do scroll-based navigation if we're not in page mode
      if (!onNavigateToPage || !pageMap || pageMap.pages.length === 0) {
        const scrollContainer = textReaderRef.current
        if (scrollContainer) {
          const textPercentage = result.index / text.length
          // Use requestAnimationFrame to avoid forced reflow
          requestAnimationFrame(() => {
            const targetPosition = textPercentage * scrollContainer.scrollHeight * 0.8
            scrollContainer.scrollTop = Math.max(0, targetPosition - 200)
            
            // Save bookmark after scrolling to search result
            setTimeout(() => {
log('🔍 Saving bookmark after search navigation (scroll mode)')
              // Trigger the scroll event to save bookmark
              const scrollEvent = new Event('scroll')
              window.dispatchEvent(scrollEvent)
            }, 500)
          })
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


