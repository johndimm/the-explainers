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
        :root { --ink:#111; --paper:#fff; --cream:#fff3b0; --shadow:rgba(0,0,0,0.12); }
        @media (max-width: 768px) { .mobile-padding { padding: 8px !important; } }
        .grid { display: grid; gap: 18px; grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 1200px) { .grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
        @media (max-width: 1024px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
        .panel { background: var(--paper); border: 2px solid var(--ink); border-radius: 8px; overflow: hidden; box-shadow: 3px 3px 0 var(--ink), 0 6px 18px var(--shadow); transition: transform .15s ease, box-shadow .15s ease; }
        .panel:hover { transform: translateY(-2px); box-shadow: 6px 6px 0 var(--ink), 0 10px 24px var(--shadow); }
        .imgWrap { position: relative; background: #fafafa; padding: 8px; border-bottom: 2px solid var(--ink); }
        .frame { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
        .img { width: 100%; height: auto; display: block; }
        .badge { position: absolute; top: 10px; left: 10px; width: 28px; height: 28px; border-radius: 999px; background: var(--ink); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; box-shadow: 1px 1px 0 rgba(0,0,0,.5); }
        .caption { background: var(--cream); border-top: 2px solid var(--ink); padding: 10px 12px; font-weight: 700; color: #111827; font-size: 13px; line-height: 1.35; }
        .subtitle { margin: 6px 0 0 0; color: #6b7280; font-size: 14px; }
      `}</style>

      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, background: 'white', borderBottom: '1px solid #e0e0e0', padding: '8px 12px', zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
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
              <button onClick={() => setShowMobileMenu(false)} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'default', borderBottom: '1px solid #f0f0f0', color: '#666' }}>🗯️ Demo (current)</button>
              <button onClick={() => { router.push('/reader'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📖 Reader</button>
              <button onClick={() => { router.push('/chat'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💬 Chat</button>
              <button onClick={() => { router.push('/library'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>📚 Library</button>
              <button onClick={() => { router.push('/styles'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>🎭 Styles</button>
              <button onClick={() => { router.push('/credits'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>💳 Credits</button>
              <button onClick={() => { router.push('/profile'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>👤 Profile</button>
              <button onClick={() => { router.push('/settings'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>⚙️ Settings</button>
              <button onClick={() => { router.push('/guide'); setShowMobileMenu(false) }} style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>📖 User Guide</button>
            </div>
          )}
        </div>
      </header>

      <main style={{ marginTop: '60px', minHeight: 'calc(100vh - 60px)', padding: '20px', background: '#fafafa' }} className="mobile-padding">
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <header style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Demo</h2>
            <p className="subtitle">A comic-strip walkthrough: select a passage, chat with AI, switch styles, and even find the line in films.</p>
          </header>

          <section className="grid">
            {captions.map((caption, idx) => {
              const n = idx + 1
              const src = `/explainer-demo-screenshots/${n}.jpg`
              return (
                <figure key={n} className="panel">
                  <div className="imgWrap">
                    <div className="badge">{n}</div>
                    <div className="frame">
                      <img className="img" src={src} alt={caption} loading="lazy" />
                    </div>
                  </div>
                  <figcaption className="caption">{caption}</figcaption>
                </figure>
              )
            })}
          </section>
        </div>
      </main>
    </div>
  )
}
