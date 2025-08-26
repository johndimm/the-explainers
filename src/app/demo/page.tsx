'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const captions: string[] = [
  "I'm reading Macbeth",
  'What does this mean?',
  'Start a chat with AI about it',
  "Ah, that's what it means",
  "Let's try a different style",
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
        .grid { display: grid; gap: 28px 18px; grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 1200px) { .grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
        @media (max-width: 1024px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
        .panel { background: var(--paper); border: 2px solid var(--ink); border-radius: 10px; overflow: hidden; box-shadow: 3px 3px 0 var(--ink), 0 6px 18px var(--shadow); transition: transform .15s ease, box-shadow .15s ease; }
        .panel:hover { transform: translateY(-2px); box-shadow: 6px 6px 0 var(--ink), 0 10px 24px var(--shadow); }
        .imgWrap { position: relative; background: #fafafa; padding: 12px; border-top: 2px solid var(--ink); }
        .frame { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; width: 75%; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
        .img { width: 100%; height: auto; display: block; }
        .badge { position: absolute; top: 12px; left: 12px; width: 28px; height: 28px; border-radius: 999px; background: var(--ink); color: #fff; display: flex; align-items: center; justifyContent: center; font-weight: 800; font-size: 12px; box-shadow: 1px 1px 0 rgba(0,0,0,.5); }
        .caption { background: var(--cream); border-bottom: 2px solid var(--ink); padding: 12px 14px; font-weight: 700; color: #111827; font-size: 13px; line-height: 1.5; font-style: italic; }
        .subtitle { margin: 6px 0 0 0; color: #6b7280; font-size: 14px; }
      `}</style>

      <main style={{ marginTop: '60px', minHeight: 'calc(100vh - 60px)', padding: '20px', background: '#fafafa' }} className="mobile-padding">
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <header style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Demo</h2>
            <p className="subtitle">A quick walkthrough: select a passage, chat with AI, switch styles, and even find the line in films.</p>
          </header>

          <section className="grid">
            {captions.map((caption, idx) => {
              const displayNumber = idx + 1
              const imageNumber = idx < 5 ? idx + 1 : idx + 2 // skip 6
              const src = `/explainer-demo-screenshots/${imageNumber}.jpg`
              return (
                <figure key={idx} className="panel">
                  <figcaption className="caption">{caption}</figcaption>
                  <div className="imgWrap">
                    <div className="badge">{displayNumber}</div>
                    <div className="frame">
                      <img className="img" src={src} alt={caption} loading="lazy" />
                    </div>
                  </div>
                </figure>
              )
            })}
          </section>
        </div>
      </main>
    </div>
  )
}
