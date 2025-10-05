import { useAuth } from '@/contexts/AuthContext'
import { log } from './log'

export interface CurrentBook {
  title: string
  author: string
  url: string
}

export const getCurrentBook = async (): Promise<CurrentBook | null> => {
  try {
    // Get from database
    const response = await fetch('/api/user/current-book')
    if (response.ok) {
      const dbBook = await response.json()
      return {
        title: dbBook.title,
        author: dbBook.author,
        url: dbBook.url
      }
    }
    // 404 is expected when no current book exists or no user session
    // Don't log this as an error
  } catch (error) {
    log('ui','Error loading current book from database:', error)
  }

  return null
}

export const setCurrentBook = async (book: CurrentBook): Promise<void> => {
  // Save to database
  try {
    await fetch('/api/user/current-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    })
  } catch (error) {
    log('ui','Error saving current book to database:', error)
  }

  // Dispatch custom event to notify components of the change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('currentBookChanged'))
  }
}

// Hook for easy current book management
export const useCurrentBook = () => {
  const { user } = useAuth()

  const loadCurrentBook = async (): Promise<CurrentBook | null> => {
    return await getCurrentBook()
  }

  const saveCurrentBook = async (book: CurrentBook): Promise<void> => {
    await setCurrentBook(book)
  }

  return { loadCurrentBook, saveCurrentBook }
}
