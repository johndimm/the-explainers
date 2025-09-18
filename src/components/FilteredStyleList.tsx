'use client'

import React from 'react'
import { ExplanationStyle } from './Settings'

interface StyleOption {
  value: ExplanationStyle
  name: string
  description: string
  wikipediaUrl?: string
  wikipediaTitle?: string
}

interface FilteredStyleListProps {
  styles: readonly StyleOption[]
  selectedStyle: ExplanationStyle
  onStyleSelect: (style: ExplanationStyle) => void
  getPhotoSrc: (value: ExplanationStyle) => string
  stylesCss: any
}

export const FilteredStyleList: React.FC<FilteredStyleListProps> = ({
  styles,
  selectedStyle,
  onStyleSelect,
  getPhotoSrc,
  stylesCss
}) => {
  // Show all styles (Wikipedia links are optional)
  const filteredStyles = styles

  return (
    <div className={stylesCss.styleGrid}>
      {filteredStyles.map((style) => (
        <div
          key={style.value}
          className={`${stylesCss.styleOption} ${selectedStyle === style.value ? stylesCss.selected : ''}`}
          onClick={() => onStyleSelect(style.value)}
          style={{ position: 'relative' }}
        >
          <img 
            src={getPhotoSrc(style.value)}
            alt={style.name}
            className={stylesCss.stylePhoto}
            onError={(e) => { 
              e.currentTarget.style.display = 'none'
              // Show a placeholder icon when image fails to load
              const placeholder = document.createElement('div')
              placeholder.style.width = '60px'
              placeholder.style.height = '60px' 
              placeholder.style.backgroundColor = '#f3f4f6'
              placeholder.style.borderRadius = '50%'
              placeholder.style.display = 'flex'
              placeholder.style.alignItems = 'center'
              placeholder.style.justifyContent = 'center'
              placeholder.style.fontSize = '24px'
              placeholder.style.flexShrink = '0'
              placeholder.innerHTML = style.value === 'neutral' ? '⚖️' : '👤'
              e.currentTarget.parentNode?.insertBefore(placeholder, e.currentTarget)
            }}
          />
          <img 
            src={getPhotoSrc(style.value)}
            alt={`${style.name} - Large View`}
            className={stylesCss.hoverImage}
          />
          <div className={stylesCss.styleInfo}>
            <div className={stylesCss.styleName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {style.name}
              {style.wikipediaUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(style.wikipediaUrl, 'wikipedia', 'noopener,noreferrer')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#0066cc',
                    transition: 'background-color 0.2s',
                    position: 'relative',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f8ff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  title={`Learn about ${style.name} on Wikipedia`}
                >
                  🔗
                </button>
              )}
            </div>
            <div className={stylesCss.styleDescription}>{style.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FilteredStyleList
