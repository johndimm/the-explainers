'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext'

function CreditsContent() {
  const router = useRouter()
  const [currentBook, setCurrentBook] = useState({ title: '', author: '' })
  const { profile, addCredits, purchaseBook, grantUnlimitedAccess } = useProfile()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMobileMenu])

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

  // Update current time every minute for countdown display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const handlePurchaseBook = () => {
    if (currentBook.title && currentBook.author) {
      purchaseBook(currentBook.title, currentBook.author)
      router.push('/reader')
    }
  }

  const handlePurchaseCredits = (amount: number) => {
    addCredits(amount)
    router.push('/reader')
  }

  const handleUnlimitedAccess = (duration: 'hour' | 'month' | 'year') => {
    console.log('Credits page: granting unlimited access for duration:', duration)
    grantUnlimitedAccess(duration)
    
    // Small delay to ensure profile context has updated before navigating
    setTimeout(() => {
      router.push('/reader')
    }, 100)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-padding {
            padding: 8px !important;
          }
        }
      `}</style>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '8px 12px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#333',
            lineHeight: '1.2'
          }}>
            The Explainers
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '11px', 
            color: '#666',
            lineHeight: '1.2'
          }}>
            Credits & Usage
          </p>
        </div>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#333'
            }}
          >
            ☰
          </button>
          
          {showMobileMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '160px',
              zIndex: 1000
            }}>
              <button 
                onClick={() => {
                  router.push('/reader')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📖 Reader
              </button>
              <button 
                onClick={() => {
                  router.push('/chat')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                💬 Chat
              </button>
              <button 
                onClick={() => {
                  router.push('/library')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📚 Library
              </button>
              <button 
                onClick={() => {
                  router.push('/styles')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                🎭 Styles
              </button>
              <button 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  color: '#666'
                }}
              >
                💳 Credits (current)
              </button>
              <button 
                onClick={() => {
                  router.push('/profile')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                👤 Profile
              </button>
              <button 
                onClick={() => {
                  router.push('/settings')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                ⚙️ Settings
              </button>
              <button 
                onClick={() => {
                  router.push('/guide')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                📖 User Guide
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', marginTop: '60px' }} className="mobile-padding">
        {/* Free Demo Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '32px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎉 Currently FREE!</div>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>
            All explanations are free during our demo period
          </div>
          <div style={{ fontSize: '16px', opacity: '0.9' }}>
            No actual payments will be processed • Try unlimited explanations now
          </div>
        </div>

        {/* Usage Stats */}
        <div style={{ 
          background: 'white', 
          padding: '32px', 
          borderRadius: '16px', 
          marginBottom: '32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#333' }}>Your Usage</h2>
            {currentBook.title && (
              <p style={{ margin: '0', color: '#8b5cf6', fontSize: '14px', fontWeight: '500' }}>
                Currently reading: {currentBook.title} {currentBook.author ? `by ${currentBook.author}` : ''}
              </p>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '24px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>
                {profile.availableCredits || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Available Credits</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                {profile.totalExplanations || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Explanations</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
                {profile.todayExplanations || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Today</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
                {profile.purchasedBooks?.length || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Books Owned</div>
            </div>
          </div>
          
          {/* Unlimited Access Status */}
          {profile.hasUnlimitedAccess && profile.unlimitedAccessExpiry && new Date() < new Date(profile.unlimitedAccessExpiry) && (
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '8px', fontWeight: '600' }}>⚡ Unlimited Access Active!</div>
              <div style={{ fontSize: '14px', opacity: '0.9' }}>
                {(() => {
                  const expiry = new Date(profile.unlimitedAccessExpiry!)
                  const msRemaining = expiry.getTime() - currentTime.getTime()
                  const minutesRemaining = Math.ceil(msRemaining / (1000 * 60))
                  
                  if (minutesRemaining > 60) {
                    const hoursRemaining = Math.ceil(minutesRemaining / 60)
                    return `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} remaining`
                  } else {
                    return `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining`
                  }
                })()}
              </div>
            </div>
          )}
          
          {profile.firstLogin && (
            <div style={{ textAlign: 'center', fontSize: '14px', color: '#666', paddingTop: '20px', borderTop: '1px solid #f0f0f0', marginTop: '20px' }}>
              Member since: {new Date(profile.firstLogin).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          )}
        </div>

        {/* Purchase Options */}
        <div style={{ 
          background: 'white', 
          padding: '32px', 
          borderRadius: '16px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
        }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', color: '#333' }}>Get More Explanations</h2>

          {/* Book Purchase */}
          {currentBook.title && currentBook.author && (
            <div style={{
              background: '#f0f9ff',
              border: '2px solid #10b981',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#10b981', fontSize: '18px' }}>📚 Unlimited Book Access - $5</h3>
              <p style={{ margin: '0 0 16px 0', color: '#666' }}>
                Get unlimited explanations for "<strong>{currentBook.title}</strong>" {currentBook.author ? `by ${currentBook.author}` : ''}
              </p>
              <button
                onClick={handlePurchaseBook}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  width: '100%'
                }}
              >
                Buy This Book - $5
              </button>
            </div>
          )}

          {/* Other Options */}
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* Credits */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#8b5cf6', fontSize: '18px' }}>💳 Credits - $5</h3>
              <p style={{ margin: '0 0 16px 0', color: '#666' }}>
                100 credits to use across any books (1 credit = 1 explanation)
              </p>
              <button
                onClick={() => handlePurchaseCredits(100)}
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  width: '100%'
                }}
              >
                Buy 100 Credits - $5
              </button>
            </div>

            {/* Unlimited Access */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#f59e0b', fontSize: '18px' }}>⚡ Unlimited Access</h3>
              <p style={{ margin: '0 0 16px 0', color: '#666' }}>
                Unlimited explanations for all books
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => handleUnlimitedAccess('hour')}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  1 Hour - $1
                </button>
                <button
                  onClick={() => handleUnlimitedAccess('month')}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  1 Month - $5
                </button>
                <button
                  onClick={() => handleUnlimitedAccess('year')}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  1 Year - $25
                </button>
              </div>
            </div>
          </div>

          {/* Bring Your Own LLM */}
          <div style={{
            background: '#fff3cd',
            border: '2px solid #ffeaa7',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            marginTop: '24px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#f59e0b', fontSize: '18px' }}>🔧 Bring Your Own LLM - FREE!</h3>
            <p style={{ margin: '0 0 16px 0', color: '#666' }}>
              Use your own OpenAI, Anthropic, or other API key for unlimited free explanations
            </p>
            <button
              onClick={() => router.push('/settings')}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Set Up Your Own LLM
            </button>
          </div>

          <div style={{ 
            marginTop: '32px', 
            fontSize: '14px', 
            color: '#666', 
            textAlign: 'center' 
          }}>
            <p>💡 Each book gives you 3 free explanations to try before purchasing</p>
            <p>🔒 All purchases are currently in demo mode</p>
          </div>
        </div>
      </main>
    </div>
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