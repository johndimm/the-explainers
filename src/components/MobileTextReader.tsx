'use client'

import React, { useRef, useState, useEffect } from 'react'
import styles from './TextReader.module.css'
import ChatInterface from './ChatInterface'
import { ReaderCommonProps, useBookmarkRestoreAndSave, extractContextInfo } from './BaseTextReader'
import { MobileTextDisplay } from './mobile/MobileTextDisplay'
import ConfirmationPopup from './ConfirmationPopup'
import { 
  detectDevice, 
  handleTouchStart, 
  handleTouchMove, 
  handleTouchEnd,
  handleTextSelection,
  TouchPosition,
  PinchPosition 
} from '../utils/mobileUtils'
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
  const [touchStartPos, setTouchStartPos] = useState<TouchPosition | PinchPosition | null>(null)
  const [isInSelectionMode, setIsInSelectionMode] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatContext, setChatContext] = useState<any>(null)
  
  const [fontSize, setFontSize] = useState(settings.textFontSize)
  
  // Device detection
  const { isIPhone, isAndroid } = detectDevice()
  
  // Bookmark hook
  const { saveBookmark, loadBookmark } = useBookmarkRestoreAndSave(
    text.length, 
    bookTitle, 
    author
  )

  // Load bookmark on mount - temporarily disabled
  // useEffect(() => {
  //   const restoreBookmark = async () => {
  //     const bookmark = await loadBookmark()
  //     if (bookmark) {
  //       setFontSize(bookmark.fontSize)
  //       // Restore scroll position
  //       if (textReaderRef.current) {
  //         textReaderRef.current.scrollTop = bookmark.position
  //       }
  //     }
  //   }
  //   
  //   restoreBookmark()
  // }, [text, loadBookmark])

  // Save bookmark on scroll - temporarily disabled
  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (textReaderRef.current) {
  //       const scrollTop = textReaderRef.current.scrollTop
  //       saveBookmark(scrollTop, fontSize)
  //     }
  //   }

  //   const textReader = textReaderRef.current
  //   if (textReader) {
  //     textReader.addEventListener('scroll', handleScroll, { passive: true })
  //     return () => textReader.removeEventListener('scroll', handleScroll)
  //   }
  // }, [saveBookmark, fontSize])

  // Touch event handlers
  const handleTouchStartEvent = (e: React.TouchEvent) => {
    handleTouchStart(e, setTouchStartPos, longPressTimer, setIsInSelectionMode)
  }

  const handleTouchMoveEvent = (e: React.TouchEvent) => {
    handleTouchMove(e, touchStartPos, isInSelectionMode, setIsInSelectionMode, longPressTimer)
    
    // Handle pinch-to-zoom for font size
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      if (touchStartPos && 'distance' in touchStartPos) {
        const scale = distance / (touchStartPos as PinchPosition).distance
        if (scale > 1.1) {
          handleFontSizeChange(fontSize + 1)
          setTouchStartPos({ x: touch1.clientX, y: touch1.clientY, distance })
        } else if (scale < 0.9) {
          handleFontSizeChange(fontSize - 1)
          setTouchStartPos({ x: touch1.clientX, y: touch1.clientY, distance })
        }
      } else if (touchStartPos) {
        setTouchStartPos({ x: touch1.clientX, y: touch1.clientY, distance })
      }
    }
  }

  const handleTouchEndEvent = (e: React.TouchEvent) => {
    handleTouchEnd(longPressTimer, setTouchStartPos, setIsInSelectionMode)
  }

  const handleTextSelectionEvent = () => {
    const selection = window.getSelection()
    if (!selection || selection.toString().trim() === '') return
    
    const selectedText = selection.toString().trim()
    if (selectedText.length === 0) return
    
    setSelectedText(selectedText)
    setShowConfirmation(true)
  }

  // Handle confirmation to explain
  const handleConfirmExplain = () => {
    // Extract context information
    if (textReaderRef.current) {
      const contextInfo = extractContextInfo(
        selectedText,
        textReaderRef.current.textContent || '',
        bookTitle,
        author
      )
      setChatContext(contextInfo)
    }
    
    setShowConfirmation(false)
    setShowChatModal(true)
  }

  // Font size adjustment
  const handleFontSizeChange = (newFontSize: number) => {
    setFontSize(Math.max(12, Math.min(24, newFontSize)))
    onSettingsChange({ ...settings, textFontSize: newFontSize })
  }



  return (
    <div className={styles.mobileReaderContainer}>
      <MobileTextDisplay
        text={text}
        fontSize={fontSize}
        isInSelectionMode={isInSelectionMode}
        onTouchStart={handleTouchStartEvent}
        onTouchMove={handleTouchMoveEvent}
        onTouchEnd={handleTouchEndEvent}
        onTextSelection={handleTextSelectionEvent}
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
              contextInfo={chatContext}
              profile={profile}
              onClose={() => setShowChatModal(false)}
            />
          </div>
        </div>
      )}

      {/* Confirmation Popup */}
      <ConfirmationPopup
        isOpen={showConfirmation}
        title="Explain Selected Text"
        message={`"${selectedText}"`}
        confirmText="Explain"
        cancelText="Cancel"
        onConfirm={handleConfirmExplain}
        onCancel={() => setShowConfirmation(false)}
        type="info"
        variant="modal"
      />
    </div>
  )
}

export default MobileTextReader