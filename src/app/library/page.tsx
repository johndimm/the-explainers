'use client'

import Library from '@/components/Library'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'

function LibraryContent() {
  const router = useRouter()

  const handleBookSelect = (title: string, author: string, url: string) => {
    // Persist current book for the reader
    try {
      localStorage.setItem('current-book', JSON.stringify({ title, author, url }))
    } catch {}

    // Notify persistent reader (two-panel) to load without changing the right panel
    const loadEvent = new CustomEvent('loadBookFromLibrary', { detail: { title, author, url } })
    window.dispatchEvent(loadEvent)

    // In one-panel, navigate to the reader page
    const isTwoPanelLikely = typeof window !== 'undefined' && window.innerWidth >= 1000
    if (!isTwoPanelLikely) {
      router.push(`/reader?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&url=${encodeURIComponent(url)}`)
    }
  }

  const handleBackToCurrentBook = () => {
    router.push('/reader')
  }

  return (
    <Library 
      onBookSelect={handleBookSelect}
      // onBackToCurrentBook={handleBackToCurrentBook} // Removed for wide-screen layout
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