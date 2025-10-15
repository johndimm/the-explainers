import React from 'react'
import styles from '../TextReader.module.css'
import { PageMap } from '../../utils/pageUtils'

interface DesktopTextDisplayProps {
  text: string
  pageMap: PageMap
  currentPage: number
  fontSize: number
  onTextSelection: () => void
  renderTextWithSearchHighlight: (text: string) => React.ReactNode
  textReaderRef: React.RefObject<HTMLDivElement>
  textContentRef: React.RefObject<HTMLDivElement>
}

export const DesktopTextDisplay: React.FC<DesktopTextDisplayProps> = ({
  text,
  pageMap,
  currentPage,
  fontSize,
  onTextSelection,
  renderTextWithSearchHighlight,
  textReaderRef,
  textContentRef
}) => {
  const currentPageText = pageMap.pages[currentPage] || ''
  const displayText = renderTextWithSearchHighlight(currentPageText)

  return (
    <div
      ref={textReaderRef}
      className={styles.textReader}
      style={{ fontSize: `${fontSize}px` }}
      onMouseUp={onTextSelection}
    >
      <div
        ref={textContentRef}
        className={styles.textContent}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: `${fontSize * 1.5}px`,
          fontFamily: 'serif'
        }}
      >
        {displayText}
      </div>
    </div>
  )
}
