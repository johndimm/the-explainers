'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ExplanationStyle } from './Settings'
import stylesCss from './ExplainerStyles.module.css'
import WikipediaLink from './WikipediaLink'
import { getPersonWikipediaSearchTerm } from '@/utils/wikipedia'
import FilteredStyleList from './FilteredStyleList'
import styleCategories from '../data/explainer-style-categories.json'
import photoSources from '../data/photo-sources.json'

const getPhotoSrc = (value: ExplanationStyle) => {
  return (photoSources as any)[value] || (photoSources as any).default.replace('{value}', value)
}

interface ExplainerStylesProps {
  isOpen: boolean
  onClose: () => void
  selectedStyle: ExplanationStyle
  onStyleChange: (style: ExplanationStyle) => void
}

interface StyleOption {
  value: ExplanationStyle
  name: string
  description: string
}

// Use style categories from JSON data
export const STYLE_CATEGORIES = styleCategories as { [key: string]: StyleOption[] }

const ExplainerStyles: React.FC<ExplainerStylesProps> = ({ 
  isOpen, 
  onClose, 
  selectedStyle, 
  onStyleChange 
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedStyleName, setSelectedStyleName] = useState('')
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
  
  if (!isOpen) return null

  const handleStyleSelect = (style: ExplanationStyle) => {
    onStyleChange(style)
    // Get the style name for the confirmation modal
    const styleName = style === 'neutral' ? 'Neutral' : 
      Object.values(STYLE_CATEGORIES).flat().find(s => s.value === style)?.name || 'Unknown'
    setSelectedStyleName(styleName)
    setShowConfirmModal(true)
  }

  const handleConfirmReturn = () => {
    setShowConfirmModal(false)
    onClose()
  }

  const handleStayOnPage = () => {
    setShowConfirmModal(false)
  }

  const renderCategory = (categoryName: string, styles: readonly StyleOption[]) => (
    <div key={categoryName} className={`${stylesCss.category}`}>
      <h3 className={stylesCss.categoryTitle}>{categoryName}</h3>
      <FilteredStyleList
        styles={styles}
        selectedStyle={selectedStyle}
        onStyleSelect={handleStyleSelect}
        getPhotoSrc={getPhotoSrc}
        stylesCss={stylesCss}
      />
    </div>
  )

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
        display: 'none',
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
                🎭 Styles (current)
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
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                ⚙️ Settings
              </button>
              <button 
                onClick={() => {
                  router.push('/guide')
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
                📖 User Guide
              </button>
            </div>
          )}
        </div>
      </header>
    
    <div className={stylesCss.overlay}>
      <div className={stylesCss.container}>
        <div className={stylesCss.header}>
          <h2>In the style of...</h2>
        </div>
        
        <div className={stylesCss.content}>
          <div className={stylesCss.currentSelection}>
            <span>Current: </span>
            <strong>
              {selectedStyle === 'neutral' ? 'Neutral' : 
                Object.values(STYLE_CATEGORIES).flat().find(s => s.value === selectedStyle)?.name || 'Unknown'}
            </strong>
          </div>

          {selectedStyle !== 'neutral' && (() => {
            const selected = Object.values(STYLE_CATEGORIES).flat().find(s => s.value === selectedStyle)
            if (!selected) return null
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '12px 0 24px' }}>
                <img 
                  src={getPhotoSrc(selected.value as ExplanationStyle)}
                  alt={selected.name}
                  style={{ 
                    width: 'min(40vw, 240px)',
                    height: 'auto',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
                  }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '6px' }}>{selected.name}</div>
                  <div style={{ color: '#666' }}>{selected.description}</div>
                </div>
              </div>
            )
          })()}

          <div 
            className={`${stylesCss.styleOption} ${selectedStyle === 'neutral' ? stylesCss.selected : ''}`}
            onClick={() => handleStyleSelect('neutral')}
          >
            <div className={stylesCss.neutralIcon}>
              ⚖️
            </div>
            <div className={stylesCss.styleInfo}>
              <div className={stylesCss.styleName}>Neutral</div>
              <div className={stylesCss.styleDescription}>Standard explanations</div>
            </div>
          </div>

                  {renderCategory('Critics', STYLE_CATEGORIES.critics)}
        {renderCategory('Writers', STYLE_CATEGORIES.writers)}
        {renderCategory('Politics', STYLE_CATEGORIES.politics)}
        {renderCategory('Comedians', STYLE_CATEGORIES.comedians)}
        {renderCategory('Talk Show Hosts', STYLE_CATEGORIES.talkShowHosts)}
        {renderCategory('Other', STYLE_CATEGORIES.other)}
        </div>
      </div>
    </div>
    
    {/* Custom Confirmation Modal */}
    {showConfirmModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>✅</div>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            Style Updated!
          </h3>
          <p style={{
            margin: '0 0 24px 0',
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Your explainer style has been changed to <strong>{selectedStyleName}</strong>. 
            Would you like to return to the reader now?
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleStayOnPage}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              Stay Here
            </button>
            <button
              onClick={handleConfirmReturn}
              style={{
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#7c3aed'}
              onMouseOut={(e) => e.currentTarget.style.background = '#8b5cf6'}
            >
              Go to Reader
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}

export default ExplainerStyles