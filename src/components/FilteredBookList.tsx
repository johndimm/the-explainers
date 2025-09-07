'use client'

import React, { useState, useEffect } from 'react'
import WikipediaLink from './WikipediaLink'
import { getBookWikipediaSearchTerm, checkWikipediaPage } from '@/utils/wikipedia'
import LoadingIndicator from './LoadingIndicator'

interface Book {
  id: string | number
  title: string
  author?: string
  directUrl?: string
  localPath?: string
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
    const filterBooks = async () => {
      setIsLoading(true)
      const validBooks: Book[] = []

      // Check each book for Wikipedia existence
      for (const book of books) {
        try {
          const searchTerm = getBookWikipediaSearchTerm(book.title, book.author)
          const result = await checkWikipediaPage(searchTerm)
          
          if (result.exists) {
            validBooks.push(book)
          } else {
            console.log(`Removing book "${book.title}" by ${book.author || 'Unknown'} - no Wikipedia page found`)
          }
        } catch (error) {
          console.error(`Error checking Wikipedia for ${book.title}:`, error)
          // Include the book if we can't check (network error, etc.)
          validBooks.push(book)
        }
      }

      setFilteredBooks(validBooks)
      setIsLoading(false)
    }

    filterBooks()
  }, [books])

  if (isLoading) {
    return (
      <LoadingIndicator 
        message="Checking Wikipedia pages for books..."
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
            <WikipediaLink 
              searchTerm={getBookWikipediaSearchTerm(book.title, book.author)}
              style={{ 
                position: 'relative',
                zIndex: 10,
                fontSize: '12px',
                flexShrink: 0
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default FilteredBookList
