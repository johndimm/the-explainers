'use client'

import React, { useState, useEffect } from 'react'
import { ExplanationStyle } from './Settings'
import WikipediaLink from './WikipediaLink'
import { getPersonWikipediaSearchTerm, checkWikipediaPage } from '@/utils/wikipedia'
import LoadingIndicator from './LoadingIndicator'

interface StyleOption {
  value: ExplanationStyle
  name: string
  description: string
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
  const [filteredStyles, setFilteredStyles] = useState<StyleOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const filterStyles = async () => {
      setIsLoading(true)
      const validStyles: StyleOption[] = []

      // Check each style for Wikipedia existence
      for (const style of styles) {
        try {
          const searchTerm = getPersonWikipediaSearchTerm(style.name)
          const result = await checkWikipediaPage(searchTerm)
          
          if (result.exists) {
            validStyles.push(style)
          } else {
            console.log(`Removing style "${style.name}" - no Wikipedia page found`)
          }
        } catch (error) {
          console.error(`Error checking Wikipedia for ${style.name}:`, error)
          // Include the style if we can't check (network error, etc.)
          validStyles.push(style)
        }
      }

      setFilteredStyles(validStyles)
      setIsLoading(false)
    }

    filterStyles()
  }, [styles])

  if (isLoading) {
    return (
      <LoadingIndicator 
        message="Checking Wikipedia pages for explainer styles..."
        style={{ padding: '20px' }}
      />
    )
  }

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
              <WikipediaLink 
                searchTerm={getPersonWikipediaSearchTerm(style.name)}
                style={{ 
                  position: 'relative',
                  zIndex: 10,
                  fontSize: '12px'
                }}
              />
            </div>
            <div className={stylesCss.styleDescription}>{style.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FilteredStyleList
