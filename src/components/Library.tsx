'use client'

import React, { useState, useEffect } from 'react'
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

const Library: React.FC<LibraryProps> = ({ onBookSelect }) => {
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [customUrl, setCustomUrl] = useState('')
  const [fileInput, setFileInput] = useState<File | null>(null)

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

  const handleBookClick = (book: Book) => {
    const url = getBookUrl(book)
    const author = book.author || 'Unknown Author'
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

  return (
    <div className={styles.library}>
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
                  onClick={() => handleBookClick(book)}
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
  )
}

export default Library