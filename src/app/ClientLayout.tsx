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
            position: 'fixed', top: 0, left: 0, right: 0,
            background: 'white', borderBottom: '1px solid #e0e0e0', padding: '8px 12px', zIndex: 100,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333', lineHeight: '1.2' }}>The Explainers</h1>
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
                <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '160px', zIndex: 1000 }}>
                  <button onClick={() => { router.push('/reader'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📖 Reader</button>
                  <button onClick={() => { router.push('/chat'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💬 Chat</button>
                  <button onClick={() => { router.push('/library'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📚 Library</button>
                  <button onClick={() => { router.push('/styles'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>🎭 Styles</button>
                  <button onClick={() => { router.push('/credits'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💳 Credits</button>
                  <button onClick={() => { router.push('/profile'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>👤 Profile</button>
                  <button onClick={() => { router.push('/settings'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>⚙️ Settings</button>
                  <button onClick={() => { router.push('/guide'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📖 User Guide</button>
                  <button onClick={() => { router.push('/demo'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>🗯️ Demo</button>
                </div>
              )}
            </div>
          </header>

          <main style={{ marginTop: '60px', minHeight: 'calc(100vh - 60px)' }}>
            {children}
          </main>
        </div>
      </SettingsProvider>
    </ProfileProvider>
  )
}