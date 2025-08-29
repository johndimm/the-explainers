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
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCategories, setFilteredCategories] = useState<LibraryCategory[]>([])
  const router = useRouter()

  useEffect(() => {
    loadLibraryData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = categories.map(category => ({
        ...category,
        books: category.books.filter(book => 
          book.title.toLowerCase().includes(query) ||
          (book.author && book.author.toLowerCase().includes(query))
        )
      })).filter(category => category.books.length > 0)
      
      setFilteredCategories(filtered)
    }
  }, [searchQuery, categories])

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
    if (book.localPath) {
      return `/api/download-text?path=${encodeURIComponent(book.localPath)}`
    }
    // For books without localPath or directUrl, construct Project Gutenberg URL
    // Most books use their ID to construct the URL
    return `https://www.gutenberg.org/files/${book.id}/${book.id}-0.txt`
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
          <p style={{ marginTop: 4 }}>
            Choose a book to read and explore
            {searchQuery.trim() !== '' && (
              <span style={{ 
                display: 'block', 
                fontSize: '14px', 
                color: '#0ea5e9', 
                marginTop: '4px',
                fontWeight: '500'
              }}>
                🔍 Searching for "{searchQuery}"
              </span>
            )}
          </p>
          
          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search books by title or author... (Press Esc to clear)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('')
                  e.currentTarget.blur()
                }
              }}
              className={styles.searchInput}
            />
            
            {/* Search Results Summary */}
            {searchQuery.trim() !== '' && (
              <div className={styles.searchResults}>
                <span>🔍</span>
                <span>
                  Found {filteredCategories.reduce((total, cat) => total + cat.books.length, 0)} books 
                  in {filteredCategories.length} categories
                </span>
                {searchQuery.trim() !== '' && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={styles.clearSearchButton}
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
          
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
          
          {/* Community Section */}
          <div className={styles.communitySection}>
            <div className={styles.communityContent}>
              <div className={styles.communityInfo}>
                <span className={styles.communityIcon}>📱</span>
                <div className={styles.communityText}>
                  <strong>Join Our Community</strong>
                  <span>Have suggestions? Found a bug? Want to discuss books?</span>
                </div>
              </div>
              <div className={styles.communityActions}>
                <button 
                  className={styles.communityButton}
                  onClick={() => window.open('https://reddit.com/r/TheExplainersApp', '_blank')}
                >
                  Reddit Forum →
                </button>
                <span className={styles.communityNote}>
                  Join r/TheExplainersApp
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.categories}>
          {filteredCategories.length === 0 && searchQuery.trim() !== '' ? (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>🔍</div>
              <div>No books found matching "{searchQuery}"</div>
              <div className={styles.noResultsText}>
                Try searching for a different title or author
              </div>
            </div>
          ) : (
            filteredCategories.map((category, categoryIndex) => (
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
          ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Library