'use client'

import React from 'react'
import { useProfile } from '../contexts/ProfileContext'

interface PricingProps {
  isOpen: boolean
  onClose: () => void
  bookTitle?: string
  author?: string
  isPageMode?: boolean
}

const Pricing: React.FC<PricingProps> = ({ isOpen, onClose, bookTitle, author, isPageMode = false }) => {
  const { profile, addCredits, purchaseBook, grantUnlimitedAccess } = useProfile()

  if (!isOpen) return null

  const handlePurchaseBook = () => {
    if (bookTitle && author) {
      purchaseBook(bookTitle, author)
      onClose()
    }
  }

  const handlePurchaseCredits = (amount: number) => {
    addCredits(amount)
    onClose()
  }

  const handleUnlimitedAccess = (duration: 'hour' | 'month' | 'year') => {
    console.log('Pricing: granting unlimited access for duration:', duration)
    grantUnlimitedAccess(duration)
    
    // Small delay to ensure profile context has updated before closing
    setTimeout(() => {
      onClose()
    }, 100)
  }

  const containerStyle = isPageMode ? {
    minHeight: '100vh',
    background: '#fafafa',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start'
  } : {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  }

  const contentStyle = isPageMode ? {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
  } : {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <header style={{
          display: 'flex',
          justifyContent: isPageMode ? 'center' : 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
          borderRadius: '16px 16px 0 0',
          background: '#f8f9fa',
          flexShrink: 0
        }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#333',
            lineHeight: '1.2',
            textAlign: isPageMode ? 'center' : 'left'
          }}>
            Credits & Usage
          </h1>
        </div>
        {!isPageMode && (
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        )}
        </header>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}>
          {/* Free Demo Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉 Currently FREE!</div>
            <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600' }}>
              All explanations are free during our demo period
            </div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>
              No actual payments will be processed • Try unlimited explanations now
            </div>
          </div>

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
              Member since: {new Date(profile.firstLogin).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
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
              // Navigate to settings page instead of showing alert
              if (typeof window !== 'undefined') {
                window.location.href = '/settings'
              }
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