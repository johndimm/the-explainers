import React from 'react'
import styles from '../TextReader.module.css'

interface DesktopTextDisplayProps {
  text: string
  fontSize: number
  onTextSelection: () => void
  textReaderRef: React.RefObject<HTMLDivElement>
  textContentRef: React.RefObject<HTMLDivElement>
}

export const DesktopTextDisplay: React.FC<DesktopTextDisplayProps> = ({
  text,
  fontSize,
  onTextSelection,
  textReaderRef,
  textContentRef
}) => {

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
        {text}
      </div>
    </div>
  )
}
