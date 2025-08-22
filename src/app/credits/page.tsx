'use client'

import { useState, useEffect } from 'react'
import Pricing from '@/components/Pricing'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'

function CreditsContent() {
  const router = useRouter()
  const [currentBook, setCurrentBook] = useState({ title: '', author: '' })

  useEffect(() => {
    // Get the current book from localStorage
    const savedBook = localStorage.getItem('current-book')
    if (savedBook) {
      try {
        const parsedBook = JSON.parse(savedBook)
        setCurrentBook({ title: parsedBook.title || '', author: parsedBook.author || '' })
      } catch (error) {
        console.error('Error loading current book:', error)
      }
    }
  }, [])

  return (
    <Pricing
      isOpen={true}
      onClose={() => router.push('/reader')}
      bookTitle={currentBook.title}
      author={currentBook.author}
    />
  )
}

export default function CreditsPage() {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <CreditsContent />
      </SettingsProvider>
    </ProfileProvider>
  )
}