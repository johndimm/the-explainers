'use client'

import React, { useState, useEffect } from 'react'
import { checkPersonWikipediaPage, checkBookWikipediaPage } from '@/utils/wikipediaStatic'

interface WikipediaLinkProps {
  searchTerm: string
  onLinkClick?: (searchTerm: string) => void
  className?: string
  style?: React.CSSProperties
  type?: 'person' | 'book' // Add type to determine which function to use
}

export const WikipediaLink: React.FC<WikipediaLinkProps> = ({ 
  searchTerm, 
  onLinkClick,
  className = '',
  style = {},
  type = 'person'
}) => {
  const [wikipediaResult, setWikipediaResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkWikipedia = () => {
      setIsLoading(true)
      try {
        let result
        if (type === 'book') {
          // For books, we need to parse the search term
          const parts = searchTerm.split(' by ')
          if (parts.length === 2) {
            result = checkBookWikipediaPage(parts[0], parts[1])
          } else {
            result = checkBookWikipediaPage(searchTerm)
          }
        } else {
          result = checkPersonWikipediaPage(searchTerm)
        }
        setWikipediaResult(result)
      } catch (error) {
        console.error('Error checking Wikipedia:', error)
        setWikipediaResult({ exists: false })
      } finally {
        setIsLoading(false)
      }
    }

    checkWikipedia()
  }, [searchTerm, type])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering parent click handlers
    
    if (wikipediaResult?.exists && wikipediaResult.url) {
      window.open(wikipediaResult.url, '_blank', 'noopener,noreferrer')
    }
    
    if (onLinkClick) {
      onLinkClick(searchTerm)
    }
  }

  // Don't render anything if Wikipedia page doesn't exist or is still loading
  if (isLoading || !wikipediaResult?.exists) {
    return null
  }

  return (
    <button
      onClick={handleClick}
      className={`wikipedia-link ${className}`}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: '#0066cc',
        transition: 'background-color 0.2s',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f0f8ff'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
      title={`Learn about ${searchTerm} on Wikipedia`}
    >
      🔗
    </button>
  )
}

export default WikipediaLink
