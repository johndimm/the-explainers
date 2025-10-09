'use client'

import React, { useRef, useState, useEffect } from 'react'
import styles from './TextReader.module.css'
import ChatInterface from './ChatInterface'
import { ReaderCommonProps, useBookmarkRestoreAndSave, useSearchCore, extractContextInfo, calculatePageContent, estimateCharsPerLine, PageMap, buildCharacterMapForText } from './BaseTextReader'
import { useRouter } from 'next/navigation'
import { log } from '../utils/log'

const DesktopTextReader: React.FC<ReaderCommonProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings, profile, onSettingsChange }) => {
  console.log('🔍 DESKTOP: Component rendered!')
  log('desktop', 'DesktopTextReader rendering with text length:', text?.length)
  log('desktop', 'DesktopTextReader component rendered!')
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
  
  // Cache computed styles to avoid forced reflow
  const [cachedStyles, setCachedStyles] = useState<{
    fontSize: number
    lineHeight: number
    clientWidth: number
  } | null>(null)
  
  // Store scroll position to avoid reading it during scroll events
  const scrollPositionRef = useRef(0)

  // Font size state for keyboard controls
  const [currentFontSize, setCurrentFontSize] = useState(settings.textFontSize)
  console.log('🔍 DESKTOP: Initial font size setup', { 
    settingsFontSize: settings.textFontSize, 
    currentFontSize 
  })

  // Update font size when settings change
  useEffect(() => {
    console.log('🔍 SETTINGS CHANGED:', { from: currentFontSize, to: settings.textFontSize })
    setCurrentFontSize(settings.textFontSize)
  }, [settings.textFontSize])

  // Save bookmark when font size changes
  useEffect(() => {
    log('desktop', 'Font size change effect triggered', { 
      currentFontSize, 
      settingsFontSize: settings.textFontSize,
      areDifferent: currentFontSize !== settings.textFontSize
    })
    console.log('🔍 DESKTOP: Font size change effect triggered', { 
      currentFontSize, 
      settingsFontSize: settings.textFontSize,
      areDifferent: currentFontSize !== settings.textFontSize
    })
    if (currentFontSize !== settings.textFontSize) {
      log('desktop', 'Font sizes are different, triggering bookmark save')
      console.log('🔍 DESKTOP: Font sizes are different, triggering bookmark save')
      // Trigger a bookmark save when font size changes
      const timeoutId = setTimeout(() => {
        if (textReaderRef.current) {
          const scrollPosition = textReaderRef.current.scrollTop
          log('desktop', 'Triggering scroll to save bookmark', { scrollPosition })
          console.log('🔍 DESKTOP: Triggering scroll to save bookmark', { scrollPosition })
          // This will trigger the scroll handler which saves the bookmark
          textReaderRef.current.scrollTop = scrollPosition + 1
          textReaderRef.current.scrollTop = scrollPosition
          log('desktop', 'Scroll triggered for bookmark save')
          console.log('🔍 DESKTOP: Scroll triggered for bookmark save')
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [currentFontSize, settings.textFontSize])

  // Keyboard shortcuts for font size
  useEffect(() => {
    console.log('🔍 DESKTOP: Setting up keyboard shortcuts for font size')
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('🔍 DESKTOP: Key pressed', { 
        key: e.key, 
        ctrlKey: e.ctrlKey, 
        metaKey: e.metaKey,
        currentFontSize 
      })
      
      // Test: log every key press
      if (e.key === '=' || e.key === '+' || e.key === '-') {
        console.log('🔍 DESKTOP: Plus/Minus key detected!', e.key)
      }
      // Ctrl/Cmd + Plus to increase font size
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        const newFontSize = Math.min(currentFontSize + 1, 24)
        log('desktop', 'Font size increase requested', { currentFontSize, newFontSize })
        console.log('🔍 DESKTOP: Font size increase requested', { currentFontSize, newFontSize })
        if (newFontSize !== currentFontSize) {
          log('desktop', 'Updating font size', { from: currentFontSize, to: newFontSize })
          console.log('🔍 DESKTOP: Updating font size', { from: currentFontSize, to: newFontSize })
          setCurrentFontSize(newFontSize)
          onSettingsChange({
            ...settings,
            textFontSize: newFontSize
          })
          log('desktop', 'Font size updated and settings changed')
          console.log('🔍 DESKTOP: Font size updated and settings changed')
        }
      }
      // Ctrl/Cmd + Minus to decrease font size
      else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        const newFontSize = Math.max(currentFontSize - 1, 12)
        log('desktop', 'Font size decrease requested', { currentFontSize, newFontSize })
        console.log('🔍 DESKTOP: Font size decrease requested', { currentFontSize, newFontSize })
        if (newFontSize !== currentFontSize) {
          log('desktop', 'Updating font size', { from: currentFontSize, to: newFontSize })
          console.log('🔍 DESKTOP: Updating font size', { from: currentFontSize, to: newFontSize })
          setCurrentFontSize(newFontSize)
          onSettingsChange({
            ...settings,
            textFontSize: newFontSize
          })
          log('desktop', 'Font size updated and settings changed')
          console.log('🔍 DESKTOP: Font size updated and settings changed')
        }
      }
    }

    // Try both document and textReaderRef
    document.addEventListener('keydown', handleKeyDown)
    if (textReaderRef.current) {
      textReaderRef.current.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (textReaderRef.current) {
        textReaderRef.current.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [currentFontSize, settings, onSettingsChange])

  log('desktop', ' Calling useBookmarkRestoreAndSave with currentFontSize:', currentFontSize)
  useBookmarkRestoreAndSave(textReaderRef, text, bookTitle, author, false, undefined, undefined, undefined, settings, onSettingsChange, currentFontSize)
  
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
log('ui','🔍 SETTING SELECTED TEXT (DESKTOP):', JSON.stringify(t))
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
  
  // Cache computed styles to avoid forced reflow
  React.useEffect(() => {
    if (textReaderRef.current) {
      const containerWidth = textReaderRef.current.clientWidth
      const fontSize = parseInt(getComputedStyle(textReaderRef.current).fontSize) || 16
      const lineHeight = parseInt(getComputedStyle(textReaderRef.current).lineHeight) || 24
      
      setCachedStyles({
        fontSize,
        lineHeight,
        clientWidth: containerWidth
      })
    }
  }, [settings.textFont])

  // Calculate pages for scroll navigation and build character map
  React.useEffect(() => {
    if (textReaderRef.current && text && cachedStyles) {
      const charsPerLine = estimateCharsPerLine(cachedStyles.clientWidth, currentFontSize, settings.textFont)
      
      const calculatedPageMap = calculatePageContent(text, pageHeight, cachedStyles.lineHeight, charsPerLine)
      setPageMap(calculatedPageMap)
      setCurrentPage(0)
      log('desktop', 'DesktopTextReader: calculated pages for scroll navigation', { pageCount: calculatedPageMap.pages.length, charsPerLine, lineHeight: cachedStyles.lineHeight })
      
      // Build character map for Shakespeare plays
      buildCharacterMapForText(text)
    }
  }, [text, settings.textFont, pageHeight, currentFontSize])

  // Track scroll position and update currentPage accordingly
  React.useEffect(() => {
    const textReader = textReaderRef.current
    if (!textReader || pageMap.pageRanges.length === 0) return

    let scrollTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      // Store scroll position without reading layout properties
      scrollPositionRef.current = textReader.scrollTop
      
      // Debounce scroll events to prevent excessive calculations
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      
      scrollTimeout = setTimeout(() => {
        // Use requestAnimationFrame to avoid forced reflow
        requestAnimationFrame(() => {
          if (cachedStyles) {
            const lineHeight = cachedStyles.lineHeight
            
            // Calculate which page we're currently viewing based on scroll position
            const currentLine = Math.floor(scrollPositionRef.current / lineHeight)
            const currentCharPosition = currentLine * (estimateCharsPerLine(cachedStyles.clientWidth, currentFontSize, settings.textFont))
          
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
        })
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
log('ui','🔍 HANDLE EXPLAIN DEBUG:')
log('ui','selectedText state:', JSON.stringify(selectedText))
log('ui','selectedText length:', selectedText?.length)
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
        // Use requestAnimationFrame to avoid forced reflow
        requestAnimationFrame(() => {
          const viewportHeight = textReaderRef.current!.clientHeight
          
          // Scroll down by approximately one viewport height, but not more than needed
          const targetScrollTop = Math.min(
            currentScrollTop + viewportHeight * 0.8, // Scroll down by 80% of viewport
            textReaderRef.current!.scrollHeight - viewportHeight // Don't scroll past the end
          )
          
          textReaderRef.current!.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          })
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
        // Use requestAnimationFrame to avoid forced reflow
        requestAnimationFrame(() => {
          const viewportHeight = textReaderRef.current!.clientHeight
          
          // Scroll up by approximately one viewport height, but not more than needed
          const targetScrollTop = Math.max(
            currentScrollTop - viewportHeight * 0.8, // Scroll up by 80% of viewport
            0 // Don't scroll past the beginning
          )
          
          textReaderRef.current!.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          })
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
log('ui','DesktopTextReader: Received headerSearch event:', event.detail)
      if (event.detail.type === 'text') {
log('ui','DesktopTextReader: Processing text search for:', event.detail.query)
        setSearchQuery(event.detail.query)
        handleSearch(event.detail.query)
      }
    }

    const handleHeaderSearchNext = (event: CustomEvent) => {
      if (event.detail.type === 'text') {
log('ui','DesktopTextReader: Next search result')
        nextSearchResult()
      }
    }

    const handleHeaderSearchPrev = (event: CustomEvent) => {
      if (event.detail.type === 'text') {
log('ui','DesktopTextReader: Previous search result')
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
    <>
      
      <div 
        ref={textReaderRef} 
        className={styles.textReader}
        tabIndex={0}
        onKeyDown={(e) => {
          console.log('🔍 DESKTOP: Direct keydown on textReader', { 
            key: e.key, 
            ctrlKey: e.ctrlKey, 
            metaKey: e.metaKey 
          })
          
          // Ctrl/Cmd + Plus to increase font size
          if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
            e.preventDefault()
            const newFontSize = Math.min(currentFontSize + 1, 24)
            console.log('🔍 DESKTOP: Font size increase via direct handler', { currentFontSize, newFontSize })
            if (newFontSize !== currentFontSize) {
              setCurrentFontSize(newFontSize)
              onSettingsChange({
                ...settings,
                textFontSize: newFontSize
              })
            }
          }
          // Ctrl/Cmd + Minus to decrease font size
          else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
            e.preventDefault()
            const newFontSize = Math.max(currentFontSize - 1, 12)
            console.log('🔍 DESKTOP: Font size decrease via direct handler', { currentFontSize, newFontSize })
            if (newFontSize !== currentFontSize) {
              setCurrentFontSize(newFontSize)
              onSettingsChange({
                ...settings,
                textFontSize: newFontSize
              })
            }
          }
        }}
      >
        <div
        ref={textContentRef}
        className={styles.textContent}
        style={{ 
          userSelect: 'text', 
          fontFamily: settings.textFont, 
          position: 'relative',
          '--text-font-size': `${currentFontSize}px`
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
    </>
  )
}

export default DesktopTextReader





