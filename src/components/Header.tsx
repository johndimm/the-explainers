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
  const headerRef = useRef<HTMLElement>(null)
  const [subtitle, setSubtitle] = useState<string>('understand difficult texts')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0)
  const [totalSearchResults, setTotalSearchResults] = useState(0)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

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
    
    // Reset search index when performing new search
    setCurrentSearchIndex(0)
    setTotalSearchResults(0)
    
    // Dispatch search event for the current page to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('headerSearch', { 
        detail: { query: searchQuery, type: searchContext.type } 
      }))
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setCurrentSearchIndex(0)
    setTotalSearchResults(0)
    
    // Dispatch clear search event for the current page to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('headerClearSearch', { 
        detail: { type: searchContext.type } 
      }))
    }
  }

  const handleNextSearch = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('headerSearchNext', { 
        detail: { type: searchContext.type } 
      }))
    }
  }

  const handlePrevSearch = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('headerSearchPrev', { 
        detail: { type: searchContext.type } 
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

  // Keep a CSS variable with the current header height for layout spacing
  useEffect(() => {
    const updateHeaderHeightVar = () => {
      if (headerRef.current) {
        const h = headerRef.current.offsetHeight
        document.documentElement.style.setProperty('--app-header-height', `${h}px`)
      }
    }
    updateHeaderHeightVar()
    window.addEventListener('resize', updateHeaderHeightVar)
    const interval = setInterval(updateHeaderHeightVar, 300) // catch font/async changes briefly
    setTimeout(() => clearInterval(interval), 2000)
    return () => {
      window.removeEventListener('resize', updateHeaderHeightVar)
      clearInterval(interval)
    }
  }, [subtitle, pathname, showMobileMenu])

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

  // Listen for search result updates from text readers
  useEffect(() => {
    const handleSearchResultUpdate = (event: CustomEvent) => {
      if (event.detail.type === 'text') {
        setCurrentSearchIndex(event.detail.currentIndex || 0)
        setTotalSearchResults(event.detail.totalResults || 0)
      }
    }

    window.addEventListener('searchResultUpdate', handleSearchResultUpdate as EventListener)
    return () => window.removeEventListener('searchResultUpdate', handleSearchResultUpdate as EventListener)
  }, [])

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      setShowSignOutConfirm(true)
      setShowMobileMenu(false)
    } else {
      await signIn()
      setShowMobileMenu(false)
    }
  }

  const handleConfirmSignOut = async () => {
    setShowSignOutConfirm(false)
    await handleSignOut()
  }

  const handleCancelSignOut = () => {
    setShowSignOutConfirm(false)
  }

  return (
    <header 
      ref={headerRef}
      className="app-header"
      style={{
      background: 'white', 
      borderBottom: '1px solid #e0e0e0',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 99999,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div className="container" style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '8px 20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '40px' }}>
            <h1 
              onClick={() => router.push('/')}
              style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#333', 
                lineHeight: '1.2',
                cursor: 'pointer'
              }}
            >
              The Explainers
            </h1>
            
            {searchContext.show && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault()
                      if (e.key === 'ArrowUp') {
                        handlePrevSearch()
                      } else {
                        handleNextSearch()
                      }
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '100%',
                    backgroundColor: 'white',
                    color: 'black',
                    paddingRight: searchQuery ? '70px' : '40px' // Make room for clear button and arrows
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.currentTarget.focus()
                  }}
                  autoFocus={false}
                  readOnly={false}
                  disabled={false}
                />
                <div style={{
                  position: 'absolute',
                  right: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      style={{
                        width: '16px',
                        height: '16px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: '#f0f0f0'
                      }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={handlePrevSearch}
                      disabled={currentSearchIndex === 0}
                      style={{
                        width: '16px',
                        height: '12px',
                        border: 'none',
                        background: 'none',
                        cursor: currentSearchIndex === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '10px',
                        color: currentSearchIndex === 0 ? '#ccc' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={`Previous result (${currentSearchIndex}/${totalSearchResults})`}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSearch}
                      disabled={currentSearchIndex >= totalSearchResults - 1}
                      style={{
                        width: '16px',
                        height: '12px',
                        border: 'none',
                        background: 'none',
                        cursor: currentSearchIndex >= totalSearchResults - 1 ? 'not-allowed' : 'pointer',
                        fontSize: '10px',
                        color: currentSearchIndex >= totalSearchResults - 1 ? '#ccc' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={`Next result (${currentSearchIndex + 1}/${totalSearchResults})`}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#666', lineHeight: '1.2' }}>
            {subtitle}
          </p>
        </div>
        <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '40px', marginTop: '0' }}>
          <button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Hamburger clicked, current state:', showMobileMenu)
              setShowMobileMenu(!showMobileMenu)
            }}
            style={{ 
              padding: '8px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '18px', 
              color: '#333',
              zIndex: 100001
            }}
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
              <button onClick={() => { router.push('/examples'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📚 Examples</button>
              
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
{!showSignOutConfirm ? (
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
                    ) : (
                      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                          Sign Out
                        </div>
                        <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
                          Are you sure you want to sign out?
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={handleCancelSignOut}
                            style={{
                              flex: 1,
                              padding: '6px 12px',
                              fontSize: '12px',
                              border: '1px solid #ddd',
                              background: '#fff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#333'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmSignOut}
                            style={{
                              flex: 1,
                              padding: '6px 12px',
                              fontSize: '12px',
                              border: 'none',
                              background: '#dc3545',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#fff'
                            }}
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
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
