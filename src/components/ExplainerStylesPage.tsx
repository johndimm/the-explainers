'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ExplanationStyle } from './Settings'
import stylesCss from './ExplainerStyles.module.css'
import FilteredStyleList from './FilteredStyleList'
import explainers from '@/data/explainers.json'
import PageLayout from './PageLayout'

const getPhotoSrc = (value: ExplanationStyle) => {
  return (explainers as any).photoSources[value] || (explainers as any).photoSources.default.replace('{value}', value)
}

interface ExplainerStylesPageProps {
  selectedStyle: ExplanationStyle
  onStyleChange: (style: ExplanationStyle) => void
}

interface StyleOption {
  value: ExplanationStyle
  name: string
  description: string
  wikipediaUrl?: string
  wikipediaTitle?: string
}

// Function to get style categories from JSON data with descriptions
function getStyleCategories() {
  // Descriptions are now included in the JSON data

  const result: { [key: string]: StyleOption[] } = {}
  
  for (const [categoryName, people] of Object.entries((explainers as any).categories)) {
    result[categoryName] = (people as any[]).map((person: any) => ({
      value: person.value as ExplanationStyle,
      name: person.name,
      description: person.description || 'No description available',
      wikipediaUrl: person.wikipediaUrl,
      wikipediaTitle: person.wikipediaTitle
    }))
  }
  
  return result
}

const ExplainerStylesPage: React.FC<ExplainerStylesPageProps> = ({ 
  selectedStyle, 
  onStyleChange 
}) => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCategories, setFilteredCategories] = useState<{ [key: string]: StyleOption[] }>({})

  // Listen for header search events
  useEffect(() => {
    const handleHeaderSearch = (event: CustomEvent) => {
      if (event.detail.type === 'people') {
        setSearchQuery(event.detail.query)
      }
    }

    window.addEventListener('headerSearch', handleHeaderSearch as EventListener)
    return () => window.removeEventListener('headerSearch', handleHeaderSearch as EventListener)
  }, [])

  const handleStyleSelect = (style: ExplanationStyle) => {
    console.log('ExplainerStylesPage: Style selected:', style)
    onStyleChange(style)
    // Don't redirect - let user stay on the page to see their selection
  }

  const styleCategories = useMemo(() => getStyleCategories(), [])

  // Filter categories based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(styleCategories)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered: { [key: string]: StyleOption[] } = {}
      
      for (const [categoryName, styles] of Object.entries(styleCategories)) {
        const matchingStyles = styles.filter(style => 
          style.name.toLowerCase().includes(query) ||
          style.description.toLowerCase().includes(query)
        )
        
        if (matchingStyles.length > 0) {
          filtered[categoryName] = matchingStyles
        }
      }
      
      setFilteredCategories(filtered)
    }
  }, [searchQuery, styleCategories])

  // Get the current selected style info
  const allStyles = Object.values(styleCategories).flat()
  const currentStyleData = allStyles.find(s => s.value === selectedStyle)

  return (
    <PageLayout 
      title="Choose Your Explainer Style" 
      subtitle="Select a style to see how different voices would explain your text"
    >
      <div className={stylesCss.pageContainer} style={{ marginTop: '0' }}>
        {searchQuery.trim() !== '' && (
          <div style={{ 
            padding: '0 20px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              background: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: '14px',
              color: '#0ea5e9',
              fontWeight: '500'
            }}>
              🔍 Searching for "{searchQuery}" - Found {Object.values(filteredCategories).flat().length} people
            </div>
          </div>
        )}

      {currentStyleData && (
        <div className={stylesCss.selectedStyle}>
          <img 
            src={getPhotoSrc(currentStyleData.value)} 
            alt={currentStyleData.name}
            className={stylesCss.selectedPhoto}
          />
          <div className={stylesCss.selectedText}>
            <h2>{currentStyleData.name}</h2>
            <p>{currentStyleData.description}</p>
            {currentStyleData.wikipediaUrl && (
              <a 
                href={currentStyleData.wikipediaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                <span>🔗</span>
                Wikipedia
              </a>
            )}
          </div>
        </div>
      )}

      {Object.keys(filteredCategories).length === 0 && searchQuery.trim() !== '' ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>No people found matching "{searchQuery}"</div>
          <div style={{ fontSize: '14px' }}>Try searching for a different name or description</div>
        </div>
      ) : (
        Object.entries(filteredCategories).map(([categoryName, styles]) => (
          <div key={categoryName} className={stylesCss.categorySection}>
            <h2 className={stylesCss.categoryTitle}>
              {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
            </h2>
            <FilteredStyleList
              styles={styles}
              selectedStyle={selectedStyle}
              onStyleSelect={handleStyleSelect}
              getPhotoSrc={getPhotoSrc}
              stylesCss={stylesCss}
            />
          </div>
        ))
      )}

      </div>
    </PageLayout>
  )
}

export default ExplainerStylesPage