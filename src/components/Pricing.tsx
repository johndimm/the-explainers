'use client'

import React from 'react'
import { useProfile } from '../contexts/ProfileContext'

interface PricingProps {
  isOpen: boolean
  onClose: () => void
  bookTitle?: string
  author?: string
}

const Pricing: React.FC<PricingProps> = ({ isOpen, onClose, bookTitle, author }) => {
  const { profile, addCredits, purchaseBook } = useProfile()

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#8b5cf6' }}>Get More Explanations</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {profile.availableCredits || 0}
          </div>
          <div style={{ color: '#666' }}>Credits Remaining</div>
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
  )
}

export default Pricing