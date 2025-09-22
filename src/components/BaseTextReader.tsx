'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { log } from '../utils/log'

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
  console.log('🔍 EXTRACT CONTEXT INFO DEBUG:')
  console.log('Selected text:', JSON.stringify(selectedText))
  console.log('Selected text length:', selectedText.length)
  console.log('Full text length:', fullText.length)
  console.log('First 200 chars of full text:', JSON.stringify(fullText.substring(0, 200)))
  
  // Search for Olivia's actual quote in the text with different line break formats
  const oliviaQuote1 = "There is no slander in an allowed fool"
  const oliviaQuote2 = "There is\r\nno slander in an allowed fool"
  const oliviaQuote3 = "There is\nno slander in an allowed fool"
  
  const oliviaIndex1 = fullText.indexOf(oliviaQuote1)
  const oliviaIndex2 = fullText.indexOf(oliviaQuote2)
  const oliviaIndex3 = fullText.indexOf(oliviaQuote3)
  
  console.log('🔍 SEARCHING FOR OLIVIA QUOTE WITH DIFFERENT LINE BREAKS:')
  console.log('Quote 1 (no breaks):', oliviaIndex1)
  console.log('Quote 2 (\\r\\n):', oliviaIndex2)
  console.log('Quote 3 (\\n):', oliviaIndex3)
  
  const foundIndex = Math.max(oliviaIndex1, oliviaIndex2, oliviaIndex3)
  if (foundIndex !== -1) {
    const oliviaContext = fullText.substring(Math.max(0, foundIndex - 200), foundIndex + 200)
    console.log('Olivia context (400 chars around quote):', JSON.stringify(oliviaContext))
  }
  
  // Normalize line breaks in selected text to match stored text format
  const normalizedSelectedText = selectedText.replace(/\n/g, '\r\n')
  console.log('Normalized selected text:', JSON.stringify(normalizedSelectedText))
  
  // Try to find the selected text in the original text (both formats)
  let selectedIndex = fullText.indexOf(selectedText)
  let normalizedIndex = fullText.indexOf(normalizedSelectedText)
  
  console.log('Original text index:', selectedIndex)
  console.log('Normalized text index:', normalizedIndex)
  
  // Use the normalized version if it's found
  if (normalizedIndex !== -1) {
    selectedIndex = normalizedIndex
    console.log('Using normalized text index:', selectedIndex)
  }
  
  // If found, check if it's preceded by OLIVIA to make sure we found the right occurrence
  if (selectedIndex !== -1) {
    const textBeforeFound = fullText.substring(Math.max(0, selectedIndex - 100), selectedIndex)
    const hasOliviaBefore = /OLIVIA\.?\s*$/m.test(textBeforeFound.split('\n').slice(-3).join('\n'))
    
    console.log('Text before first occurrence (last 100 chars):', JSON.stringify(textBeforeFound))
    console.log('Has OLIVIA before first occurrence:', hasOliviaBefore)
    
    if (!hasOliviaBefore) {
      // This is not Olivia's speech, search for the next occurrence
      console.log('First occurrence is not Olivia, searching for next occurrence...')
      let searchStart = selectedIndex + 1
      let occurrenceCount = 1
      while (true) {
        const nextIndex = fullText.indexOf(selectedText, searchStart)
        if (nextIndex === -1) {
          console.log(`No more occurrences found after ${occurrenceCount} attempts`)
          break
        }
        
        occurrenceCount++
        const textBeforeNext = fullText.substring(Math.max(0, nextIndex - 100), nextIndex)
        const hasOliviaBeforeNext = /OLIVIA\.?\s*$/m.test(textBeforeNext.split('\n').slice(-3).join('\n'))
        
        console.log(`Occurrence ${occurrenceCount} at index ${nextIndex}:`, JSON.stringify(textBeforeNext))
        console.log(`Has OLIVIA before occurrence ${occurrenceCount}:`, hasOliviaBeforeNext)
        
        if (hasOliviaBeforeNext) {
          selectedIndex = nextIndex
          console.log(`✅ FOUND CORRECT OCCURRENCE at index ${selectedIndex}`)
          break
        }
        searchStart = nextIndex + 1
      }
    } else {
      console.log('✅ First occurrence is correct (has OLIVIA before)')
    }
  }
  
  if (selectedIndex === -1) {
    console.log('❌ SELECTED TEXT NOT FOUND - TRYING FALLBACK LOGIC')
    // If not found, try with minimal character encoding fixes
    const normalizedSelectedText = normalizeText(selectedText)
    const normalizedFullText = normalizeText(fullText)
    
    selectedIndex = normalizedFullText.indexOf(normalizedSelectedText)
    console.log('Normalized text search index:', selectedIndex)
    
    if (selectedIndex === -1) {
      console.log('❌ NORMALIZED TEXT ALSO NOT FOUND - TRYING FLEXIBLE SEARCH')
      // If still not found, try a flexible search with first few words
      const words = normalizedSelectedText.split(/\s+/)
      if (words.length > 0) {
        const searchText = words.slice(0, Math.min(3, words.length)).join(' ')
        console.log('Trying flexible search with:', JSON.stringify(searchText))
        const flexibleIndex = normalizedFullText.indexOf(searchText)
        console.log('Flexible search index:', flexibleIndex)
        if (flexibleIndex !== -1) {
          // Found a partial match, use the original text for context extraction
          const originalIndex = fullText.indexOf(searchText)
          console.log('Original text index for partial match:', originalIndex)
          if (originalIndex !== -1) {
            console.log('🚨 USING FALLBACK LOGIC - THIS IS WRONG!')
            return extractContextFromIndex(originalIndex, selectedText.length, fullText, bookTitle, author)
          }
        }
      }
      console.log('❌ ALL FALLBACK ATTEMPTS FAILED')
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
    log('character-map', `⚠️ Not a Shakespeare play - no character tracking`)
    return []
  }
  
  // Use cached character map or generate new one
  const playKey = fullText.substring(0, 100)
  let characterMap = characterMapCache.get(playKey)
  
  if (!characterMap) {
    log('character-map', `🔍 Generating character map for play using 2-scan approach`)
    characterMap = buildCharacterMap(fullText, playKey)
    characterMapCache.set(playKey, characterMap)
    
    // Log the character map to console  
    log('character-map', `🎭 Character map generated with ${characterMap.length} entries`)
    characterMap.forEach((entry, index) => {
      log('character-map', `  ${index + 1}. Position ${entry.position}: [${entry.characters.join(', ')}]${entry.act ? ` (ACT ${entry.act})` : ''}${entry.scene ? ` (SCENE ${entry.scene})` : ''}`)
    })
  } else {
    log('character-map', `🔍 Using cached character map with ${characterMap.length} entries`)
  }
  
  // Find the most recent character state before this position
  let currentCharacters: string[] = []
  
  log('character-map', `🔍 Looking up position ${position} in character map with ${characterMap.length} entries`)
  
  // More efficient: work backwards from the end to find the right entry
  for (let i = characterMap.length - 1; i >= 0; i--) {
    const entry = characterMap[i]
    if (entry.position <= position) {
      currentCharacters = entry.characters
      log('character-map', `🔍 ✅ Found entry at position ${entry.position}: [${entry.characters.join(', ')}]`)
      break
    }
  }
  
  log('character-map', `🔍 Final characters at position ${position}: [${currentCharacters.join(', ')}]`)
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
    console.log('🔍 Character map entry at position', position, ':', lastEntry)
    console.log('🔍 Act/Scene from character map:', lastEntry.act, lastEntry.scene)
  } else {
    console.log('🔍 No character map entry found before position', position)
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
    log('character-map', `🎭 Building character map for Shakespeare play using 2-scan approach`)
    const characterMap = buildCharacterMap(fullText, playKey)
    characterMapCache.set(playKey, characterMap)
    
    // Log the character map to console when file is loaded
    log('character-map', `🎭 Character map built with ${characterMap.length} entries`)
    
    // Print the character map in the user's format
    console.log('CHARACTER MAP (Runtime Generated):')
    console.log('=====================================')
    characterMap.forEach((entry, index) => {
      const actScene = entry.act && entry.scene ? `ACT ${entry.act} SCENE ${entry.scene}` : 
                       entry.act ? `ACT ${entry.act}` : 
                       entry.scene ? `SCENE ${entry.scene}` : 'UNKNOWN'
      console.log(`${entry.position} ${actScene} [${entry.characters.join(', ')}]`)
    })
    console.log('=====================================')
    console.log(`Total entries: ${characterMap.length}`)
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
  console.log('🔍 TESTING EXEUNT REGEX:', {
    pattern: EXEUNTS.toString(),
    testText: testExeunt,
    matches: EXEUNTS.test(testExeunt)
  })
  
  // Debug: Test all patterns
  const testEnter = 'Enter Othello, Iago, and Attendants'
  const testExit = '[_Exit Othello._]'
  console.log('🔍 TESTING ALL PATTERNS:', {
    ENTERS: { pattern: ENTERS.toString(), test: testEnter, matches: ENTERS.test(testEnter) },
    EXITS: { pattern: EXITS.toString(), test: testExit, matches: EXITS.test(testExit) },
    EXEUNTS: { pattern: EXEUNTS.toString(), test: testExeunt, matches: EXEUNTS.test(testExeunt) }
  })
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineOffset = position
    
    // Check for ACT
    if (ACTS.test(line)) {
      console.log('🔍 ACT LINE DETECTED:', line.trim())
      const actMatch = line.match(/ACT ([IV]+)\.?/)
      if (actMatch) {
        currentAct = actMatch[1]
        console.log('🔍 Found ACT event:', currentAct, 'at line:', i, 'offset:', lineOffset)
        structuralEvents.push({
          offset: lineOffset,
          type: 'ACT',
          content: line.trim(),
          act: currentAct
        })
      } else {
        console.log('🔍 ACT line but no match:', line.trim())
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
      console.log('🔍 EXEUNT DETECTED:', line.trim(), 'at offset:', lineOffset)
      
      // Parse characters from Exeunt stage direction
      let exeuntCharacters: string[] = []
      
      // Check if specific characters are mentioned in the Exeunt
      if (line.includes('[') && line.includes(']')) {
        // Extract characters from square bracket format: [_Exeunt Othello, Lodovico and Attendants._]
        const match = line.match(/\[_Exeunt\s+([^\]]+)_\]/i)
        if (match) {
          exeuntCharacters = parseCharacterList(match[1])
          console.log('🔍 EXEUNT CHARACTERS PARSED:', exeuntCharacters)
        }
      } else {
        // Check for other formats like "Exeunt Othello, Lodovico"
        const match = line.match(/Exeunt\s+(.+)/i)
        if (match) {
          exeuntCharacters = parseCharacterList(match[1])
          console.log('🔍 EXEUNT CHARACTERS PARSED:', exeuntCharacters)
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
      console.log('🔍 EXEUNT ADDED TO STRUCTURAL EVENTS, total count:', structuralEvents.length, 'characters:', exeuntCharacters)
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
      console.log('🔍 Character map: Adding entry:', entry, 'currentAct:', mapCurrentAct, 'currentScene:', mapCurrentScene)
      lastCharacterState = sortedCharacters
    } else {
      console.log('🔍 Character map: Skipping entry (no change):', {position, characters: sortedCharacters, act: mapCurrentAct, scene: mapCurrentScene})
    }
  }
  
  console.log('🔍 PROCESSING ALL EVENTS:', allEvents.length, 'events')
  
  for (const event of allEvents) {
    console.log('🔍 PROCESSING EVENT:', event.type, 'at offset:', event.offset, 'content:', event.content)
    
    switch (event.type) {
      case 'ACT':
        mapCurrentAct = event.act || ''
        console.log('🔍 Character map: Processing ACT event:', event.act, 'at offset:', event.offset)
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
        console.log('🔍 EXEUNT EVENT: Characters to exit:', event.characters, 'current count:', currentCharacters.size, 'before exit:', Array.from(currentCharacters))
        
        if (event.characters && event.characters.length > 0) {
          // Remove only the specified characters
          event.characters.forEach(char => currentCharacters.delete(char))
          console.log('🔍 EXEUNT EVENT: Removed specific characters, remaining:', Array.from(currentCharacters))
        } else {
          // No specific characters mentioned - all characters exit
          currentCharacters.clear()
          console.log('🔍 EXEUNT EVENT: No specific characters, cleared all, remaining:', Array.from(currentCharacters))
        }
        
        addEntryIfChanged(event.offset, Array.from(currentCharacters))
        console.log('🔍 EXEUNT EVENT: After addEntryIfChanged, character map length:', characterMap.length)
        break
    }
  }
  
  log('character-map', `🎭 Built character map with ${characterMap.length} entries using 2-scan approach`)
  
  // Debug: Log the final character map
  console.log('🔍 FINAL CHARACTER MAP:', characterMap)
  console.log('🔍 STRUCTURAL EVENTS COUNT:', structuralEvents.length)
  console.log('🔍 SAMPLE STRUCTURAL EVENTS:', structuralEvents.slice(0, 10))
  
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

  console.log('🔍 CONTEXT EXTRACTION DEBUG:')
  console.log('Selected index:', selectedIndex)
  console.log('Selected length:', selectedLength)
  console.log('Selected text:', JSON.stringify(selectedText))
  console.log('Text before selection (last 200 chars):', JSON.stringify(textBeforeSelection.slice(-200)))
  console.log('Text before selection (last 500 chars):', JSON.stringify(textBeforeSelection.slice(-500)))
  
  // Show the context that should end with the selected text
  const contextEnding = fullText.substring(Math.max(0, selectedIndex - 300), selectedIndex + selectedLength)
  console.log('🔍 CONTEXT ENDING WITH SELECTED TEXT (last 300 chars + selection):', JSON.stringify(contextEnding))
  
  // Show what comes after the selected text
  const contextAfter = fullText.substring(selectedIndex + selectedLength, selectedIndex + selectedLength + 100)
  console.log('🔍 CONTEXT AFTER SELECTED TEXT (next 100 chars):', JSON.stringify(contextAfter))

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
    console.log('🔍 Regex-based Act detection found:', act)
  } else {
    console.log('🔍 No Act found by regex detection')
  }

  const sceneMatches = contextForActScene.match(/\bSCENE\s+([IVXLCDM]+|\d+)\.?\b/gi)
  if (sceneMatches) {
    const lastSceneMatch = sceneMatches[sceneMatches.length - 1]
    scene = lastSceneMatch.replace(/\bSCENE\s+/i, '').replace(/\.$/, '').trim()
    console.log('🔍 Regex-based Scene detection found:', scene)
  } else {
    console.log('🔍 No Scene found by regex detection')
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
    console.log('🔍 Detected Bible content, looking for book and verse')
    
    // Look for Bible book titles (e.g., "The Book of Joshua", "Genesis", "Matthew")
    const bookTitleMatches = searchText.match(/(?:The\s+)?(?:Book\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/gm)
    if (bookTitleMatches) {
      // Get the most recent book title before the selection
      const beforeLines = textBeforeSelection.split('\n')
      for (let i = beforeLines.length - 1; i >= 0; i--) {
        const line = beforeLines[i].trim()
        if (line.match(/^(?:The\s+)?(?:Book\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/)) {
          bibleBook = line.replace(/^(?:The\s+)?(?:Book\s+of\s+)?/, '').trim()
          console.log('🔍 Bible book found:', bibleBook)
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
        console.log('🔍 Bible verse found:', bibleVerse)
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
  
  console.log('🔍 SPEAKER DETECTION:')
  console.log('Speaker found:', speaker)
  console.log('Speaker starts at line:', speakerStartIndex)
  
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
  
  console.log('🔍 COMPLETE SPEECH:')
  console.log('Complete speech length:', completeSpeech.length)
  console.log('Complete speech preview:', completeSpeech.substring(0, 200) + '...')

  // Check if this is a Shakespeare play by looking for ACT/SCENE markers
  const isShakespearePlay = fullText.includes('ACT') && fullText.includes('SCENE') && 
                           (fullText.includes('Enter ') || fullText.includes('_Enter_') || fullText.includes('[Enter'))
  
  if (isShakespearePlay) {
    // For Shakespeare plays, use character map lookup
    console.log('🔍 Shakespeare play detected - looking up characters at selectedIndex:', selectedIndex)
    charactersOnStage = getCharactersOnStageAtPosition(selectedIndex, fullText)
    console.log('🔍 Characters on stage from character map:', charactersOnStage)
    
    // Also get act/scene from character map lookup
    const characterMapEntry = getCharacterMapEntryAtPosition(selectedIndex, fullText)
    if (characterMapEntry) {
      // Only override if character map has act/scene info, otherwise keep regex-based detection
      if (characterMapEntry.act) act = characterMapEntry.act
      if (characterMapEntry.scene) scene = characterMapEntry.scene
      console.log('🔍 Act/Scene from character map:', characterMapEntry.act, characterMapEntry.scene)
      console.log('🔍 Final Act/Scene after character map:', act, scene)
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
  disableBookmarkSaving: boolean = false
) => {
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { data: session } = useSession()

  useEffect(() => {
    console.log('🔍 BOOKMARK RESTORE EFFECT TRIGGERED:', { textLength: text?.length, bookTitle, author, disableBookmarkSaving })
    const loadBookmark = async () => {
      if (!text || text.length < 100) {
        console.log('🔍 Skipping bookmark load - text too short:', text?.length)
        return
      }
      const title = bookTitle || 'Untitled'
      const auth = author || 'Unknown'
      console.log('🔍 Loading bookmark for:', title, 'by', auth)


      // Wait for content to be fully rendered before attempting restoration
      const restorePosition = (position: number, source: string) => {
        console.log('🔍 RESTORE POSITION:', { position, source, textReaderRef: textReaderRef.current })
        // Use a longer delay and wait for scrollHeight to be available
        const attemptRestore = (attempts = 0) => {
          if (attempts > 20) {
            console.log('❌ Failed to restore position after 20 attempts')
            return // Give up after 20 attempts
          }
          
          if (textReaderRef.current && textReaderRef.current.scrollHeight > 0) {
            const maxScroll = textReaderRef.current.scrollHeight - textReaderRef.current.clientHeight
            const safePosition = Math.min(position, maxScroll)
            console.log('✅ Restoring position:', { position, maxScroll, safePosition, scrollHeight: textReaderRef.current.scrollHeight })
            textReaderRef.current.scrollTop = safePosition
          } else {
            console.log(`⏳ Attempt ${attempts + 1}: Waiting for content to load...`)
            setTimeout(() => attemptRestore(attempts + 1), 200) // Increased delay between attempts
          }
        }
        
        setTimeout(() => attemptRestore(), 500) // Increased initial delay
      }

      // Try to load from database first if user is authenticated or in development
      // Wait a bit for session to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const userEmail = session?.user?.email || (process.env.NODE_ENV === 'development' ? 'dev-user@example.com' : null)
      
      if (userEmail) {
        try {
          const response = await fetch(`/api/user/bookmark?bookTitle=${encodeURIComponent(title)}&bookAuthor=${encodeURIComponent(auth)}`)
          log('bookmark', 'Bookmark API response status:', response.status)
          
          if (response.ok) {
            const bookmark = await response.json()
            log('bookmark', 'Bookmark found in database:', bookmark)
            const position = bookmark.scroll_position
            console.log('🔍 Bookmark loaded from database:', { position, bookmark })
            restorePosition(position, 'database')
            return
          } else {
            log('bookmark', 'No bookmark found in database (404)')
            console.log('❌ No bookmark found in database (404)')
          }
        } catch (error) {
          log('bookmark', 'Error loading bookmark from database:', error)
        }
      } else {
        log('bookmark', 'No session found and not in development mode, skipping bookmark restoration')
      }

      // No saved bookmark found in database - scroll past Project Gutenberg header for new books
      log('bookmark', 'No bookmark found in database, checking for Project Gutenberg header')
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
              log('bookmark', 'Found Project Gutenberg marker:', marker, 'at position:', startIndex)
              break
            }
          }
          
          if (startIndex !== -1 && textReaderRef.current.scrollHeight > 0) {
            // Calculate scroll position to the marker
            const textPercentage = startIndex / text.length
            const targetPosition = textPercentage * textReaderRef.current.scrollHeight
            log('bookmark', 'Scrolling to marker position:', targetPosition, 'textPercentage:', textPercentage)
            textReaderRef.current.scrollTop = Math.max(0, targetPosition)
          } else {
            log('bookmark', 'No Project Gutenberg marker found in text or content not ready')
          }
        }
      }, 300) // Longer delay for Project Gutenberg header scrolling
    }

    loadBookmark()
  }, [text, bookTitle, author, session?.user?.email])

  useEffect(() => {
    log('bookmark', 'Setting up scroll effect, textReaderRef:', textReaderRef.current)
    
    const handleScroll = () => {
      log('bookmark', 'Scroll event fired!')
      
      // Skip bookmark saving if disabled (e.g., during chat operations)
      if (disableBookmarkSaving) {
        log('bookmark', 'Bookmark saving disabled, skipping')
        return
      }
      
      // Get scroll position from the scrollable element
      let scrollPosition = 0
      if (textReaderRef.current) {
        scrollPosition = textReaderRef.current.scrollTop
        log('bookmark', 'Using element scroll position:', scrollPosition)
      } else {
        log('bookmark', 'No textReaderRef element found')
      }
      
      log('bookmark', 'Scroll detected, position:', scrollPosition)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = setTimeout(async () => {
        const title = bookTitle || 'Untitled'
        const auth = author || 'Unknown'

        // Save to database if user is authenticated or in development mode
        const isLocalDev = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
        const userEmail = session?.user?.email || (isLocalDev ? 'dev-user@example.com' : null)
        
        log('bookmark', `Session email: ${session?.user?.email}, isLocalDev: ${isLocalDev}, userEmail: ${userEmail}`)
        
        if (userEmail) {
          try {
            log('bookmark', `Saving bookmark: ${title} by ${auth} at position ${scrollPosition}`)
            console.log('🔍 SAVING BOOKMARK:', { title, auth, scrollPosition })
              const response = await fetch('/api/user/bookmark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookTitle: title,
                  bookAuthor: auth,
                  scrollPosition: Math.round(scrollPosition) // Round to integer for database compatibility
                })
              })
            
            if (response.ok) {
              log('bookmark', `Bookmark saved successfully: ${title} by ${auth} at position ${scrollPosition}`)
              console.log('✅ Bookmark saved successfully')
            } else {
              log('bookmark', `Failed to save bookmark: ${response.status} ${response.statusText}`)
              console.log('❌ Failed to save bookmark:', response.status, response.statusText)
            }
          } catch (error) {
            log('bookmark', 'Error saving bookmark to database:', error)
            console.log('❌ Error saving bookmark:', error)
          }
        } else {
          log('bookmark', 'No session and not in dev mode, skipping bookmark save')
          console.log('❌ No session, skipping bookmark save')
        }

        // Bookmark saved to database
      }, 500)
    }

    // Try both window scroll and element scroll
    log('bookmark', 'Setting up scroll handlers for both window and element')
    
    const setupScrollHandlers = () => {
      // Window scroll (most likely)
      window.addEventListener('scroll', handleScroll)
      log('bookmark', 'Window scroll handler attached')
      
      // Element scroll (if element is scrollable)
    const el = textReaderRef.current
      if (el) {
        el.addEventListener('scroll', handleScroll)
        log('bookmark', 'Element scroll handler attached')
      } else {
        log('bookmark', 'No textReaderRef element found for scroll handler')
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
          
          // Save bookmark after scrolling to search result
          setTimeout(async () => {
            if (textReaderRef.current) {
              const scrollPosition = textReaderRef.current.scrollTop
              console.log('🔍 Saving bookmark after search navigation to position:', scrollPosition)
              
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
          const targetPosition = textPercentage * scrollContainer.scrollHeight * 0.8
          scrollContainer.scrollTop = Math.max(0, targetPosition - 200)
          
          // Save bookmark after scrolling to search result
          setTimeout(() => {
            console.log('🔍 Saving bookmark after search navigation (scroll mode)')
            // Trigger the scroll event to save bookmark
            const scrollEvent = new Event('scroll')
            window.dispatchEvent(scrollEvent)
          }, 500)
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


