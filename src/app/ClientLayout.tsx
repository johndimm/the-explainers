'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SessionProvider, signOut, useSession, getSession } from 'next-auth/react'
import { AuthenticatedProfileProvider } from '@/contexts/AuthenticatedProfileContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { BookCacheProvider, useBookCache } from '@/contexts/BookCacheContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import '@/utils/vercel-debug'

interface ClientLayoutProps {
  children: React.ReactNode
  requiresAuth?: boolean
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [subtitle, setSubtitle] = useState('understand difficult texts')
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { cachedBook } = useBookCache()
  const { data: session, status } = useSession()
  
  // Debug logging for authentication status
  useEffect(() => {
    console.log('🔐 Auth Status Debug:', {
      status,
      hasSession: !!session,
      sessionUser: session?.user,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
      isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
      isVercel: window.location.hostname.includes('vercel'),
      environment: process.env.NODE_ENV,
      hostname: window.location.hostname
    })
  }, [session, status])

  // Force re-render when session changes
  const [authKey, setAuthKey] = useState(0)
  useEffect(() => {
    setAuthKey(prev => prev + 1)
  }, [session])

  // Manual session refresh function
  const refreshSession = async () => {
    console.log('🔐 Manually refreshing session...')
    const newSession = await getSession()
    console.log('🔐 Refreshed session:', {
      hasSession: !!newSession,
      sessionUser: newSession?.user?.email,
      timestamp: new Date().toISOString()
    })
  }

  // Check session periodically (every 2 seconds) for a short time after page load
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentSession = await getSession()
      if (currentSession && !session) {
        console.log('🔐 Session detected via polling, forcing refresh')
        window.location.reload() // Force full page refresh to update all components
      }
    }, 2000)

    // Clear interval after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [session])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Set subtitle based on current page and book
  useEffect(() => {
    if (pathname === '/reader' && cachedBook?.title) {
      setSubtitle(`reading ${cachedBook.title} by ${cachedBook.author}`)
    } else if (pathname === '/chat' && cachedBook?.title) {
      setSubtitle(`discussing ${cachedBook.title} by ${cachedBook.author}`)
    } else if (pathname === '/reader') {
      setSubtitle('read and select text')
    } else if (pathname === '/chat') {
      setSubtitle('get explanations')
    } else if (pathname === '/library') {
      setSubtitle('browse books')
    } else if (pathname === '/styles') {
      setSubtitle('choose explanation style')
    } else if (pathname === '/credits') {
      setSubtitle('manage credits')
    } else if (pathname === '/profile') {
      setSubtitle('view profile')
    } else if (pathname === '/settings') {
      setSubtitle('adjust settings')
    } else {
      setSubtitle('understand difficult texts')
    }
  }, [pathname, cachedBook])

  const handleMobileMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('ClientLayout: showMobileMenu changed to:', !showMobileMenu)
    setShowMobileMenu(!showMobileMenu)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setShowMobileMenu(false)
  }

  const handleLogout = async () => {
    setShowMobileMenu(false)
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div>
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
                type="button"
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
              >
                r/TheExplainersApp
              </button>
          </div>
          <p style={{ 
            margin: '2px 0 0 0', 
            fontSize: '11px', 
            color: '#666',
            lineHeight: '1.2'
          }}>
            {subtitle}
          </p>
        </div>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            type="button"
            onClick={handleMobileMenuToggle}
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#333' }}
          >
            ☰
          </button>
          {showMobileMenu && (
            <div key={authKey} style={{ 
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
              <button type="button" onClick={() => handleNavigation('/reader')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📖 Reader</button>
              <button type="button" onClick={() => handleNavigation('/chat')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💬 Chat</button>
              <button type="button" onClick={() => handleNavigation('/library')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📚 Library</button>

              <button type="button" onClick={() => handleNavigation('/styles')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>🎭 Styles</button>
              <button type="button" onClick={() => handleNavigation('/credits')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💳 Credits</button>
              <button type="button" onClick={() => handleNavigation('/profile')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>👤 Profile</button>
              <button type="button" onClick={() => handleNavigation('/settings')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>⚙️ Settings</button>
              <button type="button" onClick={() => handleNavigation('/guide')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📖 User Guide</button>
              <button type="button" onClick={() => handleNavigation('/about')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>ℹ️ About</button>
              <button type="button" onClick={() => handleNavigation('/demo')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>🗯️ Demo</button>
              {(() => {
                console.log('🔐 Hamburger menu render - session check:', {
                  hasSession: !!session,
                  sessionUser: session?.user?.email,
                  status,
                  timestamp: new Date().toISOString()
                })
                return session ? (
                  <button type="button" onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#dc2626' }}>🚪 Logout</button>
                ) : (
                  <button type="button" onClick={() => handleNavigation('/auth/signin')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#059669' }}>🔑 Log in</button>
                )
              })()}
            </div>
          )}
        </div>
        </div>
      </header>

      <main style={{ 
        minHeight: 'calc(100vh - 60px)',
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {children}
      </main>
    </div>
  )
}

export default function ClientLayout({ children, requiresAuth = false }: ClientLayoutProps) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <BookCacheProvider>
          <SettingsProvider>
            <LayoutContent>
              {children}
            </LayoutContent>
          </SettingsProvider>
        </BookCacheProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}