'use client'

import React, { useState, useRef } from 'react'
import BaseTextReader from './BaseTextReader'
import styles from './TextReader.module.css'

interface MobileTextReaderProps {
  text: string
  bookTitle: string
  author: string
  onTextSelect?: (selectedText: string) => void
}

const MobileTextReader: React.FC<MobileTextReaderProps> = (props) => {
  const baseReader = BaseTextReader(props)
  
  // Mobile-specific selection state
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isInSelectionMode, setIsInSelectionMode] = useState(false)
  const [currentSelection, setCurrentSelection] = useState('')
  const initialScrollTopRef = useRef<number | null>(null)

  // Mobile-specific touch selection handlers
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
        return ''
      }
      
      baseReader.setHighlightedText(text)
      return text
    } catch (error) {
      return ''
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const pos = { x: touch.clientX, y: touch.clientY }
    setTouchStartPos(pos)
    
    // Start long press timer
    const timer = setTimeout(() => {
      // Get the word at the long press position
      const startRange = document.caretRangeFromPoint?.(pos.x, pos.y)
      if (!startRange) {
        return
      }
      
      // Expand to word boundaries for initial selection
      const initialRange = document.createRange()
      initialRange.setStart(startRange.startContainer, startRange.startOffset)
      initialRange.setEnd(startRange.startContainer, startRange.startOffset)
      const expandedRange = expandToWordBoundaries(initialRange)
      const initialText = expandedRange.toString().trim()
      
      // Only enter selection mode if we actually found text
      if (!initialText || initialText.length === 0) {
        return
      }
      
      // Enter selection mode
      setIsInSelectionMode(true)
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
      // Lock overscroll (rubber band) while selecting
      const htmlEl = document.documentElement as HTMLElement
      const prevOverscroll = htmlEl.style.overscrollBehavior
      htmlEl.style.overscrollBehavior = 'contain'
      // Remember current scrollTop of the text container
      const container = baseReader.textContentRef.current
      if (container) {
        initialScrollTopRef.current = container.scrollTop
      }
      
      setCurrentSelection(initialText)
      baseReader.setHighlightedText(initialText)
      
      // Provide haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 400) // Long press duration
    
    setLongPressTimer(timer)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    // If we were in selection mode, exit it and restore scrolling
    if (isInSelectionMode) {
      setIsInSelectionMode(false)
      
      // Restore scrolling
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      const htmlEl = document.documentElement as HTMLElement
      htmlEl.style.overscrollBehavior = ''
      initialScrollTopRef.current = null
      
      // Show text selection dialog if we have current selection
      if (currentSelection && currentSelection.length > 2) {
        baseReader.setSelectedText(currentSelection)
        baseReader.setShowConfirmDialog(true)
      }
      
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
      
      // Update selection during drag
      const text = handleLongPress(touchStartPos.x, touchStartPos.y, touch.clientX, touch.clientY)
      if (text && text.length > 0) {
        setCurrentSelection(text)
        baseReader.setHighlightedText(text)
      }
      return // Don't do any other processing if we're in selection mode
    }
    
    // Cancel long press timer if user moves significantly (they're scrolling)
    if (distance > 15 && longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // While selecting, add a non-passive touchmove listener to the container so preventDefault actually blocks scroll (iOS Safari)
  React.useEffect(() => {
    const container = baseReader.textContentRef.current
    if (!isInSelectionMode || !container) return
    const onTouchMove = (evt: TouchEvent) => {
      evt.preventDefault()
      if (initialScrollTopRef.current !== null) {
        container.scrollTop = initialScrollTopRef.current
      }
    }
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      container.removeEventListener('touchmove', onTouchMove as EventListener as any)
    }
  }, [isInSelectionMode, baseReader.textContentRef])

  return (
    <div className={styles.textReader}>
      {baseReader.showFirstTimeInstructions && (
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
            To get started, simply <strong>long press on any confusing passage</strong> in the text below. 
            We'll provide an AI explanation to help you understand it better.
          </p>
          <button 
            onClick={() => baseReader.setShowFirstTimeInstructions(false)}
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
        padding: '8px 8px 8px 8px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={baseReader.searchInputRef}
            type="text"
            placeholder="Search in text..."
            value={baseReader.searchQuery}
            onChange={(e) => baseReader.setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                baseReader.handleSearch(baseReader.searchQuery)
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
            onClick={() => baseReader.handleSearch(baseReader.searchQuery)}
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
        {baseReader.searchResults.length > 0 && (
          <div style={{ 
            marginTop: '4px',
            fontSize: '12px',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{baseReader.currentSearchIndex + 1} of {baseReader.searchResults.length}</span>
            <button onClick={baseReader.prevSearchResult} style={{
              padding: '2px 6px', border: '1px solid #ddd', borderRadius: '2px',
              background: 'white', cursor: 'pointer', fontSize: '11px'
            }}>↑</button>
            <button onClick={baseReader.nextSearchResult} style={{
              padding: '2px 6px', border: '1px solid #ddd', borderRadius: '2px',
              background: 'white', cursor: 'pointer', fontSize: '11px'
            }}>↓</button>
            <button onClick={() => {
              baseReader.setSearchQuery('')
              baseReader.setSearchResults([])
              baseReader.setCurrentSearchIndex(-1)
            }} style={{
              padding: '2px 8px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: '11px', color: '#999'
            }}>clear</button>
          </div>
        )}
      </div>
      
      {/* Text Content with Mobile Touch Selection */}
      <div 
        ref={baseReader.textContentRef}
        className={styles.textContent}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          fontFamily: baseReader.settings.textFont
        }}
      >
        {baseReader.renderTextWithHighlight()}
      </div>
      
      {/* Confirmation Dialog */}
      {baseReader.showConfirmDialog && (
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
            "{baseReader.selectedText}"
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              onClick={baseReader.handleCancel}
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
              onClick={baseReader.handleExplain}
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

export default MobileTextReader