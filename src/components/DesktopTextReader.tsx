'use client'

import React, { useRef, useState, useEffect } from 'react'
import styles from './TextReader.module.css'
import ChatInterface from './ChatInterface'
import { ReaderCommonProps, useBookmarkRestoreAndSave, extractContextInfo } from './BaseTextReader'
import { DesktopTextDisplay } from './desktop/DesktopTextDisplay'
import { PageMap, calculatePageContent } from '../utils/pageUtils'
import { log } from '../utils/log'
import ConfirmationPopup from './ConfirmationPopup'

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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatContext, setChatContext] = useState<any>(null)
  const [fontSize, setFontSize] = useState(settings.textFontSize)
  
  // Bookmark hook
  const { saveBookmark, loadBookmark } = useBookmarkRestoreAndSave(
    text.length, 
    bookTitle, 
    author
  )

  // Update font size when settings change
  useEffect(() => {
    setFontSize(settings.textFontSize)
  }, [settings.textFontSize])

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
  //   textReader.addEventListener('scroll', handleScroll, { passive: true })
  //     return () => textReader.removeEventListener('scroll', handleScroll)
  //   }
  // }, [saveBookmark, fontSize])

  // Listen for text selection events from the global handler
  useEffect(() => {
    const handleTextSelected = (event: CustomEvent) => {
      const selectedText = event.detail.text;
      if (selectedText && selectedText.length > 0) {
        setSelectedText(selectedText);
        setShowConfirmation(true);
      }
    };

    document.addEventListener('textSelected', handleTextSelected as EventListener);
    
    return () => {
      document.removeEventListener('textSelected', handleTextSelected as EventListener);
    };
  }, [])

  // Font size handlers for keyboard shortcuts
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
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, { passive: true })
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [fontSize])


  // Text selection handler
  const handleTextSelection = () => {
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

  return (
    <div className={styles.desktopReaderContainer}>
      <DesktopTextDisplay
        text={text}
        fontSize={fontSize}
        onTextSelection={handleTextSelection}
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

export default DesktopTextReader