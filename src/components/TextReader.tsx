'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './TextReader.module.css'
import ChatInterface from './ChatInterface'
import { SettingsData } from './Settings'
import { ProfileData } from './Profile'

interface TextReaderProps {
  text: string
  bookTitle?: string
  author?: string
  settings: SettingsData
  profile: ProfileData
  onSettingsChange: (settings: SettingsData) => void
}

const TextReader: React.FC<TextReaderProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings, profile, onSettingsChange }) => {
  const [selectedText, setSelectedText] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const textContentRef = useRef<HTMLDivElement>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isInSelectionMode, setIsInSelectionMode] = useState(false)
  const [currentSelection, setCurrentSelection] = useState('')
  const [selectionRange, setSelectionRange] = useState<Range | null>(null)
  const [highlightedText, setHighlightedText] = useState<string>('')
  const [showChatInterface, setShowChatInterface] = useState(false)
  const [textToExplain, setTextToExplain] = useState('')
  const [contextInfo, setContextInfo] = useState<any>(null)

  const extractContextInfo = (selectedText: string, fullText: string) => {
    const selectedIndex = fullText.indexOf(selectedText)
    if (selectedIndex === -1) return null

    // Get surrounding text for context
    const beforeText = fullText.substring(Math.max(0, selectedIndex - 1000), selectedIndex)
    const afterText = fullText.substring(selectedIndex + selectedText.length, Math.min(fullText.length, selectedIndex + selectedText.length + 500))

    // Extract Act and Scene for Shakespeare plays
    let act: string | null = null
    let scene: string | null = null
    let speaker: string | null = null
    let charactersOnStage: string[] = []

    // Look backwards for Act/Scene markers
    const actMatch = beforeText.match(/ACT\s+([IVXLC]+)/i)
    if (actMatch) act = actMatch[1]
    
    const sceneMatch = beforeText.match(/SCENE\s+([IVXLC]+)/i)
    if (sceneMatch) scene = sceneMatch[1]

    // Look for speaker (name in caps followed by period)
    const speakerMatch = beforeText.match(/\n([A-Z][A-Z\s]+)\.\s*$/)
    if (speakerMatch) {
      speaker = speakerMatch[1].trim()
    }

    // Track characters entering and exiting to build current stage list
    const stageDirections = beforeText.match(/(?:Enter|Exit|Exeunt)\s+[^\.]+\./gi) || []
    const currentCharacters = new Set<string>()
    
    // Process all stage directions in order
    stageDirections.forEach(direction => {
      const isEnter = /^Enter/i.test(direction)
      const isExit = /^Exit/i.test(direction)
      const isExeunt = /^Exeunt/i.test(direction)
      
      // Extract character names
      const characterMatch = direction.match(/(?:Enter|Exit|Exeunt)\s+([^\.]+)\./i)
      if (characterMatch) {
        const characterList = characterMatch[1]
        const characters = characterList
          .split(/\s+and\s+|,\s*/)
          .map(c => c.trim().replace(/\.$/, ''))
          .filter(c => c.length > 0 && !c.toLowerCase().includes('servant') && !c.toLowerCase().includes('page'))
        
        if (isEnter) {
          characters.forEach(char => currentCharacters.add(char))
        } else if (isExit || isExeunt) {
          if (characterList.toLowerCase().includes('all') || isExeunt) {
            currentCharacters.clear()
          } else {
            characters.forEach(char => currentCharacters.delete(char))
          }
        }
      }
    })
    
    charactersOnStage = Array.from(currentCharacters)

    return {
      bookTitle,
      author,
      act,
      scene, 
      speaker,
      charactersOnStage,
      selectedText,
      beforeContext: beforeText.slice(-200), // Last 200 chars for context
      afterContext: afterText.slice(0, 200)   // First 200 chars for context
    }
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
      setShowConfirmDialog(true)
    }
  }

  const renderTextWithHighlight = () => {
    if (!isInSelectionMode || !highlightedText) {
      return text
    }
    
    const index = text.indexOf(highlightedText)
    if (index === -1) return text
    
    const before = text.slice(0, index)
    const highlighted = text.slice(index, index + highlightedText.length)
    const after = text.slice(index + highlightedText.length)
    
    return (
      <>
        {before}
        <span className={styles.selectedText}>{highlighted}</span>
        {after}
      </>
    )
  }

  const expandToWordBoundaries = (range: Range): Range => {
    const expandedRange = range.cloneRange()
    
    // Expand start to word boundary
    const startContainer = range.startContainer
    const startOffset = range.startOffset
    
    if (startContainer.nodeType === Node.TEXT_NODE) {
      const textContent = startContainer.textContent || ''
      let newStart = startOffset
      
      // Go backwards to find start of word
      while (newStart > 0 && /\w/.test(textContent[newStart - 1])) {
        newStart--
      }
      expandedRange.setStart(startContainer, newStart)
    }
    
    // Expand end to word boundary
    const endContainer = range.endContainer
    const endOffset = range.endOffset
    
    if (endContainer.nodeType === Node.TEXT_NODE) {
      const textContent = endContainer.textContent || ''
      let newEnd = endOffset
      
      // Go forwards to find end of word
      while (newEnd < textContent.length && /\w/.test(textContent[newEnd])) {
        newEnd++
      }
      expandedRange.setEnd(endContainer, newEnd)
    }
    
    return expandedRange
  }

  const handleLongPress = (startX: number, startY: number, endX: number, endY: number): string => {
    try {
      // Get ranges for start and end points
      const startRange = document.caretRangeFromPoint?.(startX, startY)
      const endRange = document.caretRangeFromPoint?.(endX, endY)
      
      if (!startRange || !endRange) {
        console.log('Could not create ranges')
        return ''
      }
      
      // Create a range spanning from start to end
      const range = document.createRange()
      range.setStart(startRange.startContainer, startRange.startOffset)
      range.setEnd(endRange.startContainer, endRange.startOffset)
      
      // Expand to word boundaries
      const expandedRange = expandToWordBoundaries(range)
      
      const text = expandedRange.toString().trim()
      setHighlightedText(text)
      console.log('Long press selection:', text)
      return text
    } catch (error) {
      console.log('Error in handleLongPress:', error)
      return ''
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const pos = { x: touch.clientX, y: touch.clientY }
    setTouchStartPos(pos)
    
    // Start long press timer
    const timer = setTimeout(() => {
      console.log('Long press triggered')
      setIsInSelectionMode(true)
      const initialText = handleLongPress(pos.x, pos.y, pos.x, pos.y)
      setCurrentSelection(initialText)
      // Show highlighting immediately
      setHighlightedText(initialText)
    }, 500) // 500ms long press
    
    setLongPressTimer(timer)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // If we were in selection mode, finalize the selection
    if (isInSelectionMode && currentSelection) {
      setSelectedText(currentSelection)
      setShowConfirmDialog(true)
      setIsInSelectionMode(false)
      setCurrentSelection('')
    }
    
    // Clear long press timer if still running
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    
    setTouchStartPos(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos) return
    
    const touch = e.touches[0]
    const distance = Math.sqrt(
      Math.pow(touch.clientX - touchStartPos.x, 2) + Math.pow(touch.clientY - touchStartPos.y, 2)
    )
    
    // If we're in selection mode, extend the selection
    if (isInSelectionMode) {
      const text = handleLongPress(touchStartPos.x, touchStartPos.y, touch.clientX, touch.clientY)
      setCurrentSelection(text || '')
    } else if (longPressTimer && distance > 10) {
      // Cancel long press if moved too much before selection started
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleExplain = () => {
    const context = extractContextInfo(selectedText, text)
    setContextInfo(context)
    setTextToExplain(selectedText)
    setShowChatInterface(true)
    setShowConfirmDialog(false)
    setSelectedText('')
  }

  const handleCloseChatInterface = () => {
    setShowChatInterface(false)
    setTextToExplain('')
    setContextInfo(null)
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setSelectedText('')
    setIsInSelectionMode(false)
    setCurrentSelection('')
    setSelectionRange(null)
    setHighlightedText('')
    window.getSelection()?.removeAllRanges()
  }

  return (
    <div className={styles.textReader}>
      <div 
        ref={textContentRef}
        className={styles.textContent}
        onMouseUp={handleTextSelection}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          WebkitUserSelect: window.ontouchstart !== undefined ? 'none' : 'text',
          userSelect: window.ontouchstart !== undefined ? 'none' : 'text',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          fontFamily: settings.textFont
        }}
      >
        {renderTextWithHighlight()}
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
          maxWidth: '400px'
        }}>
          <h3>Selected Text:</h3>
          <p style={{ margin: '10px 0', fontStyle: 'italic' }}>
            "{selectedText}"
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleExplain}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: '#007bff',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Explain
            </button>
          </div>
        </div>
      )}
      
      {showChatInterface && (
        <ChatInterface 
          selectedText={textToExplain}
          contextInfo={contextInfo}
          settings={settings}
          profile={profile}
          onClose={handleCloseChatInterface}
          onSettingsChange={onSettingsChange}
        />
      )}
    </div>
  )
}

export default TextReader