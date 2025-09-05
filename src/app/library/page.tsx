'use client'

import Library from '@/components/Library'
import { useRouter } from 'next/navigation'

function LibraryContent() {
  const router = useRouter()
  
  // Debug: Log when component renders
  console.log('Library page: Component rendering')

  const handleBookSelect = (title: string, author: string, url: string) => {
    // Navigate to reader with book data
    try {
      // Save current-book and persist purchase details URL for later deep-linking
      localStorage.setItem('current-book', JSON.stringify({ title, author, url }))
      // Note: Book access tracking would happen when user signs in to chat
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
  return <LibraryContent />
}