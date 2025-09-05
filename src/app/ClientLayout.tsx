'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { AuthenticatedProfileProvider } from '@/contexts/AuthenticatedProfileContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { BookCacheProvider, useBookCache } from '@/contexts/BookCacheContext'

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
              <button type="button" onClick={() => handleNavigation('/reader')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📖 Reader</button>
              <button type="button" onClick={() => handleNavigation('/chat')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💬 Chat</button>
              <button type="button" onClick={() => handleNavigation('/library')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📚 Library</button>

              <button type="button" onClick={() => handleNavigation('/styles')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>🎭 Styles</button>
              <button type="button" onClick={() => handleNavigation('/credits')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💳 Credits</button>
              <button type="button" onClick={() => handleNavigation('/profile')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>👤 Profile</button>
              <button type="button" onClick={() => handleNavigation('/settings')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>⚙️ Settings</button>
              <button type="button" onClick={() => handleNavigation('/guide')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📖 User Guide</button>
              <button type="button" onClick={() => handleNavigation('/about')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>ℹ️ About</button>
              <button type="button" onClick={() => handleNavigation('/demo')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>🗯️ Demo</button>
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
    <SessionProvider>
      <BookCacheProvider>
        <SettingsProvider>
          <AuthenticatedProfileProvider>
            <LayoutContent>
              {children}
            </LayoutContent>
          </AuthenticatedProfileProvider>
        </SettingsProvider>
      </BookCacheProvider>
    </SessionProvider>
  )
}