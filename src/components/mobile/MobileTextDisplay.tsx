import React from 'react'
import styles from '../TextReader.module.css'

interface MobileTextDisplayProps {
  text: string
  fontSize: number
  isInSelectionMode: boolean
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onTextSelection: () => void
  textReaderRef: React.RefObject<HTMLDivElement>
  textContentRef: React.RefObject<HTMLDivElement>
}

export const MobileTextDisplay: React.FC<MobileTextDisplayProps> = ({
  text,
  fontSize,
  isInSelectionMode,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTextSelection,
  textReaderRef,
  textContentRef
}) => {

  return (
    <div
      ref={textReaderRef}
      className={`${styles.textReader} ${isInSelectionMode ? styles.selectionMode : ''}`}
      style={{ fontSize: `${fontSize}px` }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseUp={onTextSelection}
    >
      <div
        ref={textContentRef}
        className={styles.textContent}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: `${fontSize * 1.5}px`,
          userSelect: isInSelectionMode ? 'text' : 'none',
          WebkitUserSelect: isInSelectionMode ? 'text' : 'none'
        }}
      >
        {text}
      </div>
    </div>
  )
}
