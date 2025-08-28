'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Library.module.css'

interface Book {
  id: string | number
  title: string
  author?: string
  directUrl?: string
  localPath?: string
}

interface LibraryCategory {
  name: string
  books: Book[]
  visibleCount: number
}

interface LibraryProps {
  onBookSelect: (title: string, author: string, url: string) => void
  onBackToCurrentBook?: () => void
}

const CATEGORY_FILES = [
  'shakespeare.json',
  'english-literature.json', 
  'philosophers.json',
  'poetry.json',
  'french-literature.json',
  'german-literature.json',
  'italian-literature.json',
  'spanish-literature.json',
  'historical.json',
  'gutenberg-top.json'
]

const Library: React.FC<LibraryProps> = ({ onBookSelect, onBackToCurrentBook }) => {
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadLibraryData()
  }, [])

  const loadLibraryData = async () => {
    try {
      const categoryPromises = CATEGORY_FILES.map(async (filename) => {
        const response = await fetch(`/api/library/${filename}`)
        const books: Book[] = await response.json()
        
        const categoryName = filename
          .replace('.json', '')
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        // Limit English Literature to 100 top entries
        const limitedBooks = filename === 'english-literature.json' ? books.slice(0, 100) : books
        return {
          name: categoryName,
          books: limitedBooks,
          visibleCount: 10
        }
      })

      const loadedCategories = await Promise.all(categoryPromises)
      setCategories(loadedCategories)
    } catch (error) {
      console.error('Error loading library data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showMoreBooks = (categoryIndex: number) => {
    setCategories(prev => prev.map((category, index) => 
      index === categoryIndex 
        ? { ...category, visibleCount: Math.min(category.visibleCount + 10, category.books.length) }
        : category
    ))
  }

  const getBookUrl = (book: Book): string => {
    if (book.directUrl) {
      return book.directUrl
    }
    return `/api/download-text?path=${encodeURIComponent(book.localPath || '')}`
  }

  const handleBookClick = (book: Book, categoryName: string) => {
    let author = book.author || 'Unknown'
    
    // Special case for Shakespeare
    if (categoryName === 'Shakespeare' && !book.author) {
      author = 'William Shakespeare'
    }
    
    const url = getBookUrl(book)
    onBookSelect(book.title, author, url)
  }

  if (loading) {
    return <div className={styles.loading}>Loading library...</div>
  }

  return (
    <div>
      <div className={styles.library}>
        <div className={styles.header}>
          <h1 style={{ marginTop: 4 }}>Library</h1>
          <p style={{ marginTop: 4 }}>Choose a book to read and explore</p>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: '8px', 
            padding: '12px 16px', 
            marginTop: '12px',
            fontSize: '14px',
            color: '#0369a1'
          }}>
            <strong>📚 Project Gutenberg Integration:</strong> This library shows a small sample from <a href="https://www.gutenberg.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>Project Gutenberg</a>'s collection of over 75,000 free eBooks. You can also load any other book from Gutenberg, use a URL from any site that provides plain text, upload a text file from your computer, or copy/paste text directly.
          </div>
        </div>

        <div className={styles.customSection}>
          <div className={styles.customLink}>
            <span>Need a different book or text?</span>
            <button 
              onClick={() => router.push('/custom-books')}
              className={styles.customBooksButton}
            >
              Load More Options →
            </button>
          </div>
        </div>

        <div className={styles.categories}>
          {categories.map((category, categoryIndex) => (
            <div key={category.name} className={styles.category}>
              <h2 className={styles.categoryTitle}>{category.name}</h2>
              <div className={styles.bookList}>
                {category.books.slice(0, category.visibleCount).map((book) => (
                  <div 
                    key={`${category.name}-${book.id}`}
                    className={styles.bookItem}
                    onClick={() => handleBookClick(book, category.name)}
                  >
                    <span className={styles.bookTitle}>{book.title}</span>
                    {book.author && (
                      <span className={styles.bookAuthor}>by {book.author}</span>
                    )}
                  </div>
                ))}
                
                {category.visibleCount < category.books.length && (
                  <button 
                    onClick={() => showMoreBooks(categoryIndex)}
                    className={styles.moreButton}
                  >
                    More ({category.books.length - category.visibleCount} remaining)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Library