import React from 'react'
import styles from '../TextReader.module.css'

interface DesktopControlsProps {
  fontSize: number
  onFontSizeChange: (size: number) => void
  onIncreaseFont: () => void
  onDecreaseFont: () => void
  onResetFont: () => void
}

export const DesktopControls: React.FC<DesktopControlsProps> = ({
  fontSize,
  onFontSizeChange,
  onIncreaseFont,
  onDecreaseFont,
  onResetFont
}) => {
  return (
    <div className={styles.desktopControls}>
      <div className={styles.fontControls}>
        <button
          onClick={onDecreaseFont}
          className={styles.fontButton}
          title="Decrease font size (Ctrl+-)"
        >
          A-
        </button>
        
        <span className={styles.fontSizeDisplay}>
          {fontSize}px
        </span>
        
        <button
          onClick={onIncreaseFont}
          className={styles.fontButton}
          title="Increase font size (Ctrl+=)"
        >
          A+
        </button>
        
        <button
          onClick={onResetFont}
          className={styles.resetFontButton}
          title="Reset font size (Ctrl+0)"
        >
          Reset
        </button>
      </div>
      
      <div className={styles.fontSlider}>
        <input
          type="range"
          min="12"
          max="24"
          value={fontSize}
          onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
          className={styles.fontSliderInput}
        />
      </div>
    </div>
  )
}
