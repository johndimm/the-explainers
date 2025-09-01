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
  const [debugMessage, setDebugMessage] = useState('')
  
  // Page calculation state for scroll navigation
  const [pageMap, setPageMap] = useState<PageMap>({ pages: [], pageRanges: [] })
  const [currentPage, setCurrentPage] = useState(0)
  const pageHeight = 600 // Default page height in pixels
  
  // Device detection - only for iPhone-specific fallbacks
  const isIPhone = /iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)
  
  // Text selection state
  const [highlightedText, setHighlightedText] = useState('')
  const selectionModeRef = useRef(false)
  const initialScrollTopRef = useRef<number | null>(null)
  const vibratedRef = useRef(false)
  const androidSelectedWordRef = useRef<string>('') // Store Android selected word
  
  // Simple Android text selection function
  const selectAndroidWord = (pos: { x: number; y: number }) => {
    console.log('=== ANDROID TEXT SELECTION DEBUG ===')
    console.log('Input pos:', pos)
    
    // Use the browser's built-in text selection capabilities
    try {
      // Clear any existing selection
      window.getSelection()?.removeAllRanges()
      
      // Get the text element
      const textElement = textContentRef.current
      if (!textElement) {
        console.log('ERROR: No text element found')
        setDebugMessage('ERROR: No text element found')
        return
      }
      
      // Create a range at the touch point
      const range = document.caretRangeFromPoint(pos.x, pos.y)
      if (!range) {
        console.log('ERROR: Could not create range at point, trying fallback')
        setDebugMessage('ERROR: Could not create range at point, trying fallback')
        
        // Fallback: try to get element at point and find text
        const element = document.elementFromPoint(pos.x, pos.y)
        if (element && element.textContent) {
          console.log('Fallback: Found element with text content')
          const fallbackText = element.textContent
          const rect = element.getBoundingClientRect()
          const charIndex = Math.floor(((pos.x - rect.left) / rect.width) * fallbackText.length)
          
          // Find word boundaries
          let wordStart = charIndex
          let wordEnd = charIndex
          
          while (wordStart > 0 && /\w/.test(fallbackText[wordStart - 1])) {
            wordStart--
          }
          
          while (wordEnd < fallbackText.length && /\w/.test(fallbackText[wordEnd])) {
            wordEnd++
          }
          
          const fallbackWord = fallbackText.substring(wordStart, wordEnd).trim()
          console.log('Fallback selected word:', fallbackWord)
          
          if (fallbackWord && fallbackWord.length > 2) {
            androidSelectedWordRef.current = fallbackWord
            setDebugMessage(`Android fallback selected: "${fallbackWord}" - lift finger to confirm`)
            console.log('SUCCESS: Fallback word stored in ref')
            return
          }
        }
        
        setDebugMessage('ERROR: Both range and fallback failed')
        return
      }
      
      console.log('Range created:', range)
      console.log('Range start:', range.startContainer, range.startOffset)
      
      // Get the text content around the range
      const textContent = range.startContainer.textContent || ''
      console.log('Text content:', textContent.substring(0, 100))
      
      // Find word boundaries manually
      let wordStart = range.startOffset
      let wordEnd = range.startOffset
      
      // Expand to word beginning
      while (wordStart > 0 && /\w/.test(textContent[wordStart - 1])) {
        wordStart--
      }
      
      // Expand to word end
      while (wordEnd < textContent.length && /\w/.test(textContent[wordEnd])) {
        wordEnd++
      }
      
      // Set the range to the word boundaries
      range.setStart(range.startContainer, wordStart)
      range.setEnd(range.startContainer, wordEnd)
      
      console.log('Range after expand:', range)
      console.log('Selected text:', range.toString())
      
      const selectedWord = range.toString().trim()
      console.log('Selected word:', selectedWord)
      
      if (selectedWord && selectedWord.length > 2) {
        // Store the word but don't show dialog yet
        androidSelectedWordRef.current = selectedWord
        setDebugMessage(`Android selected: "${selectedWord}" - lift finger to confirm`)
        console.log('SUCCESS: Word stored in ref')
      } else {
        console.log('ERROR: No valid word found')
        setDebugMessage('ERROR: No valid word found')
      }
      
    } catch (error) {
      console.log('ERROR in Android text selection:', error)
      setDebugMessage('ERROR in text selection')
    }
    
    console.log('=== END ANDROID DEBUG ===')
  }
  
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

  // Add global selection change listener for text selection detection
  useEffect(() => {
    let selectionTimeout: NodeJS.Timeout | null = null
    
    const handleSelectionChange = () => {
      // Clear any existing timeout
      if (selectionTimeout) {
        clearTimeout(selectionTimeout)
      }
      
      // Wait longer for the selection to be complete
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection()
        const selectedText = selection?.toString().trim()
        
        console.log('Selection change check:', {
          hasSelection: !!selection,
          selectionText: selectedText,
          selectionLength: selectedText?.length || 0,
          selectionRangeCount: selection?.rangeCount || 0
        })
        
        if (selectedText && selectedText.length > 0) {
          console.log('Text selected via selection change:', selectedText)
          setSelectedText(selectedText)
          setShowConfirmDialog(true)
          // Clear the selection after showing the dialog
          window.getSelection()?.removeAllRanges()
        }
      }, 1500) // Wait 1.5 seconds for selection to be complete
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (selectionTimeout) {
        clearTimeout(selectionTimeout)
      }
    }
  }, [])

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

  // Simple native text selection handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('Touch start detected')
    
    // Prime the vibration API on first touch (like the test button)
    if (navigator.vibrate && !e.currentTarget.hasAttribute('data-vibration-primed')) {
      navigator.vibrate(10) // Very subtle first vibration
      e.currentTarget.setAttribute('data-vibration-primed', 'true')
      console.log('Vibration API primed')
    }
    
    // Set up long press detection for vibration
    const longPressTimer = setTimeout(() => {
      // Use the same direct vibration approach as the test button
      if (navigator.vibrate) {
        navigator.vibrate(50)
        console.log('Vibration triggered on long press')
      }
    }, 500) // 500ms for long press
    
    // Store the timer so we can clear it on touch end
    e.currentTarget.setAttribute('data-long-press-timer', longPressTimer.toString())
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear the long press timer
    const timerId = e.currentTarget.getAttribute('data-long-press-timer')
    if (timerId) {
      clearTimeout(parseInt(timerId))
      e.currentTarget.removeAttribute('data-long-press-timer')
    }
  }

  // Add global event listener to prevent browser selection behavior
  useEffect(() => {
    const preventSelectionBehavior = (e: Event) => {
      // Prevent the browser's default text selection behavior
      if (e.type === 'selectionchange') {
        const selection = window.getSelection()
        if (selection && selection.toString().trim()) {
          // Clear any browser selection UI
          setTimeout(() => {
            if (selection.toString().trim()) {
              // Our dialog will handle this
            }
          }, 10)
        }
      }
    }

    document.addEventListener('selectionchange', preventSelectionBehavior)
    
    return () => {
      document.removeEventListener('selectionchange', preventSelectionBehavior)
    }
  }, [])

  const handleMouseUp = (e: React.MouseEvent) => {
    console.log('Mouse up detected')
    
    // Prevent default browser behavior (Google search bar, etc.)
    e.preventDefault()
    e.stopPropagation()
    
    // Check for text selection
    setTimeout(() => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      
      if (selectedText && selectedText.length > 0) {
        console.log('Text selected via mouse up:', selectedText)
        setSelectedText(selectedText)
        setShowConfirmDialog(true)
        // Clear the selection after showing the dialog
        window.getSelection()?.removeAllRanges()
      }
    }, 100)
  }

  const handleTouchEndSimple = (e: React.TouchEvent) => {
    setDebugMessage('SIMPLE TOUCH END FIRED!')
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // Check if we have a selection after touch moves
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim()
    
    if (selectedText && selectedText.length > 0) {
      console.log('Text selected during touch move:', selectedText)
      setSelectedText(selectedText)
      setShowConfirmDialog(true)
      // Clear the selection after showing the dialog
      window.getSelection()?.removeAllRanges()
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
      
      // Find the text container - look for the pre element that contains the actual text
      let textContainer: Element | null = startElement
      while (textContainer && textContainer.tagName !== 'PRE') {
        textContainer = textContainer.parentElement
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

  const renderText = () => {
    // Always render the full text with search highlighting
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
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          WebkitUserSelect: 'text', 
          userSelect: 'text', 
          WebkitTouchCallout: 'none', 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'pan-y', fontFamily: settings.textFont,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          width: `${100 / zoomLevel}%`,
          position: 'relative'
        }}
      >
        {/* Scroll mode page navigation zones - disabled to avoid interfering with text selection */}
        {/* 
        {pageMap.pages.length > 0 && (
          <>
            <div
              onClick={goToPrevScrollPage}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '10%',
                height: '100%',
                cursor: 'pointer',
                zIndex: 10,
                opacity: 0.3,
                backgroundColor: 'transparent'
              }}
              title="Click to go to previous page"
            />
            <div
              onClick={goToNextScrollPage}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: '10%',
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
        */}
        
        {renderText()}
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
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ margin: '0 0 10px 0', flexShrink: 0 }}>Selected Text:</h3>
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            marginBottom: '15px',
            border: '1px solid #eee',
            borderRadius: '4px',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            maxHeight: '60vh'
          }}>
            <p style={{ margin: 0, fontStyle: 'italic', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              "{selectedText}"
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'flex-end',
            flexShrink: 0
          }}>
            <button onClick={handleCancel} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleExplain} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#007bff', color: 'white', cursor: 'pointer' }}>Explain</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileTextReader





