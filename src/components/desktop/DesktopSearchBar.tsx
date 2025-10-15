import React from 'react'
import styles from '../TextReader.module.css'

interface DesktopSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearch: () => void
  searchResults: Array<{ index: number; length: number }>
  currentSearchIndex: number
  onNextSearch: () => void
  onPrevSearch: () => void
  onClearSearch: () => void
}

export const DesktopSearchBar: React.FC<DesktopSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  searchResults,
  currentSearchIndex,
  onNextSearch,
  onPrevSearch,
  onClearSearch
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch()
    } else if (e.key === 'Escape') {
      onClearSearch()
    }
  }

  return (
    <div className={styles.desktopSearchBar}>
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search text... (Ctrl+F)"
          className={styles.searchInput}
        />
        <button onClick={onSearch} className={styles.searchButton}>
          Search
        </button>
      </div>
      
      {searchResults.length > 0 && (
        <div className={styles.searchResults}>
          <span className={styles.searchResultCount}>
            {currentSearchIndex + 1} of {searchResults.length}
          </span>
          <div className={styles.searchNavigation}>
            <button 
              onClick={onPrevSearch} 
              className={styles.searchNavButton}
              disabled={searchResults.length === 0}
            >
              ↑
            </button>
            <button 
              onClick={onNextSearch} 
              className={styles.searchNavButton}
              disabled={searchResults.length === 0}
            >
              ↓
            </button>
            <button 
              onClick={onClearSearch} 
              className={styles.clearSearchButton}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
