'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrentBook } from '@/utils/currentBookStorage'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, signIn, signOut: handleSignOut } = useAuth()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [subtitle, setSubtitle] = useState<string>('understand difficult texts')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Determine search context based on current page
  const getSearchContext = () => {
    if (pathname === '/reader') return { show: true, placeholder: 'Search in text...', type: 'text' }
    if (pathname === '/library') return { show: true, placeholder: 'Search books...', type: 'books' }
    if (pathname === '/explainers') return { show: true, placeholder: 'Search people...', type: 'people' }
    return { show: false, placeholder: '', type: '' }
  }

  const searchContext = getSearchContext()

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    
    // Dispatch search event for the current page to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('headerSearch', { 
        detail: { query: searchQuery, type: searchContext.type } 
      }))
    }
  }

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
    // Update subtitle based on current book from database
    const updateSubtitle = async () => {
      try {
        const currentBook = await getCurrentBook()
        console.log('Header: Current book loaded:', currentBook)
        if (currentBook && currentBook.title && currentBook.author) {
          setSubtitle(`${currentBook.title} by ${currentBook.author}`)
        } else {
          setSubtitle('understand difficult texts')
        }
      } catch (error) {
        console.error('Error loading current book for header:', error)
        setSubtitle('understand difficult texts')
      }
    }

    updateSubtitle()

    // Listen for custom events that indicate book changes
    const handleBookChange = (event: CustomEvent) => {
      if (event.detail && event.detail.title && event.detail.author) {
        setSubtitle(`${event.detail.title} by ${event.detail.author}`)
      } else {
        setSubtitle('understand difficult texts')
      }
    }

    window.addEventListener('currentBookChanged', handleBookChange as EventListener)

    return () => {
      window.removeEventListener('currentBookChanged', handleBookChange as EventListener)
    }
  }, [])

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      const confirmed = window.confirm('Are you sure you want to sign out?')
      if (confirmed) {
        setShowMobileMenu(false)
        await handleSignOut()
      }
    } else {
      await signIn()
      setShowMobileMenu(false)
    }
  }

  return (
    <header 
      className="app-header"
      style={{
      background: 'white', 
      borderBottom: '1px solid #e0e0e0',
      maxWidth: '1024px',
      margin: '0 auto',
      width: '100%',
      position: 'fixed',
      top: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      isolation: 'isolate',
      willChange: 'transform'
    }}>
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '8px 20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '40px' }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333', lineHeight: '1.2' }}>The Explainers</h1>
            
            {searchContext.show && (
              <input
                type="text"
                placeholder={searchContext.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  outline: 'none',
                  height: '28px',
                  boxSizing: 'border-box',
                  minWidth: '120px'
                }}
              />
            )}
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#666', lineHeight: '1.2' }}>
            {subtitle}
          </p>
        </div>
        <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '40px', marginTop: '0' }}>
          <button 
            onClick={() => {
              console.log('Hamburger clicked, current state:', showMobileMenu)
              setShowMobileMenu(!showMobileMenu)
            }}
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#333' }}
          >
            ☰
          </button>
          {showMobileMenu && (
            <div 
              style={{ 
                position: 'absolute', 
                top: '100%',
                right: '0',
                background: 'white', 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                minWidth: '200px', 
                zIndex: 100000,
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
              onLoad={() => console.log('Mobile menu div loaded')}
            >
              <button onClick={() => { router.push('/reader'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📖 Reader</button>
              <button onClick={() => { router.push('/chat'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💬 Chat</button>
              <button onClick={() => { router.push('/library'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📚 Library</button>

              <button onClick={() => { router.push('/explainers'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>🎭 Explainers</button>
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
