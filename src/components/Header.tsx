'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, signIn, signOut: handleSignOut } = useAuth()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [subtitle, setSubtitle] = useState<string>('understand difficult texts')

  // Debug authentication state
  console.log('Header: Auth state - isAuthenticated:', isAuthenticated, 'user:', user, 'isLoading:', isLoading)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }
    if (showMobileMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMobileMenu])

  useEffect(() => {
    // Update subtitle for reader if we have a current book
    if (typeof window === 'undefined') return
    const path = window.location.pathname
    if (path.startsWith('/reader')) {
      try {
        const saved = localStorage.getItem('current-book')
        if (saved) {
          const { title, author } = JSON.parse(saved)
          if (title && author) setSubtitle(`${title} by ${author}`)
        }
      } catch {}
    } else {
      setSubtitle('understand difficult texts')
    }
  }, [])

  const handleAuthAction = async () => {
    alert('BUTTON CLICKED! This should appear when you click sign-out')
    console.log('🚨 BUTTON CLICKED! handleAuthAction called, isAuthenticated:', isAuthenticated)
    if (isAuthenticated) {
      console.log('🚨 Header: Calling handleSignOut')
      await handleSignOut()
    } else {
      console.log('🚨 Header: Calling signIn')
      await signIn()
    }
    console.log('🚨 Header: Closing mobile menu')
    setShowMobileMenu(false)
  }

  return (
    <header style={{
      background: 'white', borderBottom: '1px solid #e0e0e0',
      maxWidth: '1024px',
      margin: '0 auto',
      width: '100%'
    }}>
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333', lineHeight: '1.2' }}>The Explainers</h1>
            <button
              onClick={() => window.open('https://reddit.com/r/TheExplainersApp', '_blank')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                color: '#ff6b35',
                fontWeight: '500',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff5f2'
                e.currentTarget.style.color = '#e55a2b'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = '#ff6b35'
              }}
              title="Join our Reddit community"
            >
              <span style={{ fontSize: '8px' }}>🔗</span>
              Reddit
            </button>
            
            <button
              onClick={() => window.open('https://github.com/johndimm/the-explainers/discussions', '_blank')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                color: '#2ea44f',
                fontWeight: '500',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f9f0'
                e.currentTarget.style.color = '#2c974b'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = '#2ea44f'
              }}
              title="Join our GitHub Discussions community"
            >
              <span style={{ fontSize: '8px' }}>🐙</span>
              GitHub
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#666', lineHeight: '1.2' }}>
            {subtitle}
          </p>
        </div>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#333' }}
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
              minWidth: '200px', 
              zIndex: 1000,
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <button onClick={() => { router.push('/reader'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📖 Reader</button>
              <button onClick={() => { router.push('/chat'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💬 Chat</button>
              <button onClick={() => { router.push('/library'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📚 Library</button>

              <button onClick={() => { router.push('/styles'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>🎭 Styles</button>
              <button onClick={() => { router.push('/credits'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💳 Credits</button>
              <button onClick={() => { router.push('/profile'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>👤 Profile</button>
              <button onClick={() => { router.push('/settings'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>⚙️ Settings</button>
              <button onClick={() => { router.push('/guide'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📖 User Guide</button>
              <button onClick={() => { router.push('/about'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>ℹ️ About</button>
              <button onClick={() => { router.push('/demo'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>🗯️ Demo</button>
              
              {/* Auth buttons */}
              <div style={{ borderTop: '1px solid #e0e0e0', marginTop: '8px', paddingTop: '8px' }}>
                {isAuthenticated ? (
                  <>
                    <div style={{ padding: '8px 16px', fontSize: '12px', color: '#666', borderBottom: '1px solid #f0f0f0' }}>
                      {user?.image && (
                        <img 
                          src={user.image} 
                          alt={user.name || 'User'} 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            marginRight: '8px',
                            verticalAlign: 'middle'
                          }} 
                        />
                      )}
                      {user?.email}
                    </div>
                    <button 
                      onClick={handleAuthAction}
                      disabled={isLoading}
                      style={{ 
                        display: 'block', 
                        width: '100%', 
                        padding: '12px 16px', 
                        background: 'none', 
                        border: 'none', 
                        textAlign: 'left', 
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        color: '#dc3545',
                        opacity: isLoading ? 0.6 : 1
                      }}
                    >
                      {isLoading ? 'Signing out...' : '🚪 Sign Out'}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleAuthAction}
                    disabled={isLoading}
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      padding: '12px 16px', 
                      background: 'none', 
                      border: 'none', 
                      textAlign: 'left', 
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      color: '#4285f4',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    {isLoading ? 'Signing in...' : '🔑 Sign In'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
