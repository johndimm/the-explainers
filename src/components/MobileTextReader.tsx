'use client'

import React, { useEffect, useRef, useState } from 'react'
import styles from './TextReader.module.css'
import { ReaderCommonProps, useBookmarkRestoreAndSave, useSearchCore, extractContextInfo } from './BaseTextReader'
import { useRouter } from 'next/navigation'
import { log, warn } from '../utils/log'

const MobileTextReader: React.FC<ReaderCommonProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings, profile, onSettingsChange }) => {
  log('MobileTextReader rendering with text length:', text?.length)
  const router = useRouter()
  const textReaderRef = useRef<HTMLDivElement>(null)
  const textContentRef = useRef<HTMLDivElement>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [isInSelectionMode, setIsInSelectionMode] = useState(false)
  const [highlightedText, setHighlightedText] = useState('')
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const initialScrollTopRef = useRef<number | null>(null)
  const startScrollTopRef = useRef<number>(0)
  const CANCEL_DISTANCE_PX = 35
  const selectionModeRef = useRef<boolean>(false)
  const vibratedRef = useRef<boolean>(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [initialZoomLevel, setInitialZoomLevel] = useState<number>(1)
  
  // Device detection - only for iPhone-specific fallbacks
  const isIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent)

  const tryVibrate = (): boolean => {
    if (vibratedRef.current) return true
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        const ok = navigator.vibrate(50)
        if (ok === false) return false
        vibratedRef.current = true
        return true
      } catch {
        return false
      }
    }
    return false
  }

  const attemptVibrateWithRetries = (retries = 2, delayMs = 100) => {
    if (tryVibrate()) return
    let remaining = retries
    const tick = () => {
      if (vibratedRef.current) return
      if (tryVibrate()) return
      remaining -= 1
      if (remaining > 0) setTimeout(tick, delayMs)
    }
    setTimeout(tick, delayMs)
  }

  useBookmarkRestoreAndSave(textReaderRef, text, bookTitle, author)
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    handleSearch,
    nextSearchResult,
    prevSearchResult,
    renderTextWithSearchHighlight
  } = useSearchCore(text, textReaderRef, textContentRef)

  const expandToWordBoundaries = (range: Range): Range => {
    const expandedRange = range.cloneRange()
    const startContainer = range.startContainer
    const startOffset = range.startOffset
    if (startContainer.nodeType === Node.TEXT_NODE) {
      const textContent = startContainer.textContent || ''
      let newStart = startOffset
      while (newStart > 0 && /\w/.test(textContent[newStart - 1])) newStart--
      expandedRange.setStart(startContainer, newStart)
    }
    const endContainer = range.endContainer
    const endOffset = range.endOffset
    if (endContainer.nodeType === Node.TEXT_NODE) {
      const textContent = endContainer.textContent || ''
      let newEnd = endOffset
      while (newEnd < textContent.length && /\w/.test(textContent[newEnd])) newEnd++
      expandedRange.setEnd(endContainer, newEnd)
    }
    return expandedRange
  }

  const caretRangeAtPoint = (x: number, y: number): Range | null => {
    const anyDoc: any = document as any
    if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(x, y)
    }
    if (anyDoc.caretPositionFromPoint) {
      const pos = anyDoc.caretPositionFromPoint(x, y)
      if (pos && pos.offsetNode != null) {
        const r = document.createRange()
        r.setStart(pos.offsetNode, pos.offset)
        r.setEnd(pos.offsetNode, pos.offset)
        return r
      }
    }
    return null
  }

  const blockTouchMove = (evt: TouchEvent) => {
    if (!selectionModeRef.current) return
    evt.preventDefault()
    if (textReaderRef.current && initialScrollTopRef.current !== null) {
      textReaderRef.current.scrollTop = initialScrollTopRef.current
    }
  }

  const handleLongPress = (startX: number, startY: number, endX: number, endY: number): string => {
    try {
      log('handleLongPress called', { startX, startY, endX, endY })
      
      // Try multiple methods to get text ranges for iPhone compatibility
      const startRange = caretRangeAtPoint(startX, startY) || 
                        (document as any).caretPositionFromPoint?.(startX, startY) ||
                        document.elementFromPoint?.(startX, startY)?.ownerDocument?.createRange?.()
      
      const endRange = caretRangeAtPoint(endX, endY) || 
                      (document as any).caretPositionFromPoint?.(endX, endY) ||
                      document.elementFromPoint?.(endX, endY)?.ownerDocument?.createRange?.()
      
      if (!startRange || !endRange) {
        log('caretRangeAtPoint failed', { startRange: !!startRange, endRange: !!endRange })
        
        // iPhone fallback: only if standard method failed AND we're on iPhone
        if (isIPhone) {
          log('trying iPhone fallback method')
          return handleLongPressIPhone(startX, startY, endX, endY)
        }
        
        return ''
      }
      
      const range = document.createRange()
      
      // Always create range from left to right regardless of swipe direction
      // This ensures both left-to-right and right-to-left swipes work
      const comparison = startRange.compareBoundaryPoints?.(Range.START_TO_START, endRange) ?? 0
      log('range comparison', { comparison, startX, endX, swipeDirection: startX < endX ? 'left-to-right' : 'right-to-left' })
      
      if (comparison <= 0) {
        range.setStart(startRange.startContainer, startRange.startOffset)
        range.setEnd(endRange.startContainer, endRange.endOffset)
        log('range set: start to end')
      } else {
        range.setStart(endRange.startContainer, endRange.startOffset)
        range.setEnd(startRange.startContainer, startRange.startOffset)
        log('range set: end to start (swapped)')
      }
      
      const expandedRange = expandToWordBoundaries(range)
      const t = expandedRange.toString().trim()
      log('expanded range result', { text: t, length: t.length })
      if (!t) return ''
      setHighlightedText(t)
      return t
    } catch (error) {
      log('handleLongPress error', error)
      
      // iPhone fallback on error: only if we're on iPhone
      if (isIPhone) {
        log('trying iPhone fallback method after error')
        return handleLongPressIPhone(startX, startY, endX, endY)
      }
      
      return ''
    }
  }

  // iPhone-specific fallback method that only activates when standard method fails
  const handleLongPressIPhone = (startX: number, startY: number, endX: number, endY: number): string => {
    try {
      log('iPhone fallback method called', { startX, startY, endX, endY })
      
      // Get the text element at the touch points
      const startElement = document.elementFromPoint(startX, startY)
      const endElement = document.elementFromPoint(endX, endY)
      
      if (!startElement || !endElement) {
        log('iPhone fallback: elementFromPoint failed', { startElement: !!startElement, endElement: !!endElement })
        return ''
      }
      
      // Find the common text container
      let textContainer: Element | null = startElement
      while (textContainer && !textContainer.textContent) {
        textContainer = textContainer.parentElement
      }
      
      if (!textContainer || !textContainer.textContent) {
        log('iPhone fallback: no text container found')
        return ''
      }
      
      const text = textContainer.textContent
      log('iPhone fallback: found text container with length:', text.length)
      
      // Estimate character positions based on touch coordinates relative to container
      const containerRect = textContainer.getBoundingClientRect()
      const startCharIndex = Math.floor(((startX - containerRect.left) / containerRect.width) * text.length)
      const endCharIndex = Math.floor(((endX - containerRect.left) / containerRect.width) * text.length)
      
      // Ensure start is before end
      const actualStart = Math.min(startCharIndex, endCharIndex)
      const actualEnd = Math.max(startCharIndex, endCharIndex)
      
      // Get the text between the estimated positions
      let selectedText = text.substring(actualStart, actualEnd).trim()
      
      // If the selection is too short or empty, try to expand to word boundaries
      if (selectedText.length < 3) {
        // Find word boundaries around the estimated positions
        let wordStart = actualStart
        let wordEnd = actualEnd
        
        // Expand start to word beginning
        while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
          wordStart--
        }
        
        // Expand end to word end
        while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
          wordEnd++
        }
        
        selectedText = text.substring(wordStart, wordEnd).trim()
      }
      
      log('iPhone fallback result', { 
        selectedText, 
        length: selectedText.length, 
        startChar: actualStart, 
        endChar: actualEnd,
        textLength: text.length 
      })
      
      if (selectedText && selectedText.length > 2) {
        setHighlightedText(selectedText)
        return selectedText
      }
      
      return ''
    } catch (error) {
      log('iPhone fallback error', error)
      return ''
    }
  }

  const restoreScrolling = () => {
    log('restoreScrolling called')
    if (textReaderRef.current) {
      textReaderRef.current.style.overflowY = 'auto'
      ;(textReaderRef.current as HTMLElement).style.setProperty('overscroll-behavior', '')
      ;(textReaderRef.current as HTMLElement).removeEventListener('touchmove', blockTouchMove as any)
      ;(textReaderRef.current as HTMLElement).removeEventListener('touchmove', blockTouchMove as any, { passive: false } as any)
      ;(textReaderRef.current as HTMLElement).removeEventListener('touchmove', blockTouchMove as any, false)
    }
    initialScrollTopRef.current = null
    selectionModeRef.current = false
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    log('touchstart', { touches: e.touches.length, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })
    
    // Clear any existing selection to start fresh
    window.getSelection()?.removeAllRanges()
    
    const touch = e.touches[0]
    const pos = { x: touch.clientX, y: touch.clientY }
    setTouchStartPos(pos)
    touchStartPosRef.current = pos
    startScrollTopRef.current = textReaderRef.current ? textReaderRef.current.scrollTop : 0
    
    // Use a shorter delay for iPhone to make it more responsive
    const longPressDelay = isIPhone ? 300 : 400
    
    const timer = setTimeout(() => {
      const start = touchStartPosRef.current
      if (!start) { warn('longpress aborted: no touchStartPos'); return }
      log('longpress fired', start)
      setIsInSelectionMode(true)
      selectionModeRef.current = true
      vibratedRef.current = false
      // Kick off vibration attempts in case the first call is suppressed
      attemptVibrateWithRetries(3, 120)
      if (textReaderRef.current) {
        initialScrollTopRef.current = textReaderRef.current.scrollTop
        textReaderRef.current.style.overflowY = 'hidden'
        ;(textReaderRef.current as HTMLElement).style.setProperty('overscroll-behavior', 'contain')
        ;(textReaderRef.current as HTMLElement).addEventListener('touchmove', blockTouchMove, { passive: false })
      }
      // Clear search UI + results
      setSearchQuery('')
      setCurrentSearchIndex(-1)
      setHighlightedText('')
      // Also clear search results via handler
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleSearch('')

      // Create initial word selection at press point so user doesn't need to drag
      const startR = caretRangeAtPoint(start.x, start.y)
      if (startR) {
        const initialRange = document.createRange()
        initialRange.setStart(startR.startContainer, startR.startOffset)
        initialRange.setEnd(startR.startContainer, startR.startOffset)
        const expanded = expandToWordBoundaries(initialRange)
        const t = expanded.toString().trim()
        if (t) {
          log('initial selection', t)
          setSelectedText(t)
          setHighlightedText(t)
        }
      } else {
        warn('caretRangeAtPoint returned null at', pos)
        
        // iPhone fallback for initial selection
        if (isIPhone) {
          log('trying iPhone fallback for initial selection')
          try {
            const startElement = document.elementFromPoint(start.x, start.y)
            if (startElement && startElement.textContent) {
              // Find the text container
              let textContainer: Element | null = startElement
              while (textContainer && !textContainer.textContent) {
                textContainer = textContainer.parentElement
              }
              
              if (textContainer && textContainer.textContent) {
                const text = textContainer.textContent
                const containerRect = textContainer.getBoundingClientRect()
                const charIndex = Math.floor(((start.x - containerRect.left) / containerRect.width) * text.length)
                
                // Find word boundaries around the touch point
                let wordStart = charIndex
                let wordEnd = charIndex
                
                // Expand to word beginning
                while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
                  wordStart--
                }
                
                // Expand to word end
                while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
                  wordEnd++
                }
                
                const initialWord = text.substring(wordStart, wordEnd).trim()
                if (initialWord && initialWord.length > 2) {
                  log('iPhone initial selection fallback', initialWord)
                  setSelectedText(initialWord)
                  setHighlightedText(initialWord)
                }
              }
            }
          } catch (e) {
            log('iPhone initial selection fallback failed:', e)
          }
        }
      }
      // Also try a frame-later vibrate for WebKit quirks
      requestAnimationFrame(() => { if (!vibratedRef.current) tryVibrate() })
    }, longPressDelay)
    setLongPressTimer(timer)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture - prevent scrolling
      e.preventDefault()
      e.stopPropagation()
      
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      if (initialPinchDistance === null) {
        setInitialPinchDistance(currentDistance)
        setInitialZoomLevel(zoomLevel)
      } else {
        const scale = currentDistance / initialPinchDistance
        const newZoomLevel = Math.max(0.5, Math.min(2, initialZoomLevel * scale))
        setZoomLevel(newZoomLevel)
      }
      return
    }
    
    // If we were just pinching, reset the pinch state
    if (initialPinchDistance !== null) {
      setInitialPinchDistance(null)
    }
    
    const start = touchStartPosRef.current
    if (!start) return
    const touch = e.touches[0]
    if (isInSelectionMode) {
      log('touchmove in selection', { 
        startX: start.x, 
        startY: start.y, 
        currentX: touch.clientX, 
        currentY: touch.clientY,
        deltaX: touch.clientX - start.x,
        deltaY: touch.clientY - start.y
      })
      e.preventDefault()
      e.stopPropagation()
      if (!vibratedRef.current) tryVibrate()
      const t = handleLongPress(start.x, start.y, touch.clientX, touch.clientY)
      if (t) {
        setSelectedText(t)
        setHighlightedText(t)
      }
      if (textReaderRef.current && initialScrollTopRef.current !== null) {
        textReaderRef.current.scrollTop = initialScrollTopRef.current
      }
    } else if (isIPhone && longPressTimer) {
      // On iPhone, be more permissive with touch movement to allow native selection
      const distance = Math.hypot(touch.clientX - start.x, touch.clientY - start.y)
      if (distance > CANCEL_DISTANCE_PX * 2) { // More generous on iPhone
        log('longpress cancelled by move on iPhone', { distance })
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
        touchStartPosRef.current = null
      }
    } else if (longPressTimer) {
      const distance = Math.hypot(touch.clientX - start.x, touch.clientY - start.y)
      const currentScrollTop = textReaderRef.current ? textReaderRef.current.scrollTop : 0
      const scrollDelta = Math.abs(currentScrollTop - startScrollTopRef.current)
      log('pre-longpress move', { distance, scrollDelta })
      if (scrollDelta > 2 || distance > CANCEL_DISTANCE_PX) {
        log('longpress cancelled by move', { distance, scrollDelta })
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
        touchStartPosRef.current = null
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Always reset pinch state when touch ends
    setInitialPinchDistance(null)
    
    log('touchend', { inSelection: isInSelectionMode, selectedTextLength: selectedText.length })
    if (isInSelectionMode) {
      e.preventDefault()
      e.stopPropagation()
      if (!vibratedRef.current) attemptVibrateWithRetries(2, 120)
      restoreScrolling()
      setTimeout(() => restoreScrolling(), 50)
      if (selectedText && selectedText.length > 2) {
        log('show dialog for selection')
        setShowConfirmDialog(true)
      }
      setIsInSelectionMode(false)
      selectionModeRef.current = false
      vibratedRef.current = false
    }
    if (longPressTimer) {
      log('clear longpress timer')
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setTouchStartPos(null)
    touchStartPosRef.current = null
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setSelectedText('')
    setHighlightedText('')
    setIsInSelectionMode(false)
    selectionModeRef.current = false
    vibratedRef.current = false
    restoreScrolling()
    setTimeout(() => restoreScrolling(), 50)
    window.getSelection()?.removeAllRanges()
  }

  useEffect(() => {
    if (!isInSelectionMode) {
      restoreScrolling()
    }
  }, [isInSelectionMode])

  const handleExplain = () => {
    const context = extractContextInfo(selectedText, text, bookTitle, author)
    sessionStorage.setItem('chatContext', JSON.stringify({
      selectedText,
      contextInfo: context,
      bookTitle,
      author
    }))
    router.push('/chat')
    setShowConfirmDialog(false)
    setSelectedText('')
    setHighlightedText('')
  }

  const renderText = () => {
    let rendered: React.ReactNode = text
    rendered = renderTextWithSearchHighlight(typeof rendered === 'string' ? rendered : text)
    // Custom highlight during selection or while confirm dialog is open
    if ((isInSelectionMode || showConfirmDialog) && highlightedText) {
      const idx = text.indexOf(highlightedText)
      if (idx >= 0) {
        const before = text.slice(0, idx)
        const after = text.slice(idx + highlightedText.length)
        rendered = (
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            margin: 0, 
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit'
          }}>
            {before}
            <span className={styles.selectedText}>{highlightedText}</span>
            {after}
          </pre>
        )
      }
    }
    // Wrap the final rendered text in a pre tag to preserve formatting
    if (typeof rendered === 'string') {
      rendered = (
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          margin: 0, 
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit'
        }}>
          {rendered}
        </pre>
      )
    }
    return rendered
  }

  return (
    <div ref={textReaderRef} className={styles.textReader}>
      {/* Search Bar */}
      <div style={{
        position: 'sticky', top: '0px', padding: '4px 0', marginBottom: '8px',
        backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', zIndex: 50
      }}>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(searchQuery) }}
          style={{ width: '100%', padding: '4px 8px', margin: 0, border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', outline: 'none', backgroundColor: 'white' }}
        />
        {searchResults.length > 0 && (
          <div style={{ marginTop: '2px', fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{currentSearchIndex + 1} of {searchResults.length}</span>
            <button onClick={prevSearchResult} style={{ padding: '2px 6px', border: '1px solid #ddd', borderRadius: '2px', background: 'white', cursor: 'pointer', fontSize: '11px' }}>↑</button>
            <button onClick={nextSearchResult} style={{ padding: '2px 6px', border: '1px solid #ddd', borderRadius: '2px', background: 'white', cursor: 'pointer', fontSize: '11px' }}>↓</button>
            <button onClick={() => { setSearchQuery(''); handleSearch(''); setCurrentSearchIndex(-1) }} style={{ padding: '2px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', color: '#999' }}>clear</button>
          </div>
        )}
      </div>

      <div
        ref={textContentRef}
        className={styles.textContent}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          WebkitUserSelect: isIPhone ? 'text' : 'none', 
          userSelect: isIPhone ? 'text' : 'none', 
          WebkitTouchCallout: isIPhone ? 'default' : 'none', 
          WebkitTapHighlightColor: 'transparent',
          touchAction: isInSelectionMode ? 'none' : 'pan-y', fontFamily: settings.textFont,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          width: `${100 / zoomLevel}%`
        }}
      >
        {renderText()}
        

      </div>

      {showConfirmDialog && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxWidth: '400px' }}>
          <h3>Selected Text:</h3>
          <p style={{ margin: '10px 0', fontStyle: 'italic' }}>
            "{selectedText}"
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={handleCancel} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleExplain} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#007bff', color: 'white', cursor: 'pointer' }}>Explain</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileTextReader


