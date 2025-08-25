'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import LayoutRouter from './LayoutRouter'

interface AdaptiveAppLayoutProps {
  children: React.ReactNode
}

const AdaptiveAppLayout: React.FC<AdaptiveAppLayoutProps> = ({ children }) => {
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [displayBook, setDisplayBook] = useState<{ title: string; author: string }>({ title: '', author: '' })

  // Read current book from localStorage so header can mirror the active text in two-panel
  useEffect(() => {
    const updateFromStorage = () => {
      try {
        const saved = localStorage.getItem('current-book')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.title && parsed.author) {
            setDisplayBook((prev) => (
              prev.title !== parsed.title || prev.author !== parsed.author
                ? { title: parsed.title, author: parsed.author }
                : prev
            ))
          }
        }
      } catch {}
    }

    // Initial read and a few retries to catch async updates
    updateFromStorage()
    const t1 = setTimeout(updateFromStorage, 50)
    const t2 = setTimeout(updateFromStorage, 200)
    const t3 = setTimeout(updateFromStorage, 600)
    const t4 = setTimeout(updateFromStorage, 1200)

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'current-book') updateFromStorage()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Helper function for navigation that works in both one-panel and two-panel modes
  const navigateTo = (path: string) => {
    // Try panel navigation first (for two-panel mode)
    const panelEvent = new CustomEvent('navigateToPanel', { detail: { panel: path } })
    window.dispatchEvent(panelEvent)
    
    // Also update URL for consistency and one-panel fallback
    router.push(path)
    setShowMobileMenu(false)
  }

  // Close menu when clicking outside
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

  return (
    <div style={{ height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      {/* Global Persistent Header - always visible */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        padding: '12px 16px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
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
          {displayBook.title && (
            <p style={{ 
              margin: 0, 
              fontSize: '11px', 
              color: '#666',
              lineHeight: '1.2'
            }}>
              {displayBook.title} by {displayBook.author}
            </p>
          )}
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
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
                minWidth: '180px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
              <button 
                onClick={() => navigateTo('/reader')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  transition: 'background-color 0.15s ease',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.04)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                📖 Reader
              </button>
              <button 
                onClick={() => navigateTo('/chat')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                  transition: 'background-color 0.15s ease',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.04)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
              >
                💬 Chat
              </button>
              {[
                { path: '/library', emoji: '📚', label: 'Library' },
                { path: '/styles', emoji: '🎭', label: 'Styles' },
                { path: '/credits', emoji: '💳', label: 'Credits' },
                { path: '/profile', emoji: '👤', label: 'Profile' },
                { path: '/settings', emoji: '⚙️', label: 'Settings' },
                { path: '/guide', emoji: '📖', label: 'User Guide' }
              ].map(({ path, emoji, label }) => (
                <button 
                  key={path}
                  onClick={() => navigateTo(path)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '14px 20px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#1a1a1a',
                    transition: 'background-color 0.15s ease',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.04)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content area - LayoutRouter handles one-panel vs two-panel logic */}
      <div style={{ 
        marginTop: '60px', 
        height: 'calc(100vh - 60px)'
      }}>
        <LayoutRouter>
          {children}
        </LayoutRouter>
      </div>
    </div>
  )
}

export default AdaptiveAppLayout