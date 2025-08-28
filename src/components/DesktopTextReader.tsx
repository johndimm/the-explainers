'use client'

import React, { useRef, useState } from 'react'
import styles from './TextReader.module.css'
import { ReaderCommonProps, useBookmarkRestoreAndSave, useSearchCore, extractContextInfo } from './BaseTextReader'
import { useRouter } from 'next/navigation'

const DesktopTextReader: React.FC<ReaderCommonProps> = ({ text, bookTitle = 'Romeo and Juliet', author = 'William Shakespeare', settings }) => {
  const router = useRouter()
  const textReaderRef = useRef<HTMLDivElement>(null)
  const textContentRef = useRef<HTMLDivElement>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedText, setSelectedText] = useState('')

  useBookmarkRestoreAndSave(textReaderRef, text, bookTitle, author)
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    handleSearch,
    nextSearchResult,
    prevSearchResult,
    renderTextWithSearchHighlight
  } = useSearchCore(text, textReaderRef, textContentRef)

  const handleMouseUp = () => {
    const selection = window.getSelection()
    const t = selection?.toString().trim() || ''
    if (t.length > 0) {
      setSelectedText(t)
      setShowConfirmDialog(true)
    }
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setSelectedText('')
    window.getSelection()?.removeAllRanges()
  }

  const handleExplain = () => {
    const context = extractContextInfo(selectedText, text, bookTitle, author)
    sessionStorage.setItem('chatContext', JSON.stringify({ selectedText, contextInfo: context, bookTitle, author }))
    router.push('/chat')
    setShowConfirmDialog(false)
    setSelectedText('')
  }

  return (
    <div ref={textReaderRef} className={styles.textReader}>
      {/* Search Bar */}
      <div style={{
        position: 'sticky', top: '0px', padding: '8px 0', marginBottom: '16px',
        backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', zIndex: 50
      }}>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(searchQuery) }}
          style={{ width: '100%', padding: '6px 12px', margin: 0, border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
        />
        {searchResults.length > 0 && (
          <div style={{ marginTop: '4px', fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{currentSearchIndex + 1} of {searchResults.length}</span>
            <button onClick={prevSearchResult} style={{ padding: '2px 6px', border: '1px solid #ddd', borderRadius: '2px', background: 'white', cursor: 'pointer', fontSize: '11px' }}>↑</button>
            <button onClick={nextSearchResult} style={{ padding: '2px 6px', border: '1px solid #ddd', borderRadius: '2px', background: 'white', cursor: 'pointer', fontSize: '11px' }}>↓</button>
            <button onClick={() => { setSearchQuery(''); handleSearch(''); setCurrentSearchIndex(-1) }} style={{ padding: '2px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', color: '#999' }}>clear</button>
          </div>
        )}
      </div>

      <div
        ref={textContentRef}
        className={styles.textContent}
        onMouseUp={handleMouseUp}
        style={{ userSelect: 'text', fontFamily: settings.textFont }}
      >
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          margin: 0, 
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit'
        }}>
          {renderTextWithSearchHighlight(text)}
        </pre>
      </div>

      {showConfirmDialog && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxWidth: '400px' }}>
          <h3>Selected Text:</h3>
          <p style={{ margin: '10px 0', fontStyle: 'italic' }}>
            "{selectedText}"
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={handleCancel} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleExplain} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#007bff', color: 'white', cursor: 'pointer' }}>Explain</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DesktopTextReader


