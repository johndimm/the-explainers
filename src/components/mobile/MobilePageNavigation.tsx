import React from 'react'
import styles from '../TextReader.module.css'

interface MobilePageNavigationProps {
  currentPage: number
  totalPages: number
  onPreviousPage: () => void
  onNextPage: () => void
  showPrevButton: boolean
  showNextButton: boolean
}

export const MobilePageNavigation: React.FC<MobilePageNavigationProps> = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  showPrevButton,
  showNextButton
}) => {
  return (
    <div className={styles.mobilePageNavigation}>
      <div className={styles.pageInfo}>
        Page {currentPage + 1} of {totalPages}
      </div>
      
      <div className={styles.pageButtons}>
        <button
          onClick={onPreviousPage}
          disabled={!showPrevButton}
          className={`${styles.pageButton} ${styles.prevButton}`}
        >
          ← Previous
        </button>
        
        <button
          onClick={onNextPage}
          disabled={!showNextButton}
          className={`${styles.pageButton} ${styles.nextButton}`}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
