'use client'

import React, { useRef, useState, useEffect } from 'react'
import styles from './TextReader.module.css'
import ChatInterface from './ChatInterface'
import { ReaderCommonProps, useBookmarkRestoreAndSave, useSearchCore } from './BaseTextReader'
import { DesktopSearchBar } from './desktop/DesktopSearchBar'
import { DesktopTextDisplay } from './desktop/DesktopTextDisplay'
import { DesktopControls } from './desktop/DesktopControls'
import { PageMap, calculatePageContent } from '../utils/pageUtils'
import { log } from '../utils/log'

const DesktopTextReader: React.FC<ReaderCommonProps> = ({ 
  text, 
  bookTitle = 'Romeo and Juliet', 
  author = 'William Shakespeare', 
  settings, 
  profile, 
  onSettingsChange 
}) => {
  // Refs
  const textReaderRef = useRef<HTMLDivElement>(null)
  const textContentRef = useRef<HTMLDivElement>(null)
  
  // State
  const [selectedText, setSelectedText] = useState('')
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatContext, setChatContext] = useState<any>(null)
  const [fontSize, setFontSize] = useState(settings.textFontSize)
  
  // Page navigation state
  const [pageMap, setPageMap] = useState<PageMap>({ pages: [], pageRanges: [] })
  const [currentPage, setCurrentPage] = useState(0)
  const pageHeight = 600
  
  // Bookmark and search hooks
  const { saveBookmark, loadBookmark } = useBookmarkRestoreAndSave(
    text.length, 
    bookTitle, 
    author
  )
  
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    currentSearchIndex,
    handleSearch,
    nextSearchResult,
    prevSearchResult,
    renderTextWithSearchHighlight,
    clearSearch
  } = useSearchCore(text, textReaderRef, textContentRef)

  // Update font size when settings change
  useEffect(() => {
    setFontSize(settings.textFontSize)
  }, [settings.textFontSize])

  // Calculate page content when text or font size changes
  useEffect(() => {
    if (text && textReaderRef.current) {
      const containerWidth = textReaderRef.current.clientWidth || 800
      const lineHeight = fontSize * 1.5
      const charsPerLine = Math.floor(containerWidth / (fontSize * 0.6))
      
      const newPageMap = calculatePageContent(text, pageHeight, lineHeight, charsPerLine)
      setPageMap(newPageMap)
    }
  }, [text, fontSize])

  // Load bookmark on mount
  useEffect(() => {
    const restoreBookmark = async () => {
      const bookmark = await loadBookmark()
      if (bookmark) {
        setFontSize(bookmark.fontSize)
        // Navigate to the page containing the bookmark position
        const targetPage = Math.floor((bookmark.position / text.length) * pageMap.pages.length)
        setCurrentPage(Math.max(0, Math.min(targetPage, pageMap.pages.length - 1)))
      }
    }
    
    restoreBookmark()
  }, [text, pageMap.pages.length, loadBookmark])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Font size controls
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault()
            handleIncreaseFont()
            break
          case '-':
            e.preventDefault()
            handleDecreaseFont()
            break
          case '0':
            e.preventDefault()
            handleResetFont()
            break
          case 'f':
            e.preventDefault()
            // Focus search input
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
            searchInput?.focus()
            break
        }
      }
      
      // Search navigation
      if (e.key === 'F3' || (e.shiftKey && e.key === 'F3')) {
        e.preventDefault()
        if (e.shiftKey) {
          prevSearchResult()
        } else {
          nextSearchResult()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, { passive: true })
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [fontSize])

  // Font size handlers
  const handleFontSizeChange = (newFontSize: number) => {
    const clampedSize = Math.max(12, Math.min(24, newFontSize))
    setFontSize(clampedSize)
    onSettingsChange({ ...settings, textFontSize: clampedSize })
  }

  const handleIncreaseFont = () => {
    handleFontSizeChange(fontSize + 2)
  }

  const handleDecreaseFont = () => {
    handleFontSizeChange(fontSize - 2)
  }

  const handleResetFont = () => {
    handleFontSizeChange(18)
  }

  // Text selection handler
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.toString().trim() === '') return
    
    const selectedText = selection.toString().trim()
    if (selectedText.length === 0) return
    
    setSelectedText(selectedText)
    setShowChatModal(true)
  }

  return (
    <div className={styles.desktopReaderContainer}>
      <DesktopSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={() => handleSearch(searchQuery)}
        searchResults={searchResults}
        currentSearchIndex={currentSearchIndex}
        onNextSearch={nextSearchResult}
        onPrevSearch={prevSearchResult}
        onClearSearch={clearSearch}
      />
      
      <DesktopControls
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        onIncreaseFont={handleIncreaseFont}
        onDecreaseFont={handleDecreaseFont}
        onResetFont={handleResetFont}
      />
      
      <DesktopTextDisplay
        text={text}
        pageMap={pageMap}
        currentPage={currentPage}
        fontSize={fontSize}
        onTextSelection={handleTextSelection}
        renderTextWithSearchHighlight={renderTextWithSearchHighlight}
        textReaderRef={textReaderRef}
        textContentRef={textContentRef}
      />
      
      {showChatModal && (
        <div className={styles.chatModal}>
          <div className={styles.chatModalContent}>
            <button
              onClick={() => setShowChatModal(false)}
              className={styles.closeChatButton}
            >
              ×
            </button>
            <ChatInterface
              selectedText={selectedText}
              bookTitle={bookTitle}
              author={author}
              isPageMode={false}
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DesktopTextReader