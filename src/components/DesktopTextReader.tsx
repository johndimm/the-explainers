'use client'

import React, { useRef, useState } from 'react'
import styles from './TextReader.module.css'
import ChatInterface from './ChatInterface'
import { ReaderCommonProps, useBookmarkRestoreAndSave, useSearchCore, extractContextInfo, calculatePageContent, estimateCharsPerLine, PageMap, buildCharacterMapForText } from './BaseTextReader'
import { useRouter } from 'next/navigation'
import { log } from '../utils/log'

const DesktopTextReader: React.FC<ReaderCommonProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings, profile, onSettingsChange }) => {
  log('desktop', 'DesktopTextReader rendering with text length:', text?.length)
  const router = useRouter()
  const textReaderRef = useRef<HTMLDivElement>(null)
  const textContentRef = useRef<HTMLDivElement>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatContext, setChatContext] = useState<any>(null)
  
  // Page calculation state for scroll navigation
  const [pageMap, setPageMap] = useState<PageMap>({ pages: [], pageRanges: [] })
  const [currentPage, setCurrentPage] = useState(0)
  const pageHeight = 600 // Default page height in pixels

  useBookmarkRestoreAndSave(textReaderRef, text, bookTitle, author)
  
  // Global mouse up listener to catch selections that extend outside the text content
  React.useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Don't interfere with input fields, buttons, or other interactive elements
      const target = e.target as HTMLElement
      if (target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'SELECT' ||
        target.contentEditable === 'true' ||
        target.closest('input, textarea, button, select, [contenteditable]')
      )) {
        return // Don't handle mouseup on interactive elements
      }

      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection()
        const t = selection?.toString().trim() || ''
        log('desktop', 'DesktopTextReader: global mouseup selection', { text: t, length: t.length, hasSelection: !!selection })
        
        if (t.length > 0) {
          console.log('🔍 SETTING SELECTED TEXT (DESKTOP):', JSON.stringify(t))
          setSelectedText(t)
          setShowConfirmDialog(true)
        } else {
          // Only clear selection if no text was selected (single click)
          window.getSelection()?.removeAllRanges()
        }
      }, 10)
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])
  
  // Calculate pages for scroll navigation and build character map
  React.useEffect(() => {
    if (textReaderRef.current && text) {
      const containerWidth = textReaderRef.current.clientWidth
      const fontSize = parseInt(getComputedStyle(textReaderRef.current).fontSize) || 16
      const lineHeight = parseInt(getComputedStyle(textReaderRef.current).lineHeight) || 24
      const charsPerLine = estimateCharsPerLine(containerWidth, fontSize, settings.textFont)
      
      const calculatedPageMap = calculatePageContent(text, pageHeight, lineHeight, charsPerLine)
      setPageMap(calculatedPageMap)
      setCurrentPage(0)
      log('desktop', 'DesktopTextReader: calculated pages for scroll navigation', { pageCount: calculatedPageMap.pages.length, charsPerLine, lineHeight })
      
      // Build character map for Shakespeare plays
      buildCharacterMapForText(text)
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


  const handleCancel = () => {
    setShowConfirmDialog(false)
    setSelectedText('')
    window.getSelection()?.removeAllRanges()
  }

  const handleExplain = () => {
    console.log('🔍 HANDLE EXPLAIN DEBUG:')
    console.log('selectedText state:', JSON.stringify(selectedText))
    console.log('selectedText length:', selectedText?.length)
    const context = extractContextInfo(selectedText, text, bookTitle, author)
    const chatData = { selectedText, contextInfo: context, bookTitle, author }
    setChatContext(chatData)
    setShowChatModal(true)
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
    renderTextWithSearchHighlight,
    clearSearch
  } = useSearchCore(text, textReaderRef, textContentRef, goToPage, pageMap)

  // Listen for header search events
  React.useEffect(() => {
    const handleHeaderSearch = (event: CustomEvent) => {
      console.log('DesktopTextReader: Received headerSearch event:', event.detail)
      if (event.detail.type === 'text') {
        console.log('DesktopTextReader: Processing text search for:', event.detail.query)
        setSearchQuery(event.detail.query)
        handleSearch(event.detail.query)
      }
    }

    const handleHeaderSearchNext = (event: CustomEvent) => {
      if (event.detail.type === 'text') {
        console.log('DesktopTextReader: Next search result')
        nextSearchResult()
      }
    }

    const handleHeaderSearchPrev = (event: CustomEvent) => {
      if (event.detail.type === 'text') {
        console.log('DesktopTextReader: Previous search result')
        prevSearchResult()
      }
    }

    window.addEventListener('headerSearch', handleHeaderSearch as EventListener)
    window.addEventListener('headerSearchNext', handleHeaderSearchNext as EventListener)
    window.addEventListener('headerSearchPrev', handleHeaderSearchPrev as EventListener)
    
    return () => {
      window.removeEventListener('headerSearch', handleHeaderSearch as EventListener)
      window.removeEventListener('headerSearchNext', handleHeaderSearchNext as EventListener)
      window.removeEventListener('headerSearchPrev', handleHeaderSearchPrev as EventListener)
    }
  }, [handleSearch, nextSearchResult, prevSearchResult])

  // Dispatch search result updates to header
  React.useEffect(() => {
    if (typeof window !== 'undefined' && searchResults.length > 0) {
      window.dispatchEvent(new CustomEvent('searchResultUpdate', {
        detail: {
          type: 'text',
          currentIndex: currentSearchIndex,
          totalResults: searchResults.length
        }
      }))
    }
  }, [currentSearchIndex, searchResults.length])

  return (
    <div ref={textReaderRef} className={styles.textReader}>

      <div
        ref={textContentRef}
        className={styles.textContent}
        style={{ 
          userSelect: 'text', 
          fontFamily: settings.textFont, 
          position: 'relative',
          '--text-font-size': `${settings.textFontSize}px`
        } as React.CSSProperties}
      >

        
        <pre style={{ 
          whiteSpace: 'pre-line', 
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          margin: 0, 
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit'
        }}>
          {renderTextWithSearchHighlight(text, false, 0, false)}
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

      {/* Chat Modal */}
      {showChatModal && (
        <ChatInterface
          selectedText={chatContext?.selectedText || ""}
          contextInfo={chatContext?.contextInfo || null}
          settings={settings}
          profile={profile}
          onClose={() => {
            // Store context for page chat to use
            if (chatContext) {
              sessionStorage.setItem('chatContext', JSON.stringify(chatContext))
            }
            setShowChatModal(false)
          }}
          onSettingsChange={onSettingsChange}
          bookTitle={chatContext?.bookTitle || bookTitle}
          author={chatContext?.author || author}
          isPageMode={false}
        />
      )}
    </div>
  )
}

export default DesktopTextReader





