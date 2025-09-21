'use client'

import React, { useState, useEffect } from 'react'
import SimpleBookList from './SimpleBookList'
import styles from './CategoryPopup.module.css'

interface Book {
  id: string | number
  title: string
  author?: string
  directUrl?: string
  localPath?: string
  wikipediaUrl?: string
  wikipediaTitle?: string
}

interface CategoryPopupProps {
  isOpen: boolean
  onClose: () => void
  categoryName: string
  books: Book[]
  onBookClick: (book: Book, categoryName: string) => void
}

const CategoryPopup: React.FC<CategoryPopupProps> = ({
  isOpen,
  onClose,
  categoryName,
  books,
  onBookClick
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(books)

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBooks(books)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(query) ||
        (book.author && book.author.toLowerCase().includes(query))
      )
      setFilteredBooks(filtered)
    }
  }, [searchQuery, books])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      // Add keyboard event listener for ESC key
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{categoryName}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder={`Search ${categoryName.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.stats}>
          Showing {filteredBooks.length} of {books.length} books
        </div>

        <div className={styles.content}>
          <SimpleBookList
            books={filteredBooks}
            categoryName={categoryName}
            onBookClick={onBookClick}
            styles={styles}
          />
        </div>
      </div>
    </div>
  )
}

export default CategoryPopup
