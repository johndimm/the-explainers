'use client'

import React, { useEffect, useRef, useState } from 'react'
import styles from './TextReader.module.css'
import { ReaderCommonProps, useBookmarkRestoreAndSave, useSearchCore, extractContextInfo } from './BaseTextReader'
import { useRouter } from 'next/navigation'
import { log, warn } from '../utils/log'

const MobileTextReader: React.FC<ReaderCommonProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings, profile, onSettingsChange }) => {
  console.log('MobileTextReader rendering with:', { textLength: text?.length, bookTitle, author })
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
      const startRange = caretRangeAtPoint(startX, startY)
      const endRange = caretRangeAtPoint(endX, endY)
      if (!startRange || !endRange) return ''
      const range = document.createRange()
      const comparison = startRange.compareBoundaryPoints(Range.START_TO_START, endRange)
      if (comparison <= 0) {
        range.setStart(startRange.startContainer, startRange.startOffset)
        range.setEnd(endRange.startContainer, endRange.endOffset)
      } else {
        range.setStart(endRange.startContainer, endRange.startOffset)
        range.setEnd(startRange.startContainer, startRange.startOffset)
      }
      const expandedRange = expandToWordBoundaries(range)
      const t = expandedRange.toString().trim()
      if (!t) return ''
      setHighlightedText(t)
      return t
    } catch {
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
    log('touchstart', { touches: e.touches.length })
    window.getSelection()?.removeAllRanges()
    const touch = e.touches[0]
    const pos = { x: touch.clientX, y: touch.clientY }
    setTouchStartPos(pos)
    touchStartPosRef.current = pos
    startScrollTopRef.current = textReaderRef.current ? textReaderRef.current.scrollTop : 0
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
      }
      // Also try a frame-later vibrate for WebKit quirks
      requestAnimationFrame(() => { if (!vibratedRef.current) tryVibrate() })
    }, 400)
    setLongPressTimer(timer)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const start = touchStartPosRef.current
    if (!start) return
    const touch = e.touches[0]
    if (isInSelectionMode) {
      log('touchmove in selection')
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
        position: 'sticky', top: '0px', padding: '8px 0', marginBottom: '16px',
        backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', zIndex: 50
      }}>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(searchQuery) }}
          style={{ width: '100%', padding: '6px 12px', margin: 0, border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
        />
        {searchResults.length > 0 && (
          <div style={{ marginTop: '4px', fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent',
          touchAction: isInSelectionMode ? 'none' : 'pan-y', fontFamily: settings.textFont
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


