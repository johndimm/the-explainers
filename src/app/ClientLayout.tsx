'use client'

import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [subtitle, setSubtitle] = useState<string>('understand difficult texts')
  


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

  return (
    <ProfileProvider>
      <SettingsProvider>
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
                  <button onClick={() => { router.push('/demo'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>🗯️ Demo</button>
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
      </SettingsProvider>
    </ProfileProvider>
  )
}