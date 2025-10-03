'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrentBook } from '@/utils/currentBookStorage'
import { log } from '@/utils/log'
import { useTheme } from '@/hooks/useTheme'

function HomeContent() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // Wait for auth to be ready
        if (isLoading) return

        // Check for current book (getCurrentBook handles auth internally)
        const currentBook = await getCurrentBook()
        
        if (currentBook && currentBook.title && currentBook.author) {
          log('ui', 'Home: Found current book, redirecting to reader:', currentBook.title)
          router.push('/reader')
          return
        }
        
        // No current book found, redirect to library
        log('ui', 'Home: No current book found, redirecting to library')
        router.push('/library')
      } catch (error) {
        log('ui', 'Home: Error checking current book:', error)
        // Fallback to library on error
        router.push('/library')
      } finally {
        setIsChecking(false)
      }
    }

    checkAndRedirect()
  }, [router, isLoading])

  // Show loading while checking
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
    <div>
      {/* This should not render as we always redirect */}
    </div>
  )
}

export default function Home() {
  return <HomeContent />
}