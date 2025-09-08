'use client'

import Library from '@/components/Library'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext'

function LibraryContent() {
  const router = useRouter()
  const { purchaseBook } = useProfile()
  const [showPurchaseConfirmation, setShowPurchaseConfirmation] = useState(false)
  const [purchasedBook, setPurchasedBook] = useState<{title: string, author: string} | null>(null)

  const handleBookSelect = (title: string, author: string, url: string) => {
    // Navigate to reader with book data
    try {
      purchaseBook(title, author, url)
      
      // Show confirmation
      setPurchasedBook({ title, author })
      setShowPurchaseConfirmation(true)
      
      // Hide confirmation after 3 seconds
      setTimeout(() => {
        setShowPurchaseConfirmation(false)
        setPurchasedBook(null)
      }, 3000)
    } catch {}
    router.push(`/reader?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&url=${encodeURIComponent(url)}`)
  }

  const handleBackToCurrentBook = () => {
    router.push('/reader')
  }

  return (
    <>
      <Library 
        onBookSelect={handleBookSelect}
        onBackToCurrentBook={handleBackToCurrentBook}
      />
      
      {/* Purchase Confirmation Modal */}
      {showPurchaseConfirmation && purchasedBook && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            margin: '20px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              ✅
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              margin: '0 0 12px 0'
            }}>
              Book Purchased!
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#666',
              margin: '0 0 8px 0'
            }}>
              <strong>{purchasedBook.title}</strong> by {purchasedBook.author}
            </p>
            <p style={{
              fontSize: '14px',
              color: '#2ea44f',
              fontWeight: '500',
              margin: '0',
              background: '#f0f9f0',
              padding: '8px 16px',
              borderRadius: '6px',
              display: 'inline-block'
            }}>
              🎉 You now have unlimited access to this book!
            </p>
          </div>
        </div>
      )}
    </>
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