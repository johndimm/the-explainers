'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PWAInstaller from '@/components/PWAInstaller'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'

function HomeContent() {
  const router = useRouter()

  useEffect(() => {
    // Check if there's a saved current book
    const savedBook = localStorage.getItem('current-book')
    if (savedBook) {
      try {
        const parsedBook = JSON.parse(savedBook)
        if (parsedBook.url) {
          // Redirect to reader with book data
          router.push(`/reader?title=${encodeURIComponent(parsedBook.title)}&author=${encodeURIComponent(parsedBook.author)}&url=${encodeURIComponent(parsedBook.url)}`)
          return
        }
      } catch (error) {
        console.error('Error loading saved book:', error)
      }
    }
    
    // No saved book - redirect to library
    router.push('/library')
  }, [router])

  return (
    <div>
      <PWAInstaller />
    </div>
  )
}

export default function Home() {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <HomeContent />
      </SettingsProvider>
    </ProfileProvider>
  )
}