'use client'

import Library from '@/components/Library'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext'

function LibraryContent() {
  const router = useRouter()
  const { purchaseBook } = useProfile()

  const handleBookSelect = (title: string, author: string, url: string) => {
    // Navigate to reader with book data
    try {
      // Save current-book and persist purchase details URL for later deep-linking
      localStorage.setItem('current-book', JSON.stringify({ title, author, url }))
      purchaseBook(title, author, url)
    } catch {}
    router.push(`/reader?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&url=${encodeURIComponent(url)}`)
  }

  const handleBackToCurrentBook = () => {
    router.push('/reader')
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