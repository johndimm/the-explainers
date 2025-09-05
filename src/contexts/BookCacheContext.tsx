'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface BookData {
  title: string
  author: string
  url: string
  text: string
  loadedAt: number
}

interface BookCacheContextType {
  cachedBook: BookData | null
  getCachedBook: (title: string, author: string, url: string) => BookData | null
  setCachedBook: (bookData: BookData) => void
  clearCache: () => void
  isCacheValid: (title: string, author: string, url: string) => boolean
}

const BookCacheContext = createContext<BookCacheContextType | undefined>(undefined)

export const useBookCache = () => {
  const context = useContext(BookCacheContext)
  if (context === undefined) {
    throw new Error('useBookCache must be used within a BookCacheProvider')
  }
  return context
}

interface BookCacheProviderProps {
  children: React.ReactNode
}

export const BookCacheProvider: React.FC<BookCacheProviderProps> = ({ children }) => {
  const [cachedBook, setCachedBookState] = useState<BookData | null>(null)

  const getCachedBook = useCallback((title: string, author: string, url: string): BookData | null => {
    if (!cachedBook) return null
    
    // Check if this is the same book
    if (cachedBook.title === title && cachedBook.author === author && cachedBook.url === url) {
      // Check if cache is still valid (within 1 hour)
      const cacheAge = Date.now() - cachedBook.loadedAt
      const maxCacheAge = 60 * 60 * 1000 // 1 hour in milliseconds
      
      if (cacheAge < maxCacheAge) {
        console.log('BookCache: Using cached book content', { title, author, cacheAge: Math.round(cacheAge / 1000) + 's' })
        return cachedBook
      } else {
        console.log('BookCache: Cache expired, will reload', { title, author, cacheAge: Math.round(cacheAge / 1000) + 's' })
      }
    }
    
    return null
  }, [cachedBook])

  const setCachedBook = useCallback((bookData: BookData) => {
    console.log('BookCache: Caching book content', { 
      title: bookData.title, 
      author: bookData.author, 
      textLength: bookData.text.length 
    })
    setCachedBookState(bookData)
  }, [])

  const clearCache = useCallback(() => {
    console.log('BookCache: Clearing cache')
    setCachedBookState(null)
  }, [])

  const isCacheValid = useCallback((title: string, author: string, url: string): boolean => {
    return getCachedBook(title, author, url) !== null
  }, [getCachedBook])

  const value: BookCacheContextType = {
    cachedBook,
    getCachedBook,
    setCachedBook,
    clearCache,
    isCacheValid
  }

  return (
    <BookCacheContext.Provider value={value}>
      {children}
    </BookCacheContext.Provider>
  )
}

