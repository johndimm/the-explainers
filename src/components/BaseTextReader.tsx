'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSettings } from '../contexts/SettingsContext'
import styles from './TextReader.module.css'
import { debugStorage, debugReader } from '../utils/debug'

interface BaseTextReaderProps {
  text: string
  bookTitle: string
  author: string
  onTextSelect?: (selectedText: string) => void
}

const BaseTextReader = ({ 
  text, 
  bookTitle, 
  author, 
  onTextSelect 
}: BaseTextReaderProps) => {
  const { settings } = useSettings()
  const [selectedText, setSelectedText] = useState('')
  const [baseReaderId] = useState(() => Math.random().toString(36).substr(2, 9))
  
  console.log(`[BaseTextReader-${baseReaderId}] RENDER - text: ${text.length} chars, book: ${bookTitle} by ${author}`)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [highlightedText, setHighlightedText] = useState<string>('')
  const [showFirstTimeInstructions, setShowFirstTimeInstructions] = useState(false)
  const [hasUserScrolled, setHasUserScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{index: number, length: number}[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)
  
  const textContentRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Track component lifecycle
  useEffect(() => {
    console.log(`[BaseTextReader-${baseReaderId}] MOUNTED`)
    return () => {
      console.log(`[BaseTextReader-${baseReaderId}] UNMOUNTING`)
    }
  }, [baseReaderId])

  // Show first-time instructions
  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('hasSeenInstructions')
    if (!hasSeenInstructions && text) {
      setShowFirstTimeInstructions(true)
      localStorage.setItem('hasSeenInstructions', 'true')
    }
  }, [text])

  // Restore bookmark position (robust across layouts)
  useEffect(() => {
    if (!text || !bookTitle || !author) return

    const element = textContentRef.current
    if (!element) return

    const bookmarkKey = `bookmark-${bookTitle}-${author}`
    const savedPercentage = localStorage.getItem(bookmarkKey + '-percent')
    const savedPosition = localStorage.getItem(bookmarkKey)
    if (!savedPercentage && !savedPosition) return

    const percentage = savedPercentage ? parseFloat(savedPercentage) : null
    const position = savedPosition ? parseInt(savedPosition) : null

    let restored = false

    const restoreIfReady = () => {
      if (!textContentRef.current || restored) return
      const el = textContentRef.current
      const hasMeasurableHeight = el.clientHeight > 0
      const canScroll = el.scrollHeight > el.clientHeight
      if (!hasMeasurableHeight) return

      let targetPosition: number | null = null
      if (percentage !== null) {
        const scrollableHeight = Math.max(0, el.scrollHeight - el.clientHeight)
        targetPosition = Math.floor(scrollableHeight * (percentage / 100))
      } else if (position !== null) {
        targetPosition = position
      }
      if (targetPosition === null) return

      // Apply and mark restored; attempt twice to overcome late layout changes
      el.scrollTo({ top: targetPosition, behavior: 'auto' })
      setTimeout(() => {
        el.scrollTo({ top: targetPosition!, behavior: 'auto' })
      }, 100)
      restored = true
      cleanup()
    }

    // Observe size changes to know when layout stabilizes
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      restoreIfReady()
    }) : null
    if (ro && element) ro.observe(element)

    // Also retry on next frames and a few timeouts
    const rafId = requestAnimationFrame(() => restoreIfReady())
    const t1 = setTimeout(restoreIfReady, 50)
    const t2 = setTimeout(restoreIfReady, 150)
    const t3 = setTimeout(restoreIfReady, 400)
    const t4 = setTimeout(restoreIfReady, 800)

    // Fonts can affect layout; wait for them if available
    // @ts-ignore
    const fontPromise: Promise<any> | null = (document as any).fonts && (document as any).fonts.ready
      ? (document as any).fonts.ready
      : null
    if (fontPromise) {
      fontPromise.then(() => restoreIfReady()).catch(() => {})
    }

    const onResize = () => restoreIfReady()
    window.addEventListener('resize', onResize)

    const cleanup = () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      if (ro && element) ro.unobserve(element)
    }

    // Final safety timeout in case everything else misses
    const final = setTimeout(() => restoreIfReady(), 1200)

    return () => {
      clearTimeout(final)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      if (ro && element) ro.unobserve(element)
    }
  }, [text, bookTitle, author])

  // Save bookmark when user stops scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (textContentRef.current) {
        const scrollPosition = textContentRef.current.scrollTop
        setHasUserScrolled(true)
        
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          const bookmarkKey = `bookmark-${bookTitle}-${author}`
          const element = textContentRef.current!
          const scrollableHeight = element.scrollHeight - element.clientHeight
          const percentage = scrollableHeight > 0 ? (scrollPosition / scrollableHeight) * 100 : 0
          
          debugStorage(`Saving bookmark for ${bookTitle}: ${scrollPosition}px (${percentage.toFixed(1)}%)`)
          
          localStorage.setItem(bookmarkKey, scrollPosition.toString())
          localStorage.setItem(bookmarkKey + '-percent', percentage.toString())
        }, 500)
      }
    }

    const element = textContentRef.current
    if (element) {
      setTimeout(() => {
        element.addEventListener('scroll', handleScroll)
      }, 100)
      
      return () => {
        element.removeEventListener('scroll', handleScroll)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [bookTitle, author, text])

  // Extract context info for Shakespeare plays
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

    // Look backwards for Act/Scene markers - check both before text and full text up to selection
    const searchText = fullText.substring(0, selectedIndex + selectedText.length)
    
    // Extract Act number - match "ACT" followed by whitespace and Roman numerals
    const actMatches = searchText.match(/\bACT\s+([IVXLCDM]+)\b/gi)
    if (actMatches) {
      const lastActMatch = actMatches[actMatches.length - 1]
      act = lastActMatch.replace(/\bACT\s+/i, '').trim()
    }
    
    // Extract Scene number - match "SCENE" followed by whitespace and Roman numerals  
    const sceneMatches = searchText.match(/\bSCENE\s+([IVXLCDM]+)\b/gi)
    if (sceneMatches) {
      const lastSceneMatch = sceneMatches[sceneMatches.length - 1]
      scene = lastSceneMatch.replace(/\bSCENE\s+/i, '').trim()
    }

    // Look for speaker (name in caps followed by period)
    const speakerMatches = beforeText.match(/\n([A-Z][A-Z\s&']+)\./g)
    if (speakerMatches && speakerMatches.length > 0) {
      const lastSpeakerMatch = speakerMatches[speakerMatches.length - 1]
      const speakerName = lastSpeakerMatch.replace(/^\n/, '').replace(/\.$/, '').trim()
      speaker = speakerName.replace(/\[.*?\]/g, '').trim()
      
      if (speaker.includes('_') || speaker.length < 2) {
        speaker = null
      }
    }

    return {
      bookTitle,
      author,
      act,
      scene, 
      speaker,
      charactersOnStage,
      selectedText,
      beforeContext: beforeText.slice(-200),
      afterContext: afterText.slice(0, 200)
    }
  }

  // Handle confirmation dialog
  const handleExplain = () => {
    if (selectedText && selectedText.length > 0) {
      // Store the selected text and context in sessionStorage for the chat page
      const context = extractContextInfo(selectedText, text)
      const chatData = {
        selectedText,
        contextInfo: context,
        bookTitle,
        author,
        timestamp: Date.now()
      }
      
      sessionStorage.setItem('chatContext', JSON.stringify(chatData))
      
      // Check current path and screen size to determine navigation strategy
      const currentPath = window.location.pathname
      const screenWidth = window.innerWidth
      const isWideScreen = screenWidth >= 800
      
      console.log('handleExplain - currentPath:', currentPath, 'screenWidth:', screenWidth, 'isWideScreen:', isWideScreen)
      
      // Use event-based navigation to avoid reloading in two-panel mode
      const panelEvent = new CustomEvent('navigateToPanel', { detail: { panel: '/chat' } })
      window.dispatchEvent(panelEvent)
      
      // Also navigate with router for one-panel fallback
      if (currentPath === '/chat') {
        // Already on chat page, just trigger update
        window.dispatchEvent(new CustomEvent('newChatContext', { detail: chatData }))
      } else {
        // Navigate to chat
        router.push('/chat')
      }
    }
    
    setShowConfirmDialog(false)
    setSelectedText('')
    setHighlightedText('')
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setSelectedText('')
    setHighlightedText('')
  }

  // Search functionality
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setCurrentSearchIndex(-1)
      return
    }

    const text = textContentRef.current?.textContent || ''
    const results: {index: number, length: number}[] = []
    let index = 0
    
    while (index < text.length) {
      const found = text.toLowerCase().indexOf(query.toLowerCase(), index)
      if (found === -1) break
      
      results.push({
        index: found,
        length: query.length
      })
      index = found + 1
    }
    
    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)
    
    if (results.length > 0) {
      scrollToSearchResult(0, results)
    }
  }

  const scrollToSearchResult = (resultIndex: number, results: {index: number, length: number}[]) => {
    const container = textContentRef.current
    if (!container || results.length === 0 || resultIndex < 0) return

    const tryScroll = () => {
      const target = container.querySelector(
        `[data-search-hit="true"][data-search-index="${resultIndex}"]`
      ) as HTMLElement | null
      if (!target) return false

      // Scroll the container itself so the fixed header/search bar stays in view
      const targetRect = target.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const offsetWithin = targetRect.top - containerRect.top
      const centeredTop = container.scrollTop + offsetWithin - Math.max(0, (container.clientHeight - targetRect.height) / 2)
      container.scrollTo({ top: Math.max(0, centeredTop), behavior: 'smooth' })
      return true
    }

    if (tryScroll()) return
    // Retry after DOM updates/layout settle
    requestAnimationFrame(() => { if (tryScroll()) return })
    setTimeout(() => { tryScroll() }, 50)
    setTimeout(() => { tryScroll() }, 150)
  }

  const nextSearchResult = () => {
    if (searchResults.length === 0) return
    const newIndex = (currentSearchIndex + 1) % searchResults.length
    setCurrentSearchIndex(newIndex)
    scrollToSearchResult(newIndex, searchResults)
  }

  const prevSearchResult = () => {
    if (searchResults.length === 0) return
    const newIndex = currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1
    setCurrentSearchIndex(newIndex)
    scrollToSearchResult(newIndex, searchResults)
  }

  const renderTextWithHighlight = () => {
    let textToRender = text

    // Handle search highlighting first
    if (searchResults.length > 0 && searchQuery.trim()) {
      const parts = []
      let lastIndex = 0
      
      searchResults.forEach((result, index) => {
        // Add text before this search result
        if (result.index > lastIndex) {
          parts.push(textToRender.slice(lastIndex, result.index))
        }
        
        // Add the highlighted search result
        const isCurrentResult = index === currentSearchIndex
        const searchText = textToRender.slice(result.index, result.index + result.length)
        parts.push(
          <span 
            key={`search-${index}`}
            data-search-hit="true"
            data-search-index={index}
            style={{
              backgroundColor: isCurrentResult ? '#8b5cf6' : '#ffeb3b',
              color: isCurrentResult ? 'white' : 'black',
              padding: '1px 2px',
              borderRadius: '2px'
            }}
          >
            {searchText}
          </span>
        )
        
        lastIndex = result.index + result.length
      })
      
      // Add remaining text
      if (lastIndex < textToRender.length) {
        parts.push(textToRender.slice(lastIndex))
      }
      
      return <>{parts}</>
    }

    // Handle selection highlighting
    if (highlightedText && highlightedText.length > 0) {
      // Try multiple search strategies to find the text
      const strategies = [
        // Exact match
        () => {
          const index = textToRender.indexOf(highlightedText)
          if (index !== -1) return { index, text: highlightedText }
          return null
        },
        // Case-insensitive match
        () => {
          const lowerText = textToRender.toLowerCase()
          const lowerHighlight = highlightedText.toLowerCase()
          const index = lowerText.indexOf(lowerHighlight)
          if (index !== -1) return { index, text: textToRender.slice(index, index + highlightedText.length) }
          return null
        },
        // Try without punctuation
        () => {
          const cleanHighlight = highlightedText.replace(/[.,:;!?]/g, '')
          const index = textToRender.indexOf(cleanHighlight)
          if (index !== -1) return { index, text: cleanHighlight }
          return null
        },
        // Fuzzy match - try to find the core word
        () => {
          const coreWord = highlightedText.replace(/[^a-zA-Z]/g, '').toUpperCase()
          if (coreWord.length < 2) return null
          
          const regex = new RegExp(`\\b${coreWord}\\b`, 'i')
          const match = textToRender.match(regex)
          if (match) {
            const index = textToRender.indexOf(match[0])
            return { index, text: match[0] }
          }
          return null
        }
      ]
      
      // Try each strategy until one works
      for (const strategy of strategies) {
        const result = strategy()
        if (result) {
          const before = textToRender.slice(0, result.index)
          const highlighted = result.text
          const after = textToRender.slice(result.index + highlighted.length)
          
          return (
            <>
              {before}
              <span className={styles.selectedText}>{highlighted}</span>
              {after}
            </>
          )
        }
      }
    }
    
    return textToRender
  }

  return {
    // Render props pattern - return all the data and handlers
    // that child components need
    textContentRef,
    searchInputRef,
    showFirstTimeInstructions,
    setShowFirstTimeInstructions,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    showConfirmDialog,
    selectedText,
    highlightedText,
    settings,
    text,
    // Functions
    handleSearch,
    nextSearchResult,
    prevSearchResult,
    handleExplain,
    handleCancel,
    renderTextWithHighlight,
    // For child components to implement
    setSelectedText,
    setShowConfirmDialog,
    setHighlightedText
  }
}

export default BaseTextReader