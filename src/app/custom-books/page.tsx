'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/contexts/ProfileContext'

const CustomBooksPage: React.FC = () => {
  const [customUrl, setCustomUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [bookTitle, setBookTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [fileInput, setFileInput] = useState<File | null>(null)
  const router = useRouter()
  const { purchaseBook } = useProfile()

  const handleCustomUrl = () => {
    if (!customUrl.trim() || !bookTitle.trim()) return
    
    const title = bookTitle.trim()
    const authorName = author.trim() || 'Unknown'
    
    // Save current book to database and persist purchase details
    purchaseBook(title, authorName, customUrl)
    
    router.push(`/reader?title=${encodeURIComponent(title)}&author=${encodeURIComponent(authorName)}&url=${encodeURIComponent(customUrl)}`)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !bookTitle.trim()) return
    
    const title = bookTitle.trim()
    const authorName = author.trim() || 'Unknown'
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      purchaseBook(title, authorName, url)
      
      router.push(`/reader?title=${encodeURIComponent(title)}&author=${encodeURIComponent(authorName)}&url=${encodeURIComponent(url)}`)
    }
    reader.readAsText(file)
  }

  const handlePastedText = () => {
    if (!pastedText.trim() || !bookTitle.trim()) return
    
    const title = bookTitle.trim()
    const authorName = author.trim() || 'Unknown'
    
    const blob = new Blob([pastedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    purchaseBook(title, authorName, url)
    
    router.push(`/reader?title=${encodeURIComponent(title)}&author=${encodeURIComponent(authorName)}&url=${encodeURIComponent(url)}`)
  }

  return (
    <div style={{ marginTop: '0', minHeight: 'calc(100vh - 40px)', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '2rem', fontWeight: '600' }}>
          Custom Books
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '1.1rem' }}>
          Load your own texts using any of these methods
        </p>

        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #0ea5e9', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '24px',
          fontSize: '14px',
          color: '#0369a1'
        }}>
          <strong>📚 Project Gutenberg Tip:</strong> When you find a book on <a href="https://www.gutenberg.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>Project Gutenberg</a>, select the <strong>"Plain Text UTF-8"</strong> version.
        </div>

        {/* Book Details */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#374151', marginBottom: '16px', fontSize: '1.2rem' }}>Book Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                Book Title *
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="Enter book title"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                Author (optional)
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Method 1: URL */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#374151', marginBottom: '16px', fontSize: '1.2rem' }}>Method 1: Load from URL</h3>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Enter URL to plain text file..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                marginBottom: '12px'
              }}
            />
            <button 
              onClick={handleCustomUrl} 
              disabled={!customUrl.trim() || !bookTitle.trim()}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                opacity: (!customUrl.trim() || !bookTitle.trim()) ? 0.5 : 1
              }}
            >
              Load from URL
            </button>
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            <strong>Note:</strong> URLs must return plain ASCII text files, not HTML, PDF, or other formats.
          </p>
        </div>

        {/* Method 2: File Upload */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#374151', marginBottom: '16px', fontSize: '1.2rem' }}>Method 2: Upload Text File</h3>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                marginBottom: '12px'
              }}
            />
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              <strong>Supported:</strong> .txt files only
            </p>
          </div>
        </div>

        {/* Method 3: Paste Text */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: '#374151', marginBottom: '16px', fontSize: '1.2rem' }}>Method 3: Paste Text</h3>
          <div style={{ marginBottom: '16px' }}>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your text here..."
              rows={8}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                marginBottom: '12px',
                resize: 'vertical',
                fontFamily: 'monospace'
              }}
            />
            <button 
              onClick={handlePastedText} 
              disabled={!pastedText.trim() || !bookTitle.trim()}
              style={{
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                opacity: (!pastedText.trim() || !bookTitle.trim()) ? 0.5 : 1
              }}
            >
              Load Pasted Text
            </button>
          </div>
        </div>

        {/* Back to Library */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={() => router.push('/library')}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              color: '#6b7280'
            }}
          >
            ← Back to Library
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomBooksPage
