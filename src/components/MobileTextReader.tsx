'use client'

import React, { useRef, useState, useEffect } from 'react'
import styles from './TextReader.module.css'
import ChatInterface from './ChatInterface'
import { ReaderCommonProps, useBookmarkRestoreAndSave, useSearchCore } from './BaseTextReader'
import { MobileSearchBar } from './mobile/MobileSearchBar'
import { MobilePageNavigation } from './mobile/MobilePageNavigation'
import { MobileTextDisplay } from './mobile/MobileTextDisplay'
import { 
  detectDevice, 
  calculateMobilePageContent, 
  handleTouchStart, 
  handleTouchMove, 
  handleTouchEnd,
  handleTextSelection,
  TouchPosition 
} from '../utils/mobileUtils'
import { PageMap } from '../utils/pageUtils'
import { log } from '../utils/log'

const MobileTextReader: React.FC<ReaderCommonProps> = ({ 
  text, 
  bookTitle = 'Romeo and Juliet', 
  author = 'William Shakespeare', 
  settings, 
  profile, 
  onSettingsChange 
}) => {
  log('mobile', 'MobileTextReader rendering with text length:', text?.length)
  
  // Refs
  const textReaderRef = useRef<HTMLDivElement>(null)
  const textContentRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  
  // State
  const [selectedText, setSelectedText] = useState('')
  const [touchStartPos, setTouchStartPos] = useState<TouchPosition | null>(null)
  const [isInSelectionMode, setIsInSelectionMode] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatContext, setChatContext] = useState<any>(null)
  
  // Page navigation state
  const [pageMap, setPageMap] = useState<PageMap>({ pages: [], pageRanges: [] })
  const [currentPage, setCurrentPage] = useState(0)
  const [fontSize, setFontSize] = useState(settings.textFontSize)
  
  // Device detection
  const { isIPhone, isAndroid } = detectDevice()
  
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

  // Calculate page content when text or settings change
  useEffect(() => {
    if (text && textReaderRef.current) {
      const containerWidth = textReaderRef.current.clientWidth || 320
      const pageHeight = 600
      const lineHeight = fontSize * 1.5
      
      const newPageMap = calculateMobilePageContent(text, pageHeight, fontSize, lineHeight, containerWidth)
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

  // Touch event handlers
  const handleTouchStartEvent = (e: React.TouchEvent) => {
    handleTouchStart(e, setTouchStartPos, longPressTimer, setIsInSelectionMode)
  }

  const handleTouchMoveEvent = (e: React.TouchEvent) => {
    handleTouchMove(e, touchStartPos, isInSelectionMode, setIsInSelectionMode, longPressTimer)
  }

  const handleTouchEndEvent = (e: React.TouchEvent) => {
    handleTouchEnd(longPressTimer, setTouchStartPos, setIsInSelectionMode)
  }

  const handleTextSelectionEvent = () => {
    handleTextSelection(
      textReaderRef,
      setSelectedText,
      setShowChatModal,
      setChatContext,
      () => null // Context extraction will be handled by ChatInterface
    )
  }

  // Page navigation handlers
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < pageMap.pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Font size adjustment
  const handleFontSizeChange = (newFontSize: number) => {
    setFontSize(Math.max(12, Math.min(24, newFontSize)))
    onSettingsChange({ ...settings, textFontSize: newFontSize })
  }

  const showPrevButton = currentPage > 0
  const showNextButton = currentPage < pageMap.pages.length - 1

  return (
    <div className={styles.mobileReaderContainer}>
      <MobileSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={() => handleSearch(searchQuery)}
        searchResults={searchResults}
        currentSearchIndex={currentSearchIndex}
        onNextSearch={nextSearchResult}
        onPrevSearch={prevSearchResult}
        onClearSearch={clearSearch}
      />
      
      <MobilePageNavigation
        currentPage={currentPage}
        totalPages={pageMap.pages.length}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        showPrevButton={showPrevButton}
        showNextButton={showNextButton}
      />
      
      <MobileTextDisplay
        text={text}
        pageMap={pageMap}
        currentPage={currentPage}
        fontSize={fontSize}
        isInSelectionMode={isInSelectionMode}
        onTouchStart={handleTouchStartEvent}
        onTouchMove={handleTouchMoveEvent}
        onTouchEnd={handleTouchEndEvent}
        onTextSelection={handleTextSelectionEvent}
        renderTextWithSearchHighlight={renderTextWithSearchHighlight}
        textReaderRef={textReaderRef}
        textContentRef={textContentRef}
      />
      
      <div className={styles.mobileControls}>
        <button
          onClick={() => handleFontSizeChange(fontSize - 2)}
          disabled={fontSize <= 12}
          className={styles.fontSizeButton}
        >
          A-
        </button>
        <span className={styles.fontSizeDisplay}>{fontSize}px</span>
        <button
          onClick={() => handleFontSizeChange(fontSize + 2)}
          disabled={fontSize >= 24}
          className={styles.fontSizeButton}
        >
          A+
        </button>
      </div>
      
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

export default MobileTextReader