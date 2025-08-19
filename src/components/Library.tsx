'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  const [customUrl, setCustomUrl] = useState('')
  const [fileInput, setFileInput] = useState<File | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLibraryData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMobileMenu])

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

        return {
          name: categoryName,
          books,
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
        ? { ...category, visibleCount: category.visibleCount + 10 }
        : category
    ))
  }

  const getBookUrl = (book: Book): string => {
    if (book.localPath) {
      return book.localPath
    }
    if (book.directUrl) {
      return book.directUrl
    }
    return `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`
  }

  const handleBookClick = (book: Book, categoryName: string) => {
    const url = getBookUrl(book)
    let author = book.author || 'Unknown Author'
    
    // Special case for Shakespeare category
    if (categoryName.toLowerCase().includes('shakespeare')) {
      author = 'William Shakespeare'
    }
    
    onBookSelect(book.title, author, url)
  }

  const handleCustomUrl = () => {
    if (!customUrl.trim()) return
    
    const filename = customUrl.split('/').pop() || 'Custom Text'
    const title = filename.replace(/\.(txt|html)$/, '')
    onBookSelect(title, 'Custom', customUrl)
    setCustomUrl('')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        onBookSelect(file.name.replace('.txt', ''), 'Local File', url)
      }
      reader.readAsText(file)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading library...</div>
  }

  // Check if there's a current book
  const getCurrentBook = () => {
    try {
      const savedBook = localStorage.getItem('current-book')
      if (savedBook) {
        const book = JSON.parse(savedBook)
        return book.title ? book : null
      }
    } catch (error) {
      console.error('Error loading current book:', error)
    }
    return null
  }

  const currentBook = getCurrentBook()

  return (
    <div>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '8px 12px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#333',
            lineHeight: '1.2'
          }}>
            The Explainers
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '11px', 
            color: '#666',
            fontStyle: 'italic',
            lineHeight: '1.2'
          }}>
            understand difficult texts
          </p>
        </div>
        {/* Hamburger menu for all devices */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#333'
            }}
          >
            ☰
          </button>
          
          {showMobileMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '160px',
              zIndex: 1000
            }}>
              <a 
                href="/user-guide.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  color: '#333',
                  textDecoration: 'none',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={() => setShowMobileMenu(false)}
              >
                📖 User Guide
              </a>
              <button 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  color: '#666'
                }}
              >
                📚 Library (current)
              </button>
              <button 
                onClick={() => {
                  window.location.href = '/?styles=true'
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                🎭 Styles
              </button>
              <button 
                onClick={() => {
                  window.location.href = '/?pricing=true'
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                💳 Credits
              </button>
              <button 
                onClick={() => {
                  window.location.href = '/?profile=true'
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                👤 Profile
              </button>
              <button 
                onClick={() => {
                  window.location.href = '/?settings=true'
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Settings
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div className={styles.library} style={{ marginTop: '50px' }}>
        {currentBook && onBackToCurrentBook && (
          <div className={styles.currentBookLink}>
            <button onClick={onBackToCurrentBook} className={styles.backButton}>
              ← Back to "{currentBook.title}"
            </button>
          </div>
        )}
        
        <div className={styles.header}>
          <h1>Library</h1>
          <p>Choose a book to read and explore</p>
        </div>

      <div className={styles.customSection}>
        <div className={styles.urlInput}>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Enter URL to text file..."
            className={styles.input}
          />
          <button onClick={handleCustomUrl} className={styles.loadButton}>
            Load URL
          </button>
        </div>

        <div className={styles.fileInput}>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className={styles.fileInputHidden}
            id="file-upload"
          />
          <label htmlFor="file-upload" className={styles.fileLabel}>
            Upload Text File
          </label>
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