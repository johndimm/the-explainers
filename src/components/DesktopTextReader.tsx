'use client'

import React, { useRef, useState } from 'react'
import styles from './TextReader.module.css'
import { ReaderCommonProps, useBookmarkRestoreAndSave, useSearchCore, extractContextInfo, calculatePageContent, estimateCharsPerLine, PageMap } from './BaseTextReader'
import { useRouter } from 'next/navigation'
import { log } from '../utils/log'

const DesktopTextReader: React.FC<ReaderCommonProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings, profile, onSettingsChange }) => {
  log('DesktopTextReader rendering with text length:', text?.length)
  const router = useRouter()
  const textReaderRef = useRef<HTMLDivElement>(null)
  const textContentRef = useRef<HTMLDivElement>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  
  // Page calculation state for scroll navigation
  const [pageMap, setPageMap] = useState<PageMap>({ pages: [], pageRanges: [] })
  const [currentPage, setCurrentPage] = useState(0)
  const pageHeight = 600 // Default page height in pixels

  useBookmarkRestoreAndSave(textReaderRef, text, bookTitle, author)
  
  // Calculate pages for scroll navigation
  React.useEffect(() => {
    if (textReaderRef.current) {
      const containerWidth = textReaderRef.current.clientWidth
      const fontSize = parseInt(getComputedStyle(textReaderRef.current).fontSize) || 16
      const lineHeight = parseInt(getComputedStyle(textReaderRef.current).lineHeight) || 24
      const charsPerLine = estimateCharsPerLine(containerWidth, fontSize, settings.textFont)
      
      const calculatedPageMap = calculatePageContent(text, pageHeight, lineHeight, charsPerLine)
      setPageMap(calculatedPageMap)
      setCurrentPage(0)
      log('DesktopTextReader: calculated pages for scroll navigation', { pageCount: calculatedPageMap.pages.length, charsPerLine, lineHeight })
    }
  }, [text, settings.textFont, pageHeight])

  // Track scroll position and update currentPage accordingly
  React.useEffect(() => {
    const textReader = textReaderRef.current
    if (!textReader || pageMap.pageRanges.length === 0) return

    let scrollTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      // Debounce scroll events to prevent excessive calculations
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      
      scrollTimeout = setTimeout(() => {
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
      }, 100) // Debounce scroll events by 100ms
    }

    textReader.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      textReader.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [pageMap.pageRanges, currentPage, settings.textFont])

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

  return (
    <div ref={textReaderRef} className={styles.textReader}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e9ecef' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="Search in text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => handleSearch(searchQuery)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: '#007bff',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Search
          </button>
        </div>
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
        style={{ userSelect: 'text', fontFamily: settings.textFont, position: 'relative' }}
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
          {renderTextWithSearchHighlight(text, false)}
        </pre>
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

export default DesktopTextReader





