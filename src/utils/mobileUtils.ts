export interface TouchPosition {
  x: number
  y: number
}

export interface CachedStyles {
  fontSize: number
  lineHeight: number
  clientWidth: number
}

export const detectDevice = () => {
  const isIPhone = /iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)
  const isMobile = isIPhone || isAndroid
  
  return { isIPhone, isAndroid, isMobile }
}

export const calculateMobilePageContent = (
  text: string,
  pageHeight: number,
  fontSize: number,
  lineHeight: number,
  clientWidth: number
) => {
  const charsPerLine = Math.floor(clientWidth / (fontSize * 0.6))
  const estimatedLinesPerPage = Math.floor(pageHeight / lineHeight)
  const charsPerPage = charsPerLine * estimatedLinesPerPage
  
  const pages: string[] = []
  const pageRanges: Array<{ start: number; end: number; pageIndex: number }> = []
  
  let currentStart = 0
  let pageIndex = 0
  
  while (currentStart < text.length) {
    const pageEnd = Math.min(currentStart + charsPerPage, text.length)
    const pageText = text.substring(currentStart, pageEnd)
    
    pages.push(pageText)
    pageRanges.push({
      start: currentStart,
      end: pageEnd,
      pageIndex: pageIndex++
    })
    
    currentStart = pageEnd
  }
  
  return { pages, pageRanges }
}

export const handleLongPress = (
  touchStartPos: TouchPosition,
  longPressTimer: React.MutableRefObject<NodeJS.Timeout | null>,
  setIsInSelectionMode: (value: boolean) => void,
  setTouchStartPos: (pos: TouchPosition | null) => void
) => {
  // Clear any existing timer
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current)
  }
  
  // Set a new timer for long press detection
  longPressTimer.current = setTimeout(() => {
    setIsInSelectionMode(true)
    setTouchStartPos(null)
  }, 500) // 500ms for long press
}

export const handleTouchStart = (
  event: React.TouchEvent,
  setTouchStartPos: (pos: TouchPosition | null) => void,
  longPressTimer: React.MutableRefObject<NodeJS.Timeout | null>,
  setIsInSelectionMode: (value: boolean) => void
) => {
  const touch = event.touches[0]
  const touchPos = { x: touch.clientX, y: touch.clientY }
  setTouchStartPos(touchPos)
  
  handleLongPress(touchPos, longPressTimer, setIsInSelectionMode, setTouchStartPos)
}

export const handleTouchMove = (
  event: React.TouchEvent,
  touchStartPos: TouchPosition | null,
  isInSelectionMode: boolean,
  setIsInSelectionMode: (value: boolean) => void,
  longPressTimer: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  if (touchStartPos && !isInSelectionMode) {
    const touch = event.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.y)
    
    // If user moved more than 10 pixels, cancel long press
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }
}

export const handleTouchEnd = (
  longPressTimer: React.MutableRefObject<NodeJS.Timeout | null>,
  setTouchStartPos: (pos: TouchPosition | null) => void,
  setIsInSelectionMode: (value: boolean) => void
) => {
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }
  
  setTouchStartPos(null)
  
  // Reset selection mode after a short delay
  setTimeout(() => {
    setIsInSelectionMode(false)
  }, 100)
}

export const handleTextSelection = (
  textReaderRef: React.RefObject<HTMLDivElement>,
  setSelectedText: (text: string) => void,
  setShowChatModal: (show: boolean) => void,
  setChatContext: (context: any) => void,
  extractContextInfo: (selectedText: string, fullText: string, bookTitle?: string, author?: string) => any
) => {
  const selection = window.getSelection()
  if (!selection || selection.toString().trim() === '') return
  
  const selectedText = selection.toString().trim()
  if (selectedText.length === 0) return
  
  setSelectedText(selectedText)
  
  // Extract context information
  if (textReaderRef.current) {
    const contextInfo = extractContextInfo(
      selectedText,
      textReaderRef.current.textContent || '',
      'Romeo and Juliet',
      'William Shakespeare'
    )
    
    setChatContext(contextInfo)
    setShowChatModal(true)
  }
}
