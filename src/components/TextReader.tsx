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
  const router = useRouter()
  const textReaderRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
      setShowConfirmDialog(true)
    }
  }

  const renderTextWithHighlight = () => {
    if (!isInSelectionMode || !highlightedText) {
      return text
    }
    
    const index = text.indexOf(highlightedText)
    if (index === -1) return text
    
    const before = text.slice(0, index)
    const highlighted = text.slice(index, index + highlightedText.length)
    const after = text.slice(index + highlightedText.length)
    
    return (
      <>
        {before}
        <span className={styles.selectedText}>{highlighted}</span>
        {after}
      </>
    )
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
    e.preventDefault()
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
    e.preventDefault()
    e.stopPropagation()
    
    // If we were in selection mode, finalize the selection
    if (isInSelectionMode && currentSelection) {
      setSelectedText(currentSelection)
      setShowConfirmDialog(true)
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
    
    // If we're in selection mode, extend the selection
    if (isInSelectionMode) {
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