'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '../contexts/ProfileContext'

interface PricingProps {
  isOpen: boolean
  onClose: () => void
  bookTitle?: string
  author?: string
}

const Pricing: React.FC<PricingProps> = ({ isOpen, onClose, bookTitle, author }) => {
  const { profile, addCredits, purchaseBook } = useProfile()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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

  if (!isOpen) return null

  const handlePurchaseBook = () => {
    if (bookTitle && author) {
      purchaseBook(bookTitle, author)
      alert(`Successfully purchased unlimited access to "${bookTitle}"! (Demo mode - no actual payment processed)`)
      onClose()
    }
  }

  const handlePurchaseCredits = (amount: number) => {
    addCredits(amount)
    alert(`Successfully added ${amount} credits! (Demo mode - no actual payment processed)`)
    onClose()
  }

  const handleUnlimitedAccess = (duration: string) => {
    alert(`Unlimited ${duration} access coming soon! For now, try using your own LLM in Settings for free access.`)
  }

  return (
    <div>
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
            fontStyle: 'italic',
            lineHeight: '1.2'
          }}>
            understand difficult texts
          </p>
        </div>
        {/* Hamburger menu for all devices */}
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
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📖 User Guide
              </button>
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
                  cursor: 'pointer'
                }}
              >
                ⚙️ Settings
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div style={{ marginTop: '50px' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '600px',
          width: '100%',
          margin: '20px auto',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: '#8b5cf6' }}>Usage & Credits</h2>
          </div>

        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '24px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>
                {profile.availableCredits || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Available Credits</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
                {profile.totalExplanations || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Explanations</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
                {profile.todayExplanations || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Today</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>
                {profile.purchasedBooks?.length || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Books Owned</div>
            </div>
          </div>
          
          {profile.firstLogin && (
            <div style={{ textAlign: 'center', fontSize: '14px', color: '#666', paddingTop: '16px', borderTop: '1px solid #e9ecef' }}>
              Member since: {new Date(profile.firstLogin).toLocaleDateString()}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1a1a1a' }}>Get More Explanations</h3>
        </div>

        {bookTitle && author && (
          <div style={{
            background: '#f0f9ff',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#10b981' }}>📚 Unlimited Book Access - $5</h3>
            <p style={{ margin: '0 0 16px 0', color: '#666' }}>
              Get unlimited explanations for "<strong>{bookTitle}</strong>" by {author}
            </p>
            <button
              onClick={handlePurchaseBook}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              Buy This Book - $5
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#8b5cf6' }}>💳 Credits - $5</h3>
            <p style={{ margin: '0 0 16px 0', color: '#666' }}>
              100 credits to use across any books (1 credit = 1 explanation)
            </p>
            <button
              onClick={() => handlePurchaseCredits(100)}
              style={{
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              Buy 100 Credits - $5
            </button>
          </div>

          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#f59e0b' }}>⚡ Unlimited Access</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                onClick={() => handleUnlimitedAccess('hour')}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
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
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
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
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                1 Year - $25
              </button>
            </div>
          </div>
        </div>

        <div style={{
          background: '#fff3cd',
          border: '2px solid #ffeaa7',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#f59e0b' }}>🔧 Bring Your Own LLM - FREE!</h3>
          <p style={{ margin: '0 0 16px 0', color: '#666' }}>
            Use your own OpenAI, Anthropic, or other API key for unlimited free explanations
          </p>
          <button
            onClick={() => {
              onClose()
              // This would open settings - for now just alert
              alert('Go to Settings → Language Model → Bring Your Own LLM to set up your API key')
            }}
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Set Up Your Own LLM
          </button>
        </div>

        <div style={{ 
          marginTop: '24px', 
          fontSize: '12px', 
          color: '#666', 
          textAlign: 'center' 
        }}>
          <p>💡 Each book gives you 3 free explanations to try before purchasing</p>
          <p>🔒 All purchases are currently in demo mode</p>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Pricing