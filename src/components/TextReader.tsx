'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './TextReader.module.css'
import { SettingsData } from './Settings'
import { ProfileData } from './Profile'
import { debugReader, debugSearch, debugSelection, debugStorage } from '../utils/debug'

interface TextReaderProps {
  text: string
  bookTitle?: string
  author?: string
  settings: SettingsData
  profile: ProfileData
  onSettingsChange: (settings: SettingsData) => void
}

const TextReader: React.FC<TextReaderProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings, profile, onSettingsChange }) => {
  const [selectedText, setSelectedText] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const textContentRef = useRef<HTMLDivElement>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isInSelectionMode, setIsInSelectionMode] = useState(false)
  const [currentSelection, setCurrentSelection] = useState('')
  const [selectionRange, setSelectionRange] = useState<Range | null>(null)
  const [highlightedText, setHighlightedText] = useState<string>('')
  const [showFirstTimeInstructions, setShowFirstTimeInstructions] = useState(false)
  const [hasUserScrolled, setHasUserScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{index: number, length: number}[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)
  const router = useRouter()
  const textReaderRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Check for first-time user and restore bookmark
  useEffect(() => {
    
    // Only run after text has loaded and matches the current book
    if (!text || text.length < 100) return
    
    const bookmarkKey = `bookmark-${bookTitle}-${author}`
    const firstTimeKey = 'explainer-first-time'
    
    // Check if this is a first-time user
    const hasUsedBefore = localStorage.getItem(firstTimeKey)
    if (!hasUsedBefore) {
      setShowFirstTimeInstructions(true)
      localStorage.setItem(firstTimeKey, 'true')
    }
    
    // Restore bookmark position using percentage-based approach
    const savedPercentage = localStorage.getItem(bookmarkKey + '-percent')
    const savedPosition = localStorage.getItem(bookmarkKey) // Keep old system as fallback
    
    if (savedPercentage || savedPosition) {
      const percentage = savedPercentage ? parseFloat(savedPercentage) : null
      const position = savedPosition ? parseInt(savedPosition) : null
      
      // Wait for DOM and text content to be fully loaded
      const restorePosition = () => {
        if (textContentRef.current) {
          const element = textContentRef.current
          let targetPosition: number
          
          if (percentage !== null) {
            // Use percentage-based restoration (more reliable on mobile)
            targetPosition = Math.floor((element.scrollHeight - element.clientHeight) * percentage / 100)
          } else if (position !== null) {
            // Fallback to pixel-based for old bookmarks
            targetPosition = position
          } else {
            return
          }
          
          
          // Mobile-friendly scroll restoration
          element.scrollTo({ top: targetPosition, behavior: 'auto' })
          
        }
      }
      
      // Chrome Android-specific restoration
      // Chrome mobile often needs DOM to be fully ready and sometimes blocks scroll restoration
      const attemptRestore = () => {
        if (textContentRef.current && textContentRef.current.scrollHeight > 0) {
          restorePosition()
        } else {
          setTimeout(attemptRestore, 300)
        }
      }
      
      // Multiple attempts with different triggers
      setTimeout(attemptRestore, 300)    // Early attempt
      setTimeout(attemptRestore, 1000)   // After layout stabilizes
      setTimeout(attemptRestore, 2000)   // Final attempt
      
      // Chrome mobile: try after requestAnimationFrame (ensures render complete)
      requestAnimationFrame(() => {
        setTimeout(attemptRestore, 100)
      })
      
      // Also try on viewport resize (Chrome mobile sometimes needs this)
      const handleResize = () => {
        setTimeout(attemptRestore, 200)
        window.removeEventListener('resize', handleResize)
      }
      window.addEventListener('resize', handleResize)
    }
  }, [text, bookTitle, author])


  // Save bookmark when user stops scrolling (debounced)
  useEffect(() => {
    const handleScroll = () => {
      if (textContentRef.current) {
        const scrollPosition = textContentRef.current.scrollTop
        setHasUserScrolled(true)
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        
        // Set new timeout to save after user stops scrolling
        scrollTimeoutRef.current = setTimeout(() => {
          const bookmarkKey = `bookmark-${bookTitle}-${author}`
          const scrollableHeight = textContentRef.current!.scrollHeight - textContentRef.current!.clientHeight
          const percentage = scrollableHeight > 0 ? (scrollPosition / scrollableHeight) * 100 : 0
          
          debugStorage(`Saving bookmark for ${bookTitle}: ${scrollPosition}px (${percentage.toFixed(1)}%)`)
          
          // Save both pixel position and percentage for compatibility
          localStorage.setItem(bookmarkKey, scrollPosition.toString())
          localStorage.setItem(bookmarkKey + '-percent', percentage.toString())
        }, 500) // Save 500ms after user stops scrolling
      }
    }

    const textElement = textContentRef.current
    if (textElement) {
      setTimeout(() => {
        textElement.addEventListener('scroll', handleScroll)
      }, 100)
      
      return () => {
        textElement.removeEventListener('scroll', handleScroll)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [bookTitle, author, text])

  const extractContextInfo = (selectedText: string, fullText: string) => {
    const selectedIndex = fullText.indexOf(selectedText)
    if (selectedIndex === -1) return null

    // Get surrounding text for context
    const beforeText = fullText.substring(Math.max(0, selectedIndex - 1000), selectedIndex)
    const afterText = fullText.substring(selectedIndex + selectedText.length, Math.min(fullText.length, selectedIndex + selectedText.length + 500))

    // Extract Act and Scene for Shakespeare plays
    let act: string | null = null
    let scene: string | null = null
    let speaker: string | null = null
    let charactersOnStage: string[] = []

    // Look backwards for Act/Scene markers - check both before text and full text up to selection
    const searchText = fullText.substring(0, selectedIndex + selectedText.length)
    
    // Extract Act number - match "ACT" followed by whitespace and Roman numerals
    const actMatches = searchText.match(/\bACT\s+([IVXLCDM]+)\b/gi)
    if (actMatches) {
      const lastActMatch = actMatches[actMatches.length - 1]
      act = lastActMatch.replace(/\bACT\s+/i, '').trim()
    }
    
    // Extract Scene number - match "SCENE" followed by whitespace and Roman numerals  
    const sceneMatches = searchText.match(/\bSCENE\s+([IVXLCDM]+)\b/gi)
    if (sceneMatches) {
      const lastSceneMatch = sceneMatches[sceneMatches.length - 1]
      scene = lastSceneMatch.replace(/\bSCENE\s+/i, '').trim()
    }

    // Look for speaker (name in caps followed by period)
    // Find all speaker names in the text leading up to the selection
    const speakerMatches = beforeText.match(/\n([A-Z][A-Z\s&']+)\./g)
    if (speakerMatches && speakerMatches.length > 0) {
      // Get the last speaker name before the selected text
      const lastSpeakerMatch = speakerMatches[speakerMatches.length - 1]
      const speakerName = lastSpeakerMatch.replace(/^\n/, '').replace(/\.$/, '').trim()
      
      // Clean up speaker name (remove stage directions in brackets)
      speaker = speakerName.replace(/\[.*?\]/g, '').trim()
      
      // Handle special cases like "[_Aside._]" or multiple speakers
      if (speaker.includes('_') || speaker.length < 2) {
        speaker = null
      }
    }

    // Track characters entering and exiting to build current stage list
    // Look for stage directions in the entire text up to this point
    const textBeforeSelection = fullText.substring(0, selectedIndex)
    const stageDirections = textBeforeSelection.match(/\s+Enter\s+[^\r\n]+|Exit\s+[^\r\n]+|Exeunt[^\r\n]*/gi) || []
    const currentCharacters = new Set<string>()
    
    // Process all stage directions in order
    stageDirections.forEach(direction => {
      const trimmedDirection = direction.trim()
      const isEnter = /^Enter/i.test(trimmedDirection)
      const isExit = /^Exit/i.test(trimmedDirection)
      const isExeunt = /^Exeunt/i.test(trimmedDirection)
      
      if (isEnter) {
        // Extract character names after "Enter"
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
          // Extract specific characters exiting
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
      beforeContext: beforeText.slice(-200), // Last 200 chars for context
      afterContext: afterText.slice(0, 200)   // First 200 chars for context
    }
  }

  const handleTextSelection = () => {
    // Small delay to ensure selection is fully registered
    setTimeout(() => {
      const selection = window.getSelection()
      debugReader('handleTextSelection called, selection:', selection)
      debugReader('selection text:', selection?.toString())
      debugReader('selection range count:', selection?.rangeCount)
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        debugReader('Range collapsed:', range.collapsed)
        debugReader('Start offset:', range.startOffset)
        debugReader('End offset:', range.endOffset)
        
        const selectedText = selection.toString().trim()
        debugReader('Selected text length:', selectedText.length)
        debugReader('Selected text:', selectedText)
        
        if (selectedText && selectedText.length > 0) {
          setSelectedText(selectedText)
          setShowConfirmDialog(true)
          debugReader('Setting selectedText and showing dialog')
        } else {
          debugReader('No text selected or empty selection')
        }
      } else {
        debugReader('No selection or no ranges')
      }
    }, 10) // Very small delay to let selection register
  }

  const renderTextWithHighlight = () => {
    let textToRender = text
    
    // Handle search highlighting
    if (searchResults.length > 0 && searchQuery.trim()) {
      const parts = []
      let lastIndex = 0
      
      searchResults.forEach((result, index) => {
        // Add text before this search result
        if (result.index > lastIndex) {
          parts.push(textToRender.slice(lastIndex, result.index))
        }
        
        // Add the highlighted search result
        const isCurrentResult = index === currentSearchIndex
        const searchText = textToRender.slice(result.index, result.index + result.length)
        console.log(`Highlighting result ${index}:`, searchText, 'at position', result.index)
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
      
      // Add remaining text
      if (lastIndex < textToRender.length) {
        parts.push(textToRender.slice(lastIndex))
      }
      
      return <>{parts}</>
    }
    
    // Handle selection highlighting (when in selection mode)
    if (isInSelectionMode && highlightedText) {
      // Try multiple search strategies to find the text
      const strategies = [
        // Exact match
        () => {
          const index = textToRender.indexOf(highlightedText)
          if (index !== -1) return { index, text: highlightedText }
          return null
        },
        // Case-insensitive match
        () => {
          const lowerText = textToRender.toLowerCase()
          const lowerHighlight = highlightedText.toLowerCase()
          const index = lowerText.indexOf(lowerHighlight)
          if (index !== -1) return { index, text: textToRender.slice(index, index + highlightedText.length) }
          return null
        },
        // Try without punctuation (for speaker names like "THESEUS.")
        () => {
          const cleanHighlight = highlightedText.replace(/[.,:;!?]/g, '')
          const index = textToRender.indexOf(cleanHighlight)
          if (index !== -1) return { index, text: cleanHighlight }
          return null
        },
        // Fuzzy match - try to find the core word
        () => {
          const coreWord = highlightedText.replace(/[^a-zA-Z]/g, '').toUpperCase()
          if (coreWord.length < 2) return null
          
          const regex = new RegExp(`\\b${coreWord}\\b`, 'i')
          const match = textToRender.match(regex)
          if (match) {
            const index = textToRender.indexOf(match[0])
            return { index, text: match[0] }
          }
          return null
        }
      ]
      
      // Try each strategy until one works
      for (const strategy of strategies) {
        const result = strategy()
        if (result) {
          const before = textToRender.slice(0, result.index)
          const highlighted = result.text
          const after = textToRender.slice(result.index + highlighted.length)
          
          return (
            <>
              {before}
              <span className={styles.selectedText}>{highlighted}</span>
              {after}
            </>
          )
        }
      }
      
      // If no strategy works, fall back to native browser selection visual
      // The text is selected but we can't highlight it in our custom way
    }
    
    return textToRender
  }

  const expandToWordBoundaries = (range: Range): Range => {
    const expandedRange = range.cloneRange()
    
    // Expand start to word boundary
    const startContainer = range.startContainer
    const startOffset = range.startOffset
    
    if (startContainer.nodeType === Node.TEXT_NODE) {
      const textContent = startContainer.textContent || ''
      let newStart = startOffset
      
      // Go backwards to find start of word
      while (newStart > 0 && /\w/.test(textContent[newStart - 1])) {
        newStart--
      }
      expandedRange.setStart(startContainer, newStart)
    }
    
    // Expand end to word boundary
    const endContainer = range.endContainer
    const endOffset = range.endOffset
    
    if (endContainer.nodeType === Node.TEXT_NODE) {
      const textContent = endContainer.textContent || ''
      let newEnd = endOffset
      
      // Go forwards to find end of word
      while (newEnd < textContent.length && /\w/.test(textContent[newEnd])) {
        newEnd++
      }
      expandedRange.setEnd(endContainer, newEnd)
    }
    
    return expandedRange
  }

  const handleLongPress = (startX: number, startY: number, endX: number, endY: number): string => {
    try {
      // Get ranges for start and end points
      const startRange = document.caretRangeFromPoint?.(startX, startY)
      const endRange = document.caretRangeFromPoint?.(endX, endY)
      
      if (!startRange || !endRange) {
        debugReader('Could not create ranges - likely clicked on whitespace or outside text')
        return ''
      }
      
      // Check if we're actually hitting text content, not just whitespace
      const startContainer = startRange.startContainer
      if (startContainer.nodeType === Node.TEXT_NODE) {
        const textContent = startContainer.textContent || ''
        const charAtStart = textContent[startRange.startOffset]
        
        // If we hit pure whitespace or empty content, don't proceed
        if (!charAtStart || /^\s+$/.test(charAtStart)) {
          // Try to find nearby text within a small radius
          let foundText = false
          for (let offset = 1; offset <= 5 && startRange.startOffset + offset < textContent.length; offset++) {
            if (/\w/.test(textContent[startRange.startOffset + offset])) {
              foundText = true
              startRange.setStart(startContainer, startRange.startOffset + offset)
              break
            }
          }
          
          if (!foundText) {
            debugReader('Long press on whitespace - no nearby text found')
            return ''
          }
        }
      }
      
      // Create a range spanning from start to end, but handle reverse selections
      const range = document.createRange()
      
      // Determine which point comes first in document order
      const comparison = startRange.compareBoundaryPoints(Range.START_TO_START, endRange)
      
      if (comparison <= 0) {
        // Normal selection: start comes before or equals end
        range.setStart(startRange.startContainer, startRange.startOffset)
        range.setEnd(endRange.startContainer, endRange.startOffset)
      } else {
        // Reverse selection: end comes before start, so swap them
        range.setStart(endRange.startContainer, endRange.startOffset)
        range.setEnd(startRange.startContainer, startRange.startOffset)
      }
      
      // Expand to word boundaries
      const expandedRange = expandToWordBoundaries(range)
      
      const text = expandedRange.toString().trim()
      
      // Final validation - make sure we got actual text, not just whitespace
      if (!text || text.length === 0 || /^\s+$/.test(text)) {
        debugReader('Long press resulted in empty or whitespace-only selection')
        return ''
      }
      
      setHighlightedText(text)
      debugReader('Long press selection:', text)
      return text
    } catch (error) {
      debugReader('Error in handleLongPress:', error)
      return ''
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    // Clear any existing native selections
    window.getSelection()?.removeAllRanges()
    
    const touch = e.touches[0]
    const pos = { x: touch.clientX, y: touch.clientY }
    setTouchStartPos(pos)
    
    // Start long press timer - longer delay to avoid accidental selection during scrolling
    const timer = setTimeout(() => {
      // Only trigger if finger is still in roughly the same place (not scrolling)
      if (touchStartPos) {
        const currentDistance = Math.sqrt(
          Math.pow(touch.clientX - touchStartPos.x, 2) + Math.pow(touch.clientY - touchStartPos.y, 2)
        )
        
        // If finger has moved more than 15px, user is probably scrolling, not selecting
        if (currentDistance > 15) {
          debugReader('Long press cancelled - finger moved too much (scrolling)')
          return
        }
      }
      
      debugReader('Long press triggered')
      
      // Get the word at the long press position
      const startRange = document.caretRangeFromPoint?.(pos.x, pos.y)
      if (!startRange) {
        debugReader('Long press found no text - not entering selection mode')
        return
      }
      
      debugReader('Long press startRange:', startRange)
      debugReader('Start container:', startRange.startContainer.textContent?.substring(Math.max(0, startRange.startOffset - 10), startRange.startOffset + 10))
      
      // Expand to word boundaries for initial selection
      const initialRange = document.createRange()
      initialRange.setStart(startRange.startContainer, startRange.startOffset)
      initialRange.setEnd(startRange.startContainer, startRange.startOffset)
      const expandedRange = expandToWordBoundaries(initialRange)
      const initialText = expandedRange.toString().trim()
      
      debugReader('Initial expanded text:', initialText)
      debugReader('Expanded range:', expandedRange)
      
      // Only enter selection mode if we actually found text
      if (!initialText || initialText.length === 0) {
        debugReader('Long press found no text - not entering selection mode')
        return
      }
      
      setIsInSelectionMode(true)
      
      // Prevent any scrolling once we enter selection mode - more aggressive approach
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      
      // Also prevent scrolling on the text container itself
      if (textReaderRef.current) {
        textReaderRef.current.style.overflow = 'hidden'
      }
      
      setCurrentSelection(initialText)
      // Show highlighting immediately - both custom and native selection
      debugReader('Setting highlighted text to:', initialText)
      setHighlightedText(initialText)
      
      // Force a re-render to ensure highlighting appears immediately
      setTimeout(() => {
        setHighlightedText(initialText)
      }, 0)
      
      // Create native visual selection for immediate feedback (but don't clear it)
      const selection = window.getSelection()
      if (selection) {
        debugReader('Creating native selection for text:', initialText)
        selection.removeAllRanges()
        selection.addRange(expandedRange.cloneRange())
        debugReader('Native selection created, selected text:', selection.toString())
      }
      
      // Provide haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 400) // Increased delay to 400ms to reduce accidental triggering
    
    setLongPressTimer(timer)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Only prevent default if we were actually in selection mode
    if (isInSelectionMode) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Clear any native selections that might trigger browser search
    window.getSelection()?.removeAllRanges()
    
    if (isInSelectionMode) {
      // Restore scrolling
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.height = ''
      
      // Restore text container scrolling
      if (textReaderRef.current) {
        textReaderRef.current.style.overflow = 'auto'
      }
      
      // No event listeners to clean up
      
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
      
      // Finalize the selection
      if (currentSelection && currentSelection.length > 2) {
        // Clear highlighted text before showing dialog
        setHighlightedText('')
        setSelectedText(currentSelection)
        setShowConfirmDialog(true)
        debugReader('Touch selection completed:', currentSelection)
      } else {
        debugReader('Touch selection too short or empty:', currentSelection)
      }
      setIsInSelectionMode(false)
      setCurrentSelection('')
    }
    
    // Clear long press timer if still running
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    
    setTouchStartPos(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos) return
    
    const touch = e.touches[0]
    const distance = Math.sqrt(
      Math.pow(touch.clientX - touchStartPos.x, 2) + Math.pow(touch.clientY - touchStartPos.y, 2)
    )
    
    // If we're in selection mode, extend the selection and prevent scrolling
    if (isInSelectionMode) {
      e.preventDefault() // Prevent scrolling during text selection
      e.stopPropagation()
      
      // Always update selection, even for small movements
      const text = handleLongPress(touchStartPos.x, touchStartPos.y, touch.clientX, touch.clientY)
      if (text && text.length > 0) {
        setCurrentSelection(text)
        setHighlightedText(text)
      }
    } else if (longPressTimer) { 
      if (distance > 10) {
        // Cancel long press early if user is clearly scrolling (reduced back to 10px)
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
        debugReader('Long press cancelled - user is scrolling')
      } else {
        // Still in long press detection phase - prevent scrolling
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }

  const handleExplain = () => {
    debugReader('handleExplain called with selectedText:', selectedText)
    
    // Store the selected text and context in sessionStorage for the chat page
    const context = extractContextInfo(selectedText, text)
    const chatData = {
      selectedText,
      contextInfo: context,
      bookTitle,
      author,
      timestamp: Date.now() // Add timestamp to force updates
    }
    
    debugReader('Storing chat context:', chatData)
    sessionStorage.setItem('chatContext', JSON.stringify(chatData))
    
    // Navigate to chat page - force a refresh if already there
    if (window.location.pathname === '/chat') {
      // If we're already on chat page, trigger a custom event to force update
      window.dispatchEvent(new CustomEvent('newChatContext', { detail: chatData }))
    } else {
      router.push('/chat')
    }
    
    setShowConfirmDialog(false)
    setSelectedText('')
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setSelectedText('')
    setIsInSelectionMode(false)
    setCurrentSelection('')
    setSelectionRange(null)
    setHighlightedText('')
    window.getSelection()?.removeAllRanges()
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setCurrentSearchIndex(-1)
      return
    }

    debugReader('Searching for:', query)
    debugReader('Text length:', text.length)
    
    const results: {index: number, length: number}[] = []
    const searchTerm = query.toLowerCase()
    const textLower = text.toLowerCase()
    
    // Debug: check if text contains the search term
    let testIndex = textLower.indexOf(searchTerm)
    debugReader('First occurrence index:', testIndex)
    
    // If exact match not found, try flexible search for common phrases
    let actualSearchTerm = searchTerm
    let actualLength = searchTerm.length
    
    if (testIndex === -1 && searchTerm.includes('to be')) {
      // Try with commas for Shakespeare quotes
      const withCommas = searchTerm.replace('to be or not to be', 'to be, or not to be')
      testIndex = textLower.indexOf(withCommas)
      if (testIndex >= 0) {
        actualSearchTerm = withCommas
        actualLength = withCommas.length
        debugReader('Found with commas at:', testIndex)
      }
    }
    
    if (testIndex >= 0) {
      debugReader('Context around match:', textLower.substring(testIndex - 20, testIndex + actualLength + 20))
    }
    
    let startIndex = 0
    while (startIndex < textLower.length) {
      const foundIndex = textLower.indexOf(actualSearchTerm, startIndex)
      if (foundIndex === -1) break
      
      results.push({
        index: foundIndex,
        length: actualLength
      })
      startIndex = foundIndex + 1
    }
    
    debugReader('Search results found:', results.length)
    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)
    
    // Scroll to first result
    if (results.length > 0) {
      scrollToSearchResult(0, results)
    }
  }

  const scrollToSearchResult = (resultIndex: number, results: {index: number, length: number}[]) => {
    if (resultIndex < 0 || resultIndex >= results.length || !textContentRef.current) return
    
    const result = results[resultIndex]
    
    // Try to find the highlighted element and scroll to it
    setTimeout(() => {
      const highlightedElements = textContentRef.current?.querySelectorAll('span[style*="background"]')
      
      if (highlightedElements && highlightedElements.length > 0) {
        const targetElement = highlightedElements[resultIndex] as HTMLElement
        if (targetElement && textContentRef.current) {
          // Calculate position relative to text content container
          const containerRect = textContentRef.current.getBoundingClientRect()
          const targetRect = targetElement.getBoundingClientRect()
          const relativeTop = targetRect.top - containerRect.top
          const containerHeight = textContentRef.current.clientHeight
          
          // Scroll to center the target in the visible area
          const scrollTop = textContentRef.current.scrollTop + relativeTop - (containerHeight / 2)
          textContentRef.current.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          })
          debugReader('Scrolled to highlighted element within text container')
          return
        }
      }
      
      // Fallback: manual calculation
      const scrollContainer = textContentRef.current
      if (scrollContainer) {
        const textPercentage = result.index / text.length
        const targetPosition = textPercentage * scrollContainer.scrollHeight * 0.8 // Adjust multiplier
        scrollContainer.scrollTop = Math.max(0, targetPosition - 200)
        debugReader('Fallback scroll to position:', targetPosition)
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


  return (
    <div ref={textReaderRef} className={styles.textReader}>
      {showFirstTimeInstructions && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
          zIndex: 2000,
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Welcome to The Explainers!</h3>
          <p style={{ margin: '0 0 20px 0', lineHeight: '1.5' }}>
            To get started, simply <strong>highlight any confusing passage</strong> in the text below. 
            We'll provide an AI explanation to help you understand it better.
          </p>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', opacity: '0.9' }}>
            Try selecting any passage in the text that seems difficult to understand.
          </p>
          <button 
            onClick={() => setShowFirstTimeInstructions(false)}
            style={{
              padding: '10px 20px',
              border: '2px solid white',
              borderRadius: '6px',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Got it!
          </button>
        </div>
      )}
      
      {/* Search Bar - Fixed at top */}
      <div style={{
        padding: '8px 8px 8px 8px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search in text..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery)
              }
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              margin: 0,
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white'
            }}
          />
          <button
            onClick={() => handleSearch(searchQuery)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#f8f9fa',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#495057'
            }}
          >
            🔍
          </button>
        </div>
        {searchResults.length > 0 && (
          <div style={{ 
            marginTop: '4px',
            fontSize: '12px',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{currentSearchIndex + 1} of {searchResults.length}</span>
            <button
              onClick={prevSearchResult}
              style={{
                padding: '2px 6px',
                border: '1px solid #ddd',
                borderRadius: '2px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              ↑
            </button>
            <button
              onClick={nextSearchResult}
              style={{
                padding: '2px 6px',
                border: '1px solid #ddd',
                borderRadius: '2px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              ↓
            </button>
            <button
              onClick={() => {
                setSearchQuery('')
                setSearchResults([])
                setCurrentSearchIndex(-1)
              }}
              style={{
                padding: '2px 8px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                color: '#999'
              }}
            >
              clear
            </button>
          </div>
        )}
      </div>
      
      
      <div 
        ref={textContentRef}
        className={styles.textContent}
        onMouseUp={handleTextSelection}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          WebkitUserSelect: isInSelectionMode ? 'none' : 'text',
          userSelect: isInSelectionMode ? 'none' : 'text', 
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          touchAction: (isInSelectionMode || longPressTimer) ? 'none' : 'pan-y',
          fontFamily: settings.textFont
        }}
      >
        {renderTextWithHighlight()}
      </div>
      
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxWidth: '400px'
        }}>
          <h3>Selected Text:</h3>
          <p style={{ margin: '10px 0', fontStyle: 'italic' }}>
            "{selectedText}"
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleExplain}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: '#007bff',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Explain
            </button>
          </div>
        </div>
      )}
      
    </div>
  )
}

export default TextReader