import { useSession } from 'next-auth/react'

export interface LocalStorageData {
  profileData?: any
  settingsData?: any
  currentBookData?: any
  bookmarksData?: any[]
}

export const extractLocalStorageData = (): LocalStorageData => {
  const data: LocalStorageData = {}

  // Extract profile data
  try {
    const profileStr = localStorage.getItem('explainer-profile')
    if (profileStr) {
      data.profileData = JSON.parse(profileStr)
    }
  } catch (error) {
    console.error('Error extracting profile data:', error)
  }

  // Extract settings data
  try {
    const settingsStr = localStorage.getItem('explainer-settings')
    if (settingsStr) {
      data.settingsData = JSON.parse(settingsStr)
    }
  } catch (error) {
    console.error('Error extracting settings data:', error)
  }

  // Extract current book data
  try {
    const currentBookStr = localStorage.getItem('current-book')
    if (currentBookStr) {
      data.currentBookData = JSON.parse(currentBookStr)
    }
  } catch (error) {
    console.error('Error extracting current book data:', error)
  }

  // Extract bookmarks data
  try {
    const bookmarks: any[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('bookmark-')) {
        const value = localStorage.getItem(key)
        if (value) {
          // Extract book title and author from the key
          const keyParts = key.replace('bookmark-', '').split('-')
          // This is a simplified extraction - in practice, you might need more sophisticated parsing
          const bookTitle = keyParts.slice(0, -1).join(' ')
          const bookAuthor = keyParts[keyParts.length - 1]
          
          bookmarks.push({
            bookTitle,
            bookAuthor,
            scrollPosition: parseInt(value)
          })
        }
      }
    }
    data.bookmarksData = bookmarks
  } catch (error) {
    console.error('Error extracting bookmarks data:', error)
  }

  return data
}

export const migrateToDatabase = async (data: LocalStorageData): Promise<boolean> => {
  try {
    const response = await fetch('/api/migrate-localstorage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Migration successful:', result)
      return true
    } else {
      console.error('Migration failed:', response.statusText)
      return false
    }
  } catch (error) {
    console.error('Error during migration:', error)
    return false
  }
}

export const clearLocalStorageData = (): void => {
  try {
    // Clear all explainer-related localStorage data
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key === 'explainer-profile' ||
        key === 'explainer-settings' ||
        key === 'current-book' ||
        key.startsWith('bookmark-')
      )) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log('Cleared localStorage data:', keysToRemove)
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

// Hook for easy migration
export const useLocalStorageMigration = () => {
  const { data: session, status } = useSession()

  const runMigration = async (): Promise<boolean> => {
    if (status === 'loading' || !session?.user?.email) {
      console.log('User not authenticated, skipping migration')
      return false
    }

    const localStorageData = extractLocalStorageData()
    
    // Check if there's any data to migrate
    const hasData = localStorageData.profileData || 
                   localStorageData.settingsData || 
                   localStorageData.currentBookData || 
                   (localStorageData.bookmarksData && localStorageData.bookmarksData.length > 0)

    if (!hasData) {
      console.log('No localStorage data to migrate')
      return false
    }

    console.log('Found localStorage data to migrate:', localStorageData)
    const success = await migrateToDatabase(localStorageData)
    
    if (success) {
      console.log('Migration successful, clearing localStorage data')
      clearLocalStorageData()
    }
    
    return success
  }

  return { runMigration }
}











