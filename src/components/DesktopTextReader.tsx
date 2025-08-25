'use client'

import React from 'react'
import BaseTextReader from './BaseTextReader'
import styles from './TextReader.module.css'

interface DesktopTextReaderProps {
  text: string
  bookTitle: string
  author: string
  onTextSelect?: (selectedText: string) => void
}

const DesktopTextReader: React.FC<DesktopTextReaderProps> = (props) => {
  const baseReader = BaseTextReader(props)
  
  // Desktop-specific text selection handler
  const handleMouseUp = () => {
    setTimeout(() => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const selectedText = selection.toString().trim()
        
        if (selectedText && selectedText.length > 0) {
          baseReader.setSelectedText(selectedText)
          baseReader.setShowConfirmDialog(true)
          baseReader.setHighlightedText(selectedText)
          
          // Clear the native selection
          selection.removeAllRanges()
        }
      }
    }, 10)
  }

  return (
    <div ref={baseReader.textContentRef} className={styles.textReader}>
      {baseReader.showFirstTimeInstructions && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
          zIndex: 2000,
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Welcome to The Explainers!</h3>
          <p style={{ margin: '0 0 20px 0', lineHeight: '1.5' }}>
            To get started, simply <strong>highlight any confusing passage</strong> in the text below. 
            We'll provide an AI explanation to help you understand it better.
          </p>
          <button 
            onClick={() => baseReader.setShowFirstTimeInstructions(false)}
            style={{
              padding: '10px 20px',
              border: '2px solid white',
              borderRadius: '6px',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Got it!
          </button>
        </div>
      )}
      
      {/* Search Bar - STICKY */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '8px 8px 8px 8px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e0e0e0',
        flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={baseReader.searchInputRef}
            type="text"
            placeholder="Search in text..."
            value={baseReader.searchQuery}
            onChange={(e) => baseReader.setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                baseReader.handleSearch(baseReader.searchQuery)
              }
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              margin: 0,
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white'
            }}
          />
          <button
            onClick={() => baseReader.handleSearch(baseReader.searchQuery)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#f8f9fa',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#495057'
            }}
          >
            🔍
          </button>
        </div>
        {baseReader.searchResults.length > 0 && (
          <div style={{ 
            marginTop: '4px',
            fontSize: '12px',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{baseReader.currentSearchIndex + 1} of {baseReader.searchResults.length}</span>
            <button onClick={baseReader.prevSearchResult} style={{
              padding: '2px 6px', border: '1px solid #ddd', borderRadius: '2px',
              background: 'white', cursor: 'pointer', fontSize: '11px'
            }}>↑</button>
            <button onClick={baseReader.nextSearchResult} style={{
              padding: '2px 6px', border: '1px solid #ddd', borderRadius: '2px',
              background: 'white', cursor: 'pointer', fontSize: '11px'
            }}>↓</button>
            <button onClick={() => {
              baseReader.setSearchQuery('')
              baseReader.setSearchResults([])
              baseReader.setCurrentSearchIndex(-1)
            }} style={{
              padding: '2px 8px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: '11px', color: '#999'
            }}>clear</button>
          </div>
        )}
      </div>
      
      {/* Text Content with Desktop Selection */}
      <div 
        className={styles.textContent}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          WebkitUserSelect: 'text',
          userSelect: 'text',
          fontFamily: baseReader.settings.textFont,
          padding: '20px'  // Normal padding since search bar is now sticky
        }}
      >
        {baseReader.renderTextWithHighlight()}
      </div>
      
      {/* Confirmation Dialog */}
      {baseReader.showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxWidth: '400px'
        }}>
          <h3>Selected Text:</h3>
          <p style={{ margin: '10px 0', fontStyle: 'italic' }}>
            "{baseReader.selectedText}"
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              onClick={baseReader.handleCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={baseReader.handleExplain}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: '#007bff',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Explain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DesktopTextReader