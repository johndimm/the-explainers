'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const captions: string[] = [
  "I'm reading Macbeth",
  'What does this mean?',
  'Start a chat with AI about it',
  "Ah, that's what it means",
  "Let's try a different style",
  'David Foster Wallace',
  'Not the best DFW imitation but it has his style, superficially',
  'Pretend to be a French teenager',
  '"David Foster Wallace" speaks French',
  'A link to search movies for this phrase',
  'Found it in a 1971 film'
]

export default function DemoPage() {
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }
    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMobileMenu])

  return (
    <div>
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-padding { padding: 8px !important; }
        }
        .grid { display: grid; gap: 16px; grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 1024px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
      `}</style>

      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '8px 12px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333', lineHeight: '1.2' }}>The Explainers</h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#666', lineHeight: '1.2' }}>Demo</p>
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
              <button 
                onClick={() => setShowMobileMenu(false)}
                style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'default', borderBottom: '1px solid #f0f0f0', color: '#666' }}
              >
                🗯️ Demo (current)
              </button>
              <button 
                onClick={() => { router.push('/reader'); setShowMobileMenu(false) }}
                style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
              >
                📖 Reader
              </button>
              <button 
                onClick={() => { router.push('/chat'); setShowMobileMenu(false) }}
                style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
              >
                💬 Chat
              </button>
              <button 
                onClick={() => { router.push('/library'); setShowMobileMenu(false) }}
                style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
              >
                📚 Library
              </button>
              <button 
                onClick={() => { router.push('/styles'); setShowMobileMenu(false) }}
                style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
              >
                🎭 Styles
              </button>
              <button 
                onClick={() => { router.push('/credits'); setShowMobileMenu(false) }}
                style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
              >
                💳 Credits
              </button>
              <button 
                onClick={() => { router.push('/guide'); setShowMobileMenu(false) }}
                style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
              >
                📖 User Guide
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={{ marginTop: '60px', minHeight: 'calc(100vh - 60px)', padding: '20px', background: '#fafafa' }} className="mobile-padding">
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <header style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Demo</h2>
            <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '14px' }}>A comic-strip walkthrough: select a passage, chat with AI, switch styles, and even find the line in films.</p>
          </header>

          <section className="grid">
            {captions.map((caption, idx) => {
              const n = idx + 1
              const src = `/explainer-demo-screenshots/${n}.jpg`
              return (
                <figure
                  key={n}
                  style={{
                    margin: 0,
                    background: '#fff',
                    border: '2px solid #111',
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '2px 2px 0 #111',
                  }}
                >
                  <div style={{ position: 'relative', background: '#fff', padding: 6, borderBottom: '2px solid #111' }}>
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        background: '#111',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 12,
                        boxShadow: '1px 1px 0 rgba(0,0,0,0.5)'
                      }}
                    >
                      {n}
                    </div>
                    <img
                      src={src}
                      alt={caption}
                      style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid #111' }}
                      loading="lazy"
                    />
                  </div>
                  <figcaption
                    style={{
                      margin: 0,
                      padding: '10px 12px',
                      background: '#fff3b0',
                      borderTop: '2px solid #111',
                      color: '#111827',
                      fontWeight: 700,
                      fontSize: 13,
                      lineHeight: 1.35,
                    }}
                  >
                    {caption}
                  </figcaption>
                </figure>
              )
            })}
          </section>
        </div>
      </main>
    </div>
  )
}
