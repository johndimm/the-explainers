'use client'

import Library from '@/components/Library'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrentBook } from '@/utils/currentBookStorage'
import { useEffect, useState } from 'react'
import { log } from '@/utils/log'

function LibraryContent() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkCurrentBook = async () => {
      try {
        // Wait for auth to be ready
        if (isLoading) return

        // Check for current book (getCurrentBook handles auth internally)
        log('ui', 'Library: Checking for current book...')
        const currentBook = await getCurrentBook()
        
        if (currentBook && currentBook.title && currentBook.author) {
          log('ui', 'Library: Found current book, redirecting to reader:', currentBook.title)
          router.push('/reader')
          return
        }
        
        // No current book found, show library
        log('ui', 'Library: No current book found, showing library')
        setIsChecking(false)
      } catch (error) {
        log('ui', 'Library: Error checking current book:', error)
        setIsChecking(false)
      }
    }

    checkCurrentBook()
  }, [router, isLoading])

  const handleBookSelect = (title: string, author: string, url: string) => {
    // Navigate to reader with book data
    router.push(`/reader?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&url=${encodeURIComponent(url)}`)
  }

  const handleBackToCurrentBook = () => {
    router.push('/reader')
  }

  // Show loading while checking for current book
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="card text-center">
          <div className="card-body">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="m-0 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Library 
      onBookSelect={handleBookSelect}
      onBackToCurrentBook={handleBackToCurrentBook}
    />
  )
}

export default function LibraryPage() {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <LibraryContent />
      </SettingsProvider>
    </ProfileProvider>
  )
}