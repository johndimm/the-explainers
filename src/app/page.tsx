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
  const { isSinglePlay, playTitle, playAuthor, playFilename } = useTheme()
  const [isChecking, setIsChecking] = useState(true)
  const [currentBook, setCurrentBook] = useState<any>(null)

  useEffect(() => {
    const checkCurrentBook = async () => {
      try {
        const book = await getCurrentBook()
        setCurrentBook(book)
        
        if (isSinglePlay) {
          // For single play mode, go directly to reader
          router.push('/reader')
        } else if (book) {
          // If there's a current book, go to reader
          router.push('/reader')
        } else {
          // Otherwise, go to library
          router.push('/library')
        }
      } catch (error) {
        log('ui', 'Error checking current book:', error)
        router.push('/library')
      } finally {
        setIsChecking(false)
      }
    }

    checkCurrentBook()
  }, [isSinglePlay, router])

  // Show loading while checking
  if (isChecking || isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>
            🎭
          </div>
          
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            Romeo and Juliet Explained
          </h1>
          
          <p style={{
            margin: '0 0 32px 0',
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Loading...
          </p>
        </div>
      </div>
    )
  }

  // This should not be reached due to redirects above
  return null
}

export default function Home() {
  return <HomeContent />
}