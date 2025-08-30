'use client'

import React, { useRef, useState } from 'react'
import styles from './TextReader.module.css'
import { ReaderCommonProps, useBookmarkRestoreAndSave, useSearchCore, extractContextInfo } from './BaseTextReader'
import { useRouter } from 'next/navigation'
import { log } from '../utils/log'

const DesktopTextReader: React.FC<ReaderCommonProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings, profile, onSettingsChange }) => {
  log('DesktopTextReader rendering with text length:', text?.length)
  const router = useRouter()
  const textReaderRef = useRef<HTMLDivElement>(null)
  const textContentRef = useRef<HTMLDivElement>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isInSelectionMode, setIsInSelectionMode] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

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

  const handleMouseUp = () => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection()
      const t = selection?.toString().trim() || ''
      log('DesktopTextReader: mouseup selection', { text: t, length: t.length, hasSelection: !!selection })
      if (t.length > 0) {
        setSelectedText(t)
        setShowConfirmDialog(true)
      }
    }, 10)
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setSelectedText('')
    window.getSelection()?.removeAllRanges()
  }

  const handleExplain = () => {
    const context = extractContextInfo(selectedText, text, bookTitle, author)
    sessionStorage.setItem('chatContext', JSON.stringify({ selectedText, contextInfo: context, bookTitle, author }))
    router.push('/chat')
    setShowConfirmDialog(false)
    setSelectedText('')
  }

  // Touch gesture handlers for swipe text selection
  const handleTouchStart = (e: React.TouchEvent) => {
    log('DesktopTextReader: touchstart', { touches: e.touches.length })
    const touch = e.touches[0]
    const pos = { x: touch.clientX, y: touch.clientY }
    setTouchStartPos(pos)
    
    // Start long press timer for swipe selection
    const timer = setTimeout(() => {
      log('DesktopTextReader: longpress fired')
      setIsInSelectionMode(true)
    }, 400)
    longPressTimer.current = timer
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
            log('DesktopTextReader: selected text via swipe', { text, length: text.length })
          }
        }
      } catch (error) {
        log('DesktopTextReader: error in touch move', error)
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    if (isInSelectionMode && selectedText.length > 2) {
      log('DesktopTextReader: show dialog for swipe selection')
      setShowConfirmDialog(true)
    }
    
    setIsInSelectionMode(false)
    setTouchStartPos(null)
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
          onMouseDown={() => {
            // Clear any previous selection when starting a new selection
            window.getSelection()?.removeAllRanges()
          }}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ userSelect: 'text', fontFamily: settings.textFont }}
        >
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          margin: 0, 
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit'
        }}>
          {renderTextWithSearchHighlight(text)}
        </pre>
        

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

export default DesktopTextReader


