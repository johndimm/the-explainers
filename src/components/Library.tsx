'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Library.module.css'
import FilteredBookList from './FilteredBookList'
import CategoryPopup from './CategoryPopup'
import PageLayout from './PageLayout'

interface Book {
  id: string | number
  title: string
  author?: string
  directUrl?: string
  localPath?: string
  wikipediaUrl?: string
  wikipediaTitle?: string
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
  'plato.json',
  'poetry.json',
  'french-literature.json',
  'german-literature.json',
  'italian-literature.json',
  'spanish-literature.json',
  'gutenberg-top.json',
  'humanities-101.json',
  'history.json'
]

const Library: React.FC<LibraryProps> = ({ onBookSelect, onBackToCurrentBook }) => {
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCategories, setFilteredCategories] = useState<LibraryCategory[]>([])
  const [popupCategory, setPopupCategory] = useState<LibraryCategory | null>(null)

  // Listen for header search events
  useEffect(() => {
    const handleHeaderSearch = (event: CustomEvent) => {
      if (event.detail.type === 'books') {
        setSearchQuery(event.detail.query)
      }
    }

    window.addEventListener('headerSearch', handleHeaderSearch as EventListener)
    return () => window.removeEventListener('headerSearch', handleHeaderSearch as EventListener)
  }, [])
  const router = useRouter()

  useEffect(() => {
    loadLibraryData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = categories.map(category => {
        const matchingBooks = category.books.filter(book => 
          book.title.toLowerCase().includes(query) ||
          (book.author && book.author.toLowerCase().includes(query))
        )
        
        return {
          ...category,
          books: matchingBooks,
          visibleCount: Math.max(matchingBooks.length, 50) // Show all search results
        }
      }).filter(category => category.books.length > 0)
      
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
        
        // Filter books that have Wikipedia URLs and overwrite the original array
        const booksWithWikipedia = limitedBooks.filter(book => 
          book.wikipediaUrl && book.wikipediaUrl.trim() !== ''
        )
        
        return {
          name: categoryName,
          books: booksWithWikipedia,
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
    const category = categories[categoryIndex]
    const totalBooks = category.books.length
    
    // If category has more than 50 books, show popup instead of expanding
    if (totalBooks > 50) {
      setPopupCategory(category)
    } else {
      // For smaller categories, use the old behavior
      setCategories(prev => prev.map((cat, index) => 
        index === categoryIndex 
          ? { ...cat, visibleCount: Math.min(cat.visibleCount + 10, totalBooks) }
          : cat
      ))
    }
  }

  const closePopup = () => {
    setPopupCategory(null)
  }

  const getBookUrl = (book: Book): string => {
    if (book.directUrl) {
      return book.directUrl
    }
    if (book.localPath) {
      return `/api/download-text?path=${encodeURIComponent(book.localPath)}`
    }
    // For books without localPath or directUrl, construct Project Gutenberg URL
    // Use the correct Gutenberg cache URL format
    return `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`
  }

  const handleBookClick = (book: Book, categoryName: string) => {
    let author = book.author || 'Unknown'
    
    // Special case for Shakespeare
    if (categoryName === 'Shakespeare' && !book.author) {
      author = 'William Shakespeare'
    }
    
    const url = getBookUrl(book)
    onBookSelect(book.title, author, url)
    
    // Close popup if it's open
    if (popupCategory) {
      closePopup()
    }
  }

  if (loading) {
    return (
      <PageLayout title="Library" subtitle="Loading your book collection...">
        <div className="card text-center">
          <div className="card-body">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="m-0 text-gray-600">Loading library...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout 
      title="Library" 
      subtitle="Choose a book to read and explore"
    >
      <div className="space-y-6">
        {searchQuery.trim() !== '' && (
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-purple-light))' }}>
            <div className="card-body">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔍</span>
                <p className="m-0 font-medium">Searching for "{searchQuery}"</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-success-light))' }}>
          <div className="card-body">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">📚</span>
              <h3 className="text-lg font-semibold m-0">Project Gutenberg Integration</h3>
            </div>
            <p className="m-0 text-sm leading-relaxed">
              This library shows a small sample from <a href="https://www.gutenberg.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Project Gutenberg</a>'s collection of over 75,000 free eBooks. You can also load any other book from Gutenberg, use a URL from any site that provides plain text, upload a text file from your computer, or copy/paste text directly.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={() => router.push('/custom-books')}
            className="btn btn-primary btn-lg"
          >
            📖 Need a different book or text?
          </button>
        </div>

        <div className="space-y-8">
          {filteredCategories.length === 0 && searchQuery.trim() !== '' ? (
            <div className="card text-center">
              <div className="card-body">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🔍
                </div>
                <h3 className="text-xl font-semibold mb-2">No books found</h3>
                <p className="text-gray-600 mb-0">
                  No books found matching "{searchQuery}". Try searching for a different title or author.
                </p>
              </div>
            </div>
          ) : (
            filteredCategories.map((category, categoryIndex) => (
            <div key={category.name} className="card">
              <div className="card-body">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">{category.name}</h2>
                <FilteredBookList
                  books={category.books.slice(0, category.visibleCount)}
                  categoryName={category.name}
                  onBookClick={handleBookClick}
                  styles={styles}
                />
                
                {category.visibleCount < category.books.length && (
                  <div className="text-center mt-6">
                    <button 
                      onClick={() => showMoreBooks(categoryIndex)}
                      className="btn btn-secondary"
                    >
                      {category.books.length > 50 
                        ? `View All ${category.books.length} Books`
                        : `Show More (${category.books.length - category.visibleCount} remaining)`
                      }
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
          )}
        </div>

        {/* Community Section - redesigned */}
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-background-secondary), var(--color-background-tertiary))' }}>
          <div className="card-body text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm mx-auto mb-4">
              💬
            </div>
            <h3 className="text-xl font-semibold mb-3">Join Our Community</h3>
            <p className="text-gray-600 mb-6">
              Have suggestions? Found a bug? Want to discuss books?
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <button 
                onClick={() => window.open('https://reddit.com/r/TheExplainersApp', '_blank')}
                className="btn btn-primary"
              >
                💬 Reddit Forum
              </button>
              
              <button 
                onClick={() => window.open('https://github.com/johndimm/the-explainers/discussions', '_blank')}
                className="btn btn-secondary"
              >
                🐙 GitHub Discussions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Popup */}
      {popupCategory && (
        <CategoryPopup
          isOpen={!!popupCategory}
          onClose={closePopup}
          categoryName={popupCategory.name}
          books={popupCategory.books}
          onBookClick={handleBookClick}
        />
      )}
    </PageLayout>
  )
}

export default Library