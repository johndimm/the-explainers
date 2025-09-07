import { useSession } from 'next-auth/react'

export interface CurrentBook {
  title: string
  author: string
  url: string
}

export const getCurrentBook = async (): Promise<CurrentBook | null> => {
  try {
    // Try to get from database first (if authenticated)
    const response = await fetch('/api/user/current-book')
    if (response.ok) {
      const dbBook = await response.json()
      return {
        title: dbBook.title,
        author: dbBook.author,
        url: dbBook.url
      }
    }
  } catch (error) {
    console.error('Error loading current book from database:', error)
  }

  // Fallback to localStorage
  try {
    const savedBook = localStorage.getItem('current-book')
    if (savedBook) {
      return JSON.parse(savedBook)
    }
  } catch (error) {
    console.error('Error loading current book from localStorage:', error)
  }

  return null
}

export const setCurrentBook = async (book: CurrentBook): Promise<void> => {
  // Save to localStorage for backward compatibility
  localStorage.setItem('current-book', JSON.stringify(book))

  // Save to database if authenticated
  try {
    await fetch('/api/user/current-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    })
  } catch (error) {
    console.error('Error saving current book to database:', error)
  }

  // Dispatch custom event to notify components of the change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('currentBookChanged'))
  }
}

// Hook for easy current book management
export const useCurrentBook = () => {
  const { data: session, status } = useSession()

  const loadCurrentBook = async (): Promise<CurrentBook | null> => {
    if (status === 'loading') return null
    return await getCurrentBook()
  }

  const saveCurrentBook = async (book: CurrentBook): Promise<void> => {
    await setCurrentBook(book)
  }

  return { loadCurrentBook, saveCurrentBook }
}
