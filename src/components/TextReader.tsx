'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './TextReader.module.css'
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
    
    // Restore bookmark position
    const savedPosition = localStorage.getItem(bookmarkKey)
    if (savedPosition) {
      const position = parseInt(savedPosition)
      console.log(`Restoring bookmark for ${bookTitle} by ${author}: position ${position}`)
      
      // Wait for DOM to be ready, then restore position
      setTimeout(() => {
        if (textReaderRef.current) {
          console.log(`Setting scrollTop to ${position} for ${bookTitle}`)
          textReaderRef.current.scrollTop = position
          
          // Verify the scroll actually happened
          setTimeout(() => {
            if (textReaderRef.current) {
              console.log(`Actual scrollTop after restoration: ${textReaderRef.current.scrollTop}`)
            }
          }, 50)
        }
      }, 300)
    } else {
      console.log(`No saved bookmark found for ${bookTitle} by ${author}`)
    }
  }, [text, bookTitle, author])

  // Save bookmark when user stops scrolling (debounced)
  useEffect(() => {
    const handleScroll = () => {
      if (textReaderRef.current) {
        const scrollPosition = textReaderRef.current.scrollTop
        setHasUserScrolled(true)
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        
        // Set new timeout to save after user stops scrolling
        scrollTimeoutRef.current = setTimeout(() => {
          const bookmarkKey = `bookmark-${bookTitle}-${author}`
          console.log(`Saving bookmark for ${bookTitle}: position ${scrollPosition}`)
          localStorage.setItem(bookmarkKey, scrollPosition.toString())
        }, 500) // Save 500ms after user stops scrolling
      }
    }

    const textElement = textReaderRef.current
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
      console.log('handleTextSelection called, selection:', selection)
      console.log('selection text:', selection?.toString())
      console.log('selection range count:', selection?.rangeCount)
      
      if (selection && selection.rangeCount > 0) {
        const selectedText = selection.toString().trim()
        console.log('Selected text:', selectedText)
        
        if (selectedText && selectedText.length > 0) {
          setSelectedText(selectedText)
          setShowConfirmDialog(true)
          console.log('Setting selectedText and showing dialog')
        } else {
          console.log('No text selected or empty selection')
        }
      } else {
        console.log('No selection or no ranges')
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
      const index = textToRender.indexOf(highlightedText)
      if (index !== -1) {
        const before = textToRender.slice(0, index)
        const highlighted = textToRender.slice(index, index + highlightedText.length)
        const after = textToRender.slice(index + highlightedText.length)
        
        return (
          <>
            {before}
            <span className={styles.selectedText}>{highlighted}</span>
            {after}
          </>
        )
      }
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
        console.log('Could not create ranges')
        return ''
      }
      
      // Create a range spanning from start to end
      const range = document.createRange()
      range.setStart(startRange.startContainer, startRange.startOffset)
      range.setEnd(endRange.startContainer, endRange.startOffset)
      
      // Expand to word boundaries
      const expandedRange = expandToWordBoundaries(range)
      
      const text = expandedRange.toString().trim()
      setHighlightedText(text)
      console.log('Long press selection:', text)
      return text
    } catch (error) {
      console.log('Error in handleLongPress:', error)
      return ''
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const pos = { x: touch.clientX, y: touch.clientY }
    setTouchStartPos(pos)
    
    // Start long press timer
    const timer = setTimeout(() => {
      console.log('Long press triggered')
      setIsInSelectionMode(true)
      const initialText = handleLongPress(pos.x, pos.y, pos.x, pos.y)
      setCurrentSelection(initialText)
      // Show highlighting immediately
      setHighlightedText(initialText)
    }, 500) // 500ms long press
    
    setLongPressTimer(timer)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Only prevent default if we were in selection mode
    if (isInSelectionMode) {
      e.preventDefault()
      e.stopPropagation()
      
      // Finalize the selection
      if (currentSelection) {
        setSelectedText(currentSelection)
        setShowConfirmDialog(true)
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
      const text = handleLongPress(touchStartPos.x, touchStartPos.y, touch.clientX, touch.clientY)
      setCurrentSelection(text || '')
    } else if (longPressTimer && distance > 10) {
      // Cancel long press if moved too much before selection started
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleExplain = () => {
    // Store the selected text and context in sessionStorage for the chat page
    const context = extractContextInfo(selectedText, text)
    sessionStorage.setItem('chatContext', JSON.stringify({
      selectedText,
      contextInfo: context,
      bookTitle,
      author
    }))
    
    // Navigate to chat page
    router.push('/chat')
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

    console.log('Searching for:', query)
    console.log('Text length:', text.length)
    
    const results: {index: number, length: number}[] = []
    const searchTerm = query.toLowerCase()
    const textLower = text.toLowerCase()
    
    // Debug: check if text contains the search term
    let testIndex = textLower.indexOf(searchTerm)
    console.log('First occurrence index:', testIndex)
    
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
        console.log('Found with commas at:', testIndex)
      }
    }
    
    if (testIndex >= 0) {
      console.log('Context around match:', textLower.substring(testIndex - 20, testIndex + actualLength + 20))
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
    
    console.log('Search results found:', results.length)
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
        if (targetElement) {
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
          console.log('Scrolled to highlighted element')
          return
        }
      }
      
      // Fallback: manual calculation
      const scrollContainer = textReaderRef.current
      if (scrollContainer) {
        const textPercentage = result.index / text.length
        const targetPosition = textPercentage * scrollContainer.scrollHeight * 0.8 // Adjust multiplier
        scrollContainer.scrollTop = Math.max(0, targetPosition - 200)
        console.log('Fallback scroll to position:', targetPosition)
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
            Try selecting a line from Romeo and Juliet that seems difficult to understand.
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
      
      {/* Search Bar */}
      <div style={{
        position: 'sticky',
        top: '0px',
        padding: '8px 20px',
        margin: '0 -20px 0 -20px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        zIndex: 50,
        width: 'calc(100% + 40px)',
        boxSizing: 'border-box',
        marginTop: '-20px'
      }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search..."
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
            width: '100%',
            padding: '6px 12px',
            margin: 0,
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: 'white'
          }}
        />
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
          WebkitUserSelect: window.ontouchstart !== undefined ? 'none' : 'text',
          userSelect: window.ontouchstart !== undefined ? 'none' : 'text',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          touchAction: isInSelectionMode ? 'none' : 'auto', // Prevent all touch gestures during selection
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