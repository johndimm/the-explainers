'use client'

import React, { useRef, useState, useEffect } from 'react'
import styles from './TextReader.module.css'
import { ReaderCommonProps, useBookmarkRestoreAndSave, useSearchCore, extractContextInfo, calculatePageContent, estimateCharsPerLine, PageMap } from './BaseTextReader'
import { useRouter } from 'next/navigation'
import { log, warn } from '../utils/log'

const MobileTextReader: React.FC<ReaderCommonProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings, profile, onSettingsChange }) => {
  log('MobileTextReader rendering with text length:', text?.length)
  const router = useRouter()
  const textReaderRef = useRef<HTMLDivElement>(null)
  const textContentRef = useRef<HTMLDivElement>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isInSelectionMode, setIsInSelectionMode] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  
  // Page calculation state for scroll navigation
  const [pageMap, setPageMap] = useState<PageMap>({ pages: [], pageRanges: [] })
  const [currentPage, setCurrentPage] = useState(0)
  const pageHeight = 600 // Default page height in pixels
  
  // Device detection - only for iPhone-specific fallbacks
  const isIPhone = /iPhone|iPod/.test(navigator.userAgent)
  
  // Text selection state
  const [highlightedText, setHighlightedText] = useState('')
  const selectionModeRef = useRef(false)
  const initialScrollTopRef = useRef<number | null>(null)
  const vibratedRef = useRef(false)
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1)

  useBookmarkRestoreAndSave(textReaderRef, text, bookTitle, author)
  
  // Calculate pages for scroll navigation
  useEffect(() => {
    if (textReaderRef.current) {
      const containerWidth = textReaderRef.current.clientWidth
      const fontSize = parseInt(getComputedStyle(textReaderRef.current).fontSize) || 16
      const lineHeight = parseInt(getComputedStyle(textReaderRef.current).lineHeight) || 24
      const charsPerLine = estimateCharsPerLine(containerWidth, fontSize, settings.textFont)
      
      const calculatedPageMap = calculatePageContent(text, pageHeight, lineHeight, charsPerLine)
      setPageMap(calculatedPageMap)
      setCurrentPage(0)
      log('MobileTextReader: calculated pages for scroll navigation', { pageCount: calculatedPageMap.pages.length, charsPerLine, lineHeight })
    }
  }, [text, settings.textFont, pageHeight])

  // Track scroll position and update currentPage accordingly
  useEffect(() => {
    const textReader = textReaderRef.current
    if (!textReader || pageMap.pageRanges.length === 0) return

    const handleScroll = () => {
      const scrollTop = textReader.scrollTop
      const lineHeight = parseInt(getComputedStyle(textReader).lineHeight) || 24
      
      // Calculate which page we're currently viewing based on scroll position
      const currentLine = Math.floor(scrollTop / lineHeight)
      const currentCharPosition = currentLine * (estimateCharsPerLine(textReader.clientWidth, parseInt(getComputedStyle(textReader).fontSize) || 16, settings.textFont))
      
      // Find which page contains this position
      let newCurrentPage = 0
      for (let i = 0; i < pageMap.pageRanges.length; i++) {
        if (currentCharPosition >= pageMap.pageRanges[i].start && currentCharPosition < pageMap.pageRanges[i].end) {
          newCurrentPage = i
          break
        }
      }
      
      if (newCurrentPage !== currentPage) {
        setCurrentPage(newCurrentPage)
      }
    }

    textReader.addEventListener('scroll', handleScroll)
    return () => textReader.removeEventListener('scroll', handleScroll)
  }, [pageMap.pageRanges, currentPage, settings.textFont])

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setSelectedText('')
    setHighlightedText('')
    setIsInSelectionMode(false)
    selectionModeRef.current = false
    if (textReaderRef.current) {
      textReaderRef.current.style.overflowY = 'auto'
      ;(textReaderRef.current as HTMLElement).style.setProperty('overscroll-behavior', 'auto')
    }
  }

  const handleExplain = () => {
    const context = extractContextInfo(selectedText, text, bookTitle, author)
    sessionStorage.setItem('chatContext', JSON.stringify({ selectedText, contextInfo: context, bookTitle, author }))
    router.push('/chat')
    setShowConfirmDialog(false)
    setSelectedText('')
    setHighlightedText('')
    setIsInSelectionMode(false)
    selectionModeRef.current = false
    if (textReaderRef.current) {
      textReaderRef.current.style.overflowY = 'auto'
      ;(textReaderRef.current as HTMLElement).style.setProperty('overscroll-behavior', 'auto')
    }
  }
  
  // Scroll mode page navigation functions
  const goToNextScrollPage = () => {
    if (pageMap.pages.length > 0 && currentPage < pageMap.pages.length - 1) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      
      // Use a more conservative approach - scroll by a reasonable amount
      if (textReaderRef.current) {
        const currentScrollTop = textReaderRef.current.scrollTop
        const viewportHeight = textReaderRef.current.clientHeight
        
        // Scroll down by approximately one viewport height, but not more than needed
        const targetScrollTop = Math.min(
          currentScrollTop + viewportHeight * 0.8, // Scroll down by 80% of viewport
          textReaderRef.current.scrollHeight - viewportHeight // Don't scroll past the end
        )
        
        textReaderRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        })
      }
    }
  }
  
  const goToPrevScrollPage = () => {
    if (pageMap.pages.length > 0 && currentPage > 0) {
      const prevPage = currentPage - 1
      setCurrentPage(prevPage)
      
      // Use a more conservative approach - scroll by a reasonable amount
      if (textReaderRef.current) {
        const currentScrollTop = textReaderRef.current.scrollTop
        const viewportHeight = textReaderRef.current.clientHeight
        
        // Scroll up by approximately one viewport height, but not more than needed
        const targetScrollTop = Math.max(
          currentScrollTop - viewportHeight * 0.8, // Scroll up by 80% of viewport
          0 // Don't scroll past the beginning
        )
        
        textReaderRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        })
      }
    }
  }

  const goToPage = (pageNum: number) => {
    if (pageNum >= 0 && pageNum < pageMap.pages.length) {
      setCurrentPage(pageNum)
    }
  }

  // Now that goToPage is defined, we can use it in useSearchCore
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
  } = useSearchCore(text, textReaderRef, textContentRef, goToPage, pageMap)

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
                      document.elementFromPoint?.(endY, endY)?.ownerDocument?.createRange?.()
      
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
      
      if (comparison <= 0) {
        // startRange comes before endRange
        range.setStart(startRange.startContainer, startRange.startOffset)
        range.setEnd(endRange.endContainer, endRange.endOffset)
      } else {
        // endRange comes before startRange
        range.setStart(endRange.startContainer, endRange.startOffset)
        range.setEnd(startRange.endContainer, startRange.endOffset)
      }
      
      const expandedRange = expandToWordBoundaries(range)
      const selectedText = expandedRange.toString().trim()
      
      if (selectedText.length > 2) {
        log('handleLongPress: selected text', { text: selectedText, length: selectedText.length })
        return selectedText
      }
      
      return ''
    } catch (error) {
      log('handleLongPress error:', error)
      return ''
    }
  }

  const handleLongPressIPhone = (startX: number, startY: number, endX: number, endY: number): string => {
    try {
      log('handleLongPressIPhone called')
      
      const startElement = document.elementFromPoint(startX, startY)
      const endElement = document.elementFromPoint(endX, endY)
      
      if (!startElement || !endElement) {
        log('elementFromPoint returned null')
        return ''
      }
      
      // Find the text container
      let startTextContainer: Element | null = startElement
      while (startTextContainer && !startTextContainer.textContent) {
        startTextContainer = startTextContainer.parentElement
      }
      
      let endTextContainer: Element | null = endElement
      while (endTextContainer && !endTextContainer.textContent) {
        endTextContainer = endTextContainer.parentElement
      }
      
      if (!startTextContainer || !endTextContainer || !startTextContainer.textContent || !endTextContainer.textContent) {
        log('could not find text containers')
        return ''
      }
      
      // Get text content and calculate character positions
      const text = startTextContainer.textContent
      const startRect = startTextContainer.getBoundingClientRect()
      const endRect = endTextContainer.getBoundingClientRect()
      
      const startCharIndex = Math.floor(((startX - startRect.left) / startRect.width) * text.length)
      const endCharIndex = Math.floor(((endX - endRect.left) / endRect.width) * text.length)
      
      // Ensure start is before end
      const actualStart = Math.min(startCharIndex, endCharIndex)
      const actualEnd = Math.max(startCharIndex, endCharIndex)
      
      // Expand to word boundaries
      let wordStart = actualStart
      let wordEnd = actualEnd
      
      while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
        wordStart--
      }
      
      while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
        wordEnd++
      }
      
      const selectedText = text.substring(wordStart, wordEnd).trim()
      
      if (selectedText.length > 2) {
        log('iPhone fallback: selected text', { text: selectedText, length: selectedText.length })
        return selectedText
      }
      
      return ''
    } catch (error) {
      log('handleLongPressIPhone error:', error)
      return ''
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const pos = { x: touch.clientX, y: touch.clientY }
      setTouchStartPos(pos)
      
      // Start long press timer for swipe selection
      const timer = setTimeout(() => {
        log('MobileTextReader: longpress fired')
        setIsInSelectionMode(true)
        selectionModeRef.current = true
        vibratedRef.current = false
        
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
        handleSearch('')
        
        // Create initial word selection at press point so user doesn't need to drag
        const startR = caretRangeAtPoint(pos.x, pos.y)
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
              const startElement = document.elementFromPoint(pos.x, pos.y)
              if (startElement && startElement.textContent) {
                // Find the text container
                let textContainer: Element | null = startElement
                while (textContainer && !textContainer.textContent) {
                  textContainer = textContainer.parentElement
                }
                
                if (textContainer && textContainer.textContent) {
                  const text = textContainer.textContent
                  const containerRect = textContainer.getBoundingClientRect()
                  const charIndex = Math.floor(((pos.x - containerRect.left) / containerRect.width) * text.length)
                  
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
      }, 400)
      
      longPressTimer.current = timer
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos || !isInSelectionMode) return
    
    const touch = e.touches[0]
    const distance = Math.hypot(touch.clientX - touchStartPos.x, touch.clientY - touchStartPos.y)
    
    if (distance > 10) { // Minimum distance to trigger selection
      try {
        // Get text range from start to current position
        const startRange = document.caretRangeFromPoint?.(touchStartPos.x, touchStartPos.y) || 
                          (document as any).caretPositionFromPoint?.(touchStartPos.x, touchStartPos.y)
        const endRange = document.caretRangeFromPoint?.(touch.clientX, touch.clientY) || 
                        (document as any).caretPositionFromPoint?.(touch.clientX, touch.clientY)
        
        if (startRange && endRange) {
          const range = document.createRange()
          
          // Always create range from left to right regardless of swipe direction
          const startX = touchStartPos.x
          const endX = touch.clientX
          
          if (startX <= endX) {
            // Left to right swipe
            range.setStart(startRange.startContainer, startRange.startOffset)
            range.setEnd(endRange.startContainer, endRange.endOffset)
          } else {
            // Right to left swipe
            range.setStart(endRange.startContainer, endRange.startOffset)
            range.setEnd(startRange.startContainer, startRange.startOffset)
          }
          
          const text = range.toString().trim()
          if (text) {
            setSelectedText(text)
            log('MobileTextReader: selected text via swipe', { text, length: text.length })
          }
        }
      } catch (error) {
        log('MobileTextReader: error in touch move', error)
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    if (isInSelectionMode && selectedText.length > 2) {
      log('MobileTextReader: show dialog for swipe selection')
      setShowConfirmDialog(true)
    }
    
    setIsInSelectionMode(false)
    setTouchStartPos(null)
  }

  const renderText = () => {
    if (highlightedText) {
      return renderTextWithSearchHighlight(highlightedText, false)
    }
    return renderTextWithSearchHighlight(text, false)
  }

  return (
    <div ref={textReaderRef} className={styles.textReader}>
      {/* Search Bar */}
      <div style={{
        position: 'sticky', top: '0px', padding: '8px 0', marginBottom: '16px',
        backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(searchQuery) }}
            style={{ flex: 1, padding: '4px 8px', margin: 0, border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', outline: 'none', backgroundColor: 'white' }}
          />
        </div>
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
          width: `${100 / zoomLevel}%`,
          position: 'relative'
        }}
      >
        {/* Scroll mode page navigation zones - always visible when pages are available */}
        {pageMap.pages.length > 0 && (
          <>
            {/* Left side - Previous page */}
            <div
              onClick={goToPrevScrollPage}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '25%',
                height: '100%',
                cursor: 'pointer',
                zIndex: 10,
                opacity: 0.3,
                backgroundColor: 'transparent'
              }}
              title="Click to go to previous page"
            />
            {/* Right side - Next page */}
            <div
              onClick={goToNextScrollPage}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: '25%',
                height: '100%',
                cursor: 'pointer',
                zIndex: 10,
                opacity: 0.3,
                backgroundColor: 'transparent'
              }}
              title="Click to go to next page"
            />
          </>
        )}
        
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
