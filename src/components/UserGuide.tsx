'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const UserGuide: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
    <div>
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
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#333',
            lineHeight: '1.2'
          }}>
            The Explainers
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '11px', 
            color: '#666',
            fontStyle: 'italic',
            lineHeight: '1.2'
          }}>
            understand difficult texts
          </p>
        </div>
        {/* Hamburger menu for all devices */}
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
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '160px',
              zIndex: 1000
            }}>
              <button 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  color: '#666'
                }}
              >
                📖 User Guide (current)
              </button>
              <button 
                onClick={() => {
                  router.push('/reader')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📖 Reader
              </button>
              <button 
                onClick={() => {
                  router.push('/chat')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                💬 Chat
              </button>
              <button 
                onClick={() => {
                  router.push('/library')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📚 Library
              </button>
              <button 
                onClick={() => {
                  router.push('/styles')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                🎭 Styles
              </button>
              <button 
                onClick={() => {
                  router.push('/credits')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                💳 Credits
              </button>
              <button 
                onClick={() => {
                  router.push('/profile')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                👤 Profile
              </button>
              <button 
                onClick={() => {
                  router.push('/settings')
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Settings
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div style={{ marginTop: '50px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif', lineHeight: '1.6', color: '#333', maxWidth: '800px', margin: '70px auto 0', padding: '20px', backgroundColor: '#f9f9f9' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '40px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: '#8b5cf6', borderBottom: '3px solid #8b5cf6', paddingBottom: '10px', marginBottom: '30px' }}>
            The Explainers - User Guide
          </h1>

          <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', padding: '15px', margin: '15px 0' }}>
            <strong>Welcome to The Explainers!</strong> This app helps you understand difficult texts by providing AI-powered explanations of selected passages. Whether you're tackling Shakespeare, philosophy, or classic literature, we make challenging texts accessible.
          </div>

          <h2 style={{ color: '#10b981', marginTop: '30px', marginBottom: '15px' }}>Getting Started</h2>

          <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>Quick Start</h3>
          <ol style={{ marginBottom: '15px' }}>
            <li style={{ marginBottom: '5px' }}>Open the application and select a book from the library</li>
            <li style={{ marginBottom: '5px' }}>Simply select any text passage you find confusing</li>
            <li style={{ marginBottom: '5px' }}>Get an instant AI explanation tailored to your needs</li>
            <li style={{ marginBottom: '5px' }}>Ask follow-up questions in the chat interface</li>
          </ol>

          <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>First-Time Setup</h3>
          <p>For the best experience, configure your profile and preferences:</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', margin: '20px 0' }}>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h4 style={{ color: '#666', marginTop: '0', marginBottom: '8px' }}>Profile Setup</h4>
              <p>Click the <strong>hamburger menu → Profile</strong> to set:</p>
              <ul>
                <li style={{ marginBottom: '5px' }}>Your age (for age-appropriate vocabulary)</li>
                <li style={{ marginBottom: '5px' }}>Preferred language (12 languages supported)</li>
                <li style={{ marginBottom: '5px' }}>Education level (elementary to graduate school)</li>
              </ul>
            </div>
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h4 style={{ color: '#666', marginTop: '0', marginBottom: '8px' }}>Settings Configuration</h4>
              <p>Click the <strong>hamburger menu → Settings</strong> to customize:</p>
              <ul>
                <li style={{ marginBottom: '5px' }}>AI model provider (GPT-4, Claude, DeepSeek, Gemini)</li>
                <li style={{ marginBottom: '5px' }}>Response length (brief, medium, long)</li>
                <li style={{ marginBottom: '5px' }}>Text and chat fonts</li>
                <li style={{ marginBottom: '5px' }}>Explanation style (50+ personalities!)</li>
              </ul>
            </div>
          </div>

          <h2 style={{ color: '#10b981', marginTop: '30px', marginBottom: '15px' }}>Core Features</h2>

          <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>Text Reader</h3>
          <ul>
            <li style={{ marginBottom: '5px' }}><strong>Clean Interface</strong>: Distraction-free reading environment</li>
            <li style={{ marginBottom: '5px' }}><strong>Text Selection</strong>: Highlight passages with mouse or touch</li>
            <li style={{ marginBottom: '5px' }}><strong>Auto-Bookmarks</strong>: Your reading position is automatically saved</li>
            <li style={{ marginBottom: '5px' }}><strong>Smart Context</strong>: AI understands which character is speaking and the scene context</li>
          </ul>

          <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>AI Chat Interface</h3>
          <ul>
            <li style={{ marginBottom: '5px' }}><strong>Instant Explanations</strong>: Get immediate help with difficult passages</li>
            <li style={{ marginBottom: '5px' }}><strong>Follow-up Questions</strong>: Ask for clarification or deeper analysis</li>
            <li style={{ marginBottom: '5px' }}><strong>Context Awareness</strong>: AI knows exactly where you are in the text</li>
            <li style={{ marginBottom: '5px' }}><strong>Multiple Personalities</strong>: Choose from 50+ explanation styles</li>
          </ul>

          <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>Library</h3>
          <ul>
            <li style={{ marginBottom: '5px' }}><strong>Curated Collection</strong>: Hundreds of classic texts organized by category</li>
            <li style={{ marginBottom: '5px' }}><strong>Custom URLs</strong>: Load any text from the web</li>
            <li style={{ marginBottom: '5px' }}><strong>File Upload</strong>: Upload your own .txt files</li>
            <li style={{ marginBottom: '5px' }}><strong>Quick Return</strong>: Easy navigation back to your current book</li>
          </ul>

          <p style={{ marginTop: '30px', padding: '15px', background: '#e3f2fd', borderRadius: '6px', borderLeft: '4px solid #2196f3' }}>
            <strong>Tip:</strong> The hamburger menu (☰) in the top right provides access to all app features from any page.
          </p>
        </div>
      </div>
    </div>
  )
}

export default UserGuide