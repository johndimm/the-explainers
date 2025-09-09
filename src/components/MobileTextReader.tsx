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
  const [showPrevButton, setShowPrevButton] = useState(false)
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
    log('=== ANDROID TEXT SELECTION DEBUG ===')
    log('Input pos:', pos)
    
    // Use the browser's built-in text selection capabilities
    try {
      // Clear any existing selection
      window.getSelection()?.removeAllRanges()
      
      // Get the text element
      const textElement = textContentRef.current
      if (!textElement) {
        log('ERROR: No text element found')
        setDebugMessage('ERROR: No text element found')
        return
      }
      
      // Create a range at the touch point
      const range = document.caretRangeFromPoint(pos.x, pos.y)
      if (!range) {
        log('ERROR: Could not create range at point, trying fallback')
        setDebugMessage('ERROR: Could not create range at point, trying fallback')
        
        // Fallback: try to get element at point and find text
        const element = document.elementFromPoint(pos.x, pos.y)
        if (element && element.textContent) {
          log('Fallback: Found element with text content')
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
          log('Fallback selected word:', fallbackWord)
          
          if (fallbackWord && fallbackWord.length > 2) {
            androidSelectedWordRef.current = fallbackWord
            setDebugMessage(`Android fallback selected: "${fallbackWord}" - lift finger to confirm`)
            log('SUCCESS: Fallback word stored in ref')
            return
          }
        }
        
        setDebugMessage('ERROR: Both range and fallback failed')
        return
      }
      
      log('Range created:', range)
      log('Range start:', range.startContainer, range.startOffset)
      
      // Get the text content around the range
      const textContent = range.startContainer.textContent || ''
      log('Text content:', textContent.substring(0, 100))
      
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
      
      log('Range after expand:', range)
      log('Selected text:', range.toString())
      
      const selectedWord = range.toString().trim()
      log('Selected word:', selectedWord)
      
      if (selectedWord && selectedWord.length > 2) {
        // Store the word but don't show dialog yet
        androidSelectedWordRef.current = selectedWord
        setDebugMessage(`Android selected: "${selectedWord}" - lift finger to confirm`)
        log('SUCCESS: Word stored in ref')
      } else {
        log('ERROR: No valid word found')
        setDebugMessage('ERROR: No valid word found')
      }
      
    } catch (error) {
      log('ERROR in Android text selection:', error)
      setDebugMessage('ERROR in text selection')
    }
    
    log('=== END ANDROID DEBUG ===')
  }
  
  // Initialize zoom level from sessionStorage or default
  const [zoomLevel, setZoomLevel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('textReaderZoomLevel')
      return saved ? parseFloat(saved) : 1
    }
    return 1
  })
  
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollTime = useRef<number>(0)
  const scrollVelocityRef = useRef<number>(0)
  const lastScrollPosition = useRef<number>(0)

  // Save zoom level to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('textReaderZoomLevel', zoomLevel.toString())
    }
  }, [zoomLevel])

  // Handle scroll events to hide/show navigation buttons and prevent unwanted vibrations
  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now()
      const textReader = textReaderRef.current
      
      if (textReader) {
        // Calculate scroll velocity
        const currentPosition = textReader.scrollTop
        const timeDelta = now - lastScrollTime.current
        if (timeDelta > 0) {
          scrollVelocityRef.current = Math.abs(currentPosition - lastScrollPosition.current) / timeDelta
        }
        lastScrollPosition.current = currentPosition
      }
      
      lastScrollTime.current = now
      setIsScrolling(true)
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      // Wait longer if scroll velocity was high (momentum scrolling)
      const waitTime = scrollVelocityRef.current > 1 ? 2000 : 1000
      
      // Show buttons again after scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
        scrollVelocityRef.current = 0
      }, waitTime) // Wait 1-2 seconds after scrolling stops
    }

    const textReader = textReaderRef.current
    if (textReader) {
      textReader.addEventListener('scroll', handleScroll)
      return () => {
        textReader.removeEventListener('scroll', handleScroll)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [])

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
        
        log('Selection change check:', {
          hasSelection: !!selection,
          selectionText: selectedText,
          selectionLength: selectedText?.length || 0,
          selectionRangeCount: selection?.rangeCount || 0
        })
        
        if (selectedText && selectedText.length > 0) {
          log('Text selected via selection change:', selectedText)
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
    log('Touch start detected')

    // Handle multi-touch for zoom
    if (e.touches.length === 2) {
      log('Two finger touch detected - zoom mode')
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      e.currentTarget.setAttribute('data-initial-distance', initialDistance.toString())
      e.currentTarget.setAttribute('data-initial-zoom', zoomLevel.toString())
      e.currentTarget.setAttribute('data-zoom-mode', 'true')
      return // Exit early, don't do text selection or vibration
    }

    // Check if we recently stopped scrolling (within last 500ms)
    const timeSinceLastScroll = Date.now() - lastScrollTime.current
    const recentlyScrolled = timeSinceLastScroll < 500
    
    // Single touch - handle text selection
    // Only prime vibration if not scrolling and haven't recently scrolled
    if ('vibrate' in navigator && !e.currentTarget.hasAttribute('data-vibration-primed') && !isScrolling && !recentlyScrolled) {
      // Don't vibrate on initial touch anymore - wait for long press
      e.currentTarget.setAttribute('data-vibration-primed', 'true')
      log('Vibration API primed (no initial vibration)')
    }

    // Set up long press detection for vibration (only if not scrolling and haven't recently scrolled)
    if (!isScrolling && !recentlyScrolled) {
      const touchStartTime = Date.now()
      const touchStartX = e.touches[0].clientX
      const touchStartY = e.touches[0].clientY
      
      const longPressTimer = setTimeout(() => {
        // Double-check we're still not scrolling when timer fires
        if (!isScrolling && 'vibrate' in navigator) {
          // Also check if touch position hasn't moved much (to avoid vibrating during drag)
          const touchMoveThreshold = 10 // pixels
          const currentTouch = e.touches[0]
          if (currentTouch) {
            const deltaX = Math.abs(currentTouch.clientX - touchStartX)
            const deltaY = Math.abs(currentTouch.clientY - touchStartY)
            if (deltaX < touchMoveThreshold && deltaY < touchMoveThreshold) {
              navigator.vibrate(50)
              log('Vibration triggered on long press')
            }
          }
        }
      }, 700) // Increased to 700ms for long press to reduce accidental triggers

      e.currentTarget.setAttribute('data-long-press-timer', longPressTimer.toString())
      e.currentTarget.setAttribute('data-touch-start-x', touchStartX.toString())
      e.currentTarget.setAttribute('data-touch-start-y', touchStartY.toString())
    }
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
    log('Mouse up detected')
    
    // Prevent default browser behavior (Google search bar, etc.)
    e.preventDefault()
    e.stopPropagation()
    
    // Check for text selection
    setTimeout(() => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      
      if (selectedText && selectedText.length > 0) {
        log('Text selected via mouse up:', selectedText)
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
    log('Touch move detected, touches:', e.touches.length)
    
    // Clear any pending vibration timer if user is moving
    const timerId = e.currentTarget.getAttribute('data-long-press-timer')
    if (timerId) {
      clearTimeout(parseInt(timerId))
      e.currentTarget.removeAttribute('data-long-press-timer')
      log('Cancelled vibration timer due to touch move')
    }
    
    // Handle pinch to zoom
    if (e.touches.length === 2) {
      log('Two finger touch move - zoom mode')
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      const initialDistance = parseFloat(e.currentTarget.getAttribute('data-initial-distance') || '0')
      const initialZoom = parseFloat(e.currentTarget.getAttribute('data-initial-zoom') || '1')
      
      log('Zoom calculation:', { currentDistance, initialDistance, initialZoom })
      
      if (initialDistance > 0) {
        const scale = currentDistance / initialDistance
        const newZoom = Math.max(0.5, Math.min(3, initialZoom * scale))
        log('Setting zoom to:', newZoom)
        setZoomLevel(newZoom)
      }
    } else if (e.touches.length === 1) {
      // For single touch, check if movement exceeds threshold
      const touchStartX = parseFloat(e.currentTarget.getAttribute('data-touch-start-x') || '0')
      const touchStartY = parseFloat(e.currentTarget.getAttribute('data-touch-start-y') || '0')
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      
      const deltaX = Math.abs(currentX - touchStartX)
      const deltaY = Math.abs(currentY - touchStartY)
      
      // If user has moved more than 10 pixels, they're probably scrolling
      if (deltaX > 10 || deltaY > 10) {
        // Clear vibration timer if it exists
        const timerId = e.currentTarget.getAttribute('data-long-press-timer')
        if (timerId) {
          clearTimeout(parseInt(timerId))
          e.currentTarget.removeAttribute('data-long-press-timer')
          log('Cancelled vibration due to movement threshold')
        }
      }
    }
  }


  
  // Scroll mode page navigation functions
  const goToNextScrollPage = () => {
    if (pageMap.pages.length > 0 && currentPage < pageMap.pages.length - 1) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      setShowPrevButton(true) // Show previous button after first next click
      
      // Use a smaller scroll distance to avoid skipping content
      if (textReaderRef.current) {
        const currentScrollTop = textReaderRef.current.scrollTop
        const viewportHeight = textReaderRef.current.clientHeight
        
        textReaderRef.current.scrollTo({
          top: currentScrollTop + viewportHeight - 170, // Scroll by text reader height minus overlap
          behavior: 'smooth'
        })
      }
    }
  }
  
  const goToPrevScrollPage = () => {
    if (pageMap.pages.length > 0 && currentPage > 0) {
      const prevPage = currentPage - 1
      setCurrentPage(prevPage)
      
      // Use a smaller scroll distance to avoid skipping content
      if (textReaderRef.current) {
        const currentScrollTop = textReaderRef.current.scrollTop
        const viewportHeight = textReaderRef.current.clientHeight
        
        textReaderRef.current.scrollTo({
          top: Math.max(0, currentScrollTop - viewportHeight + 170), // Scroll by text reader height minus overlap
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
    renderTextWithSearchHighlight,
    clearSearch
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
      
      if (!textContainer || !endTextContainer || !textContainer.textContent || !endTextContainer.textContent) {
        log('could not find text containers')
        return ''
      }
      
      // Get text content and calculate character positions
      const text = textContainer.textContent
      const startRect = textContainer.getBoundingClientRect()
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
            <button onClick={clearSearch} style={{ padding: '2px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', color: '#999' }}>clear</button>
          </div>
        )}
      </div>

      <div
        ref={textContentRef}
        className={styles.textContent}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          WebkitUserSelect: 'text', 
          userSelect: 'text', 
          WebkitTouchCallout: 'none', 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'pan-y pinch-zoom', fontFamily: settings.textFont,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          width: `${100 / zoomLevel}%`,
          position: 'relative'
        }}
      >
        {/* Scroll mode page navigation zones - disabled to avoid interfering with text selection */}
        
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

      {/* Fixed navigation buttons */}
      {pageMap.pages.length > 0 && !isScrolling && (
        <>
          {/* Previous button - only show when showPrevButton is true */}
          {showPrevButton && currentPage > 0 && (
            <button
              onClick={goToPrevScrollPage}
              style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0, 123, 255, 0.15)',
                color: 'rgba(0, 0, 0, 0.2)',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000
              }}
            >
              ◀
            </button>
          )}

          {/* Next button - always show at bottom right when available */}
          {currentPage < pageMap.pages.length - 1 && (
            <button
              onClick={goToNextScrollPage}
              style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0, 123, 255, 0.15)',
                color: 'rgba(0, 0, 0, 0.2)',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000
              }}
            >
              ▶
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default MobileTextReader





