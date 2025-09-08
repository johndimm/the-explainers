'use client'

import React from 'react'

interface Book {
  id: string | number
  title: string
  author?: string
  directUrl?: string
  localPath?: string
  wikipediaUrl?: string
  wikipediaTitle?: string
}

interface SimpleBookListProps {
  books: Book[]
  categoryName: string
  onBookClick: (book: Book, categoryName: string) => void
  styles: any
}

export const SimpleBookList: React.FC<SimpleBookListProps> = ({
  books,
  categoryName,
  onBookClick,
  styles
}) => {
  return (
    <div className={styles.bookList}>
      {books.map((book) => (
        <div 
          key={`${categoryName}-${book.id}`}
          className={styles.bookItem}
          onClick={() => onBookClick(book, categoryName)}
          style={{ position: 'relative' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <div style={{ flex: 1 }}>
              <span className={styles.bookTitle}>{book.title}</span>
              {book.author && (
                <span className={styles.bookAuthor}> by {book.author}</span>
              )}
            </div>
            {book.wikipediaUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(book.wikipediaUrl, '_blank', 'noopener,noreferrer')
                }}
                style={{ 
                  position: 'relative',
                  zIndex: 10,
                  fontSize: '12px',
                  flexShrink: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: '#0066cc',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f8ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                title={`Learn about ${book.title} on Wikipedia`}
              >
                🔗
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SimpleBookList
