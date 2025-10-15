import React from 'react'
import styles from '../ChatInterface.module.css'

interface ChatHeaderProps {
  showFullHistory: boolean
  hiddenMessageCount: number
  onToggleHistory: () => void
  onClearHistory: () => void
  showClearConfirm: boolean
  onConfirmClear: () => void
  onCancelClear: () => void
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  showFullHistory,
  hiddenMessageCount,
  onToggleHistory,
  onClearHistory,
  showClearConfirm,
  onConfirmClear,
  onCancelClear
}) => {
  return (
    <div className={styles.chatHeader}>
      <div className={styles.headerLeft}>
        <h3 className={styles.chatTitle}>Chat History</h3>
        {hiddenMessageCount > 0 && (
          <button
            onClick={onToggleHistory}
            className={styles.toggleHistoryButton}
          >
            {showFullHistory ? 'Hide' : 'Show'} Full History ({hiddenMessageCount} hidden)
          </button>
        )}
      </div>
      
      <div className={styles.headerRight}>
        <button
          onClick={onClearHistory}
          className={styles.clearButton}
        >
          Clear History
        </button>
      </div>
      
      {showClearConfirm && (
        <>
          <div className={styles.confirmBackdrop} onClick={onCancelClear} />
          <div className={styles.confirmDialog}>
            <h4>Clear Chat History?</h4>
            <p>This will permanently delete all chat messages.</p>
            <div className={styles.confirmButtons}>
              <button onClick={onConfirmClear} className={styles.confirmButton}>
                Yes, Clear All
              </button>
              <button onClick={onCancelClear} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
