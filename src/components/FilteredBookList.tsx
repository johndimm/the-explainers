'use client'

import React, { useState, useEffect } from 'react'
import LoadingIndicator from './LoadingIndicator'
import { log } from '../utils/log'

interface Book {
  id: string | number
  title: string
  author?: string
  directUrl?: string
  localPath?: string
  wikipediaUrl?: string
  wikipediaTitle?: string
}

interface FilteredBookListProps {
  books: Book[]
  categoryName: string
  onBookClick: (book: Book, categoryName: string) => void
  styles: any
}

export const FilteredBookList: React.FC<FilteredBookListProps> = ({
  books,
  categoryName,
  onBookClick,
  styles
}) => {
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const filterBooks = () => {
      setIsLoading(true)
      
      // Filter books that have Wikipedia links directly from JSON data
      const validBooks = books.filter(book => {
        if (book.wikipediaUrl && book.wikipediaUrl.trim() !== '') {
          return true
        } else {
          log(`Removing book "${book.title}" by ${book.author || 'Unknown'} - no Wikipedia URL in JSON data`)
          return false
        }
      })

      setFilteredBooks(validBooks)
      setIsLoading(false)
    }

    filterBooks()
  }, [books])

  if (isLoading) {
    return (
      <LoadingIndicator 
        message="Loading books with Wikipedia links..."
        style={{ padding: '20px' }}
      />
    )
  }

  return (
    <div className={styles.bookList}>
      {filteredBooks.map((book) => (
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
                <span className={styles.bookAuthor}>by {book.author}</span>
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

export default FilteredBookList
