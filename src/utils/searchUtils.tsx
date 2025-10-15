import React, { useState } from 'react'
import { buildFlexibleRegex } from './textUtils'

export interface SearchResult {
  index: number
  length: number
}

export interface SearchState {
  searchQuery: string
  searchResults: SearchResult[]
  currentSearchIndex: number
}

export const performSearch = (text: string, query: string): SearchResult[] => {
  if (!query.trim()) {
    return []
  }
  
  const results: SearchResult[] = []
  const regex = buildFlexibleRegex(query)
  
  if (!regex) {
    return []
  }
  
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const start = match.index
    const length = match[0].length
    results.push({ index: start, length })
    regex.lastIndex = start + Math.max(1, length)
  }
  
  return results
}

export const scrollToSearchResult = (
  resultIndex: number,
  results: SearchResult[],
  text: string,
  textContentRef: React.RefObject<HTMLDivElement | null>,
  textReaderRef: React.RefObject<HTMLDivElement | null>,
  onNavigateToPage?: (pageNum: number) => void,
  pageMap?: any
) => {
  if (resultIndex < 0 || resultIndex >= results.length || !textContentRef.current) return
  
  const result = results[resultIndex]
  
  // If we have page navigation and page mapping, navigate to the correct page first
  if (onNavigateToPage && pageMap && pageMap.pages.length > 0) {
    const targetPage = findPageBySearchResult(result, text, pageMap.pages)
    onNavigateToPage(targetPage)
  }
  
  setTimeout(() => {
    const highlightedElements = textContentRef.current?.querySelectorAll('span[style*="background"]')
    if (highlightedElements && highlightedElements.length > 0) {
      const targetElement = highlightedElements[resultIndex] as HTMLElement
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        
        // Save bookmark after scrolling to search result
        setTimeout(async () => {
          if (textReaderRef.current) {
            const scrollPosition = textReaderRef.current.scrollTop
            
            // Trigger the scroll event to save bookmark
            const scrollEvent = new Event('scroll')
            window.dispatchEvent(scrollEvent)
          }
        }, 500)
        return
      }
    }
    
    // Only do scroll-based navigation if we're not in page mode
    if (!onNavigateToPage || !pageMap || pageMap.pages.length === 0) {
      const scrollContainer = textReaderRef.current
      if (scrollContainer) {
        const textPercentage = result.index / text.length
        // Use requestAnimationFrame to avoid forced reflow
        requestAnimationFrame(() => {
          const targetPosition = textPercentage * scrollContainer.scrollHeight * 0.8
          scrollContainer.scrollTop = Math.max(0, targetPosition - 200)
          
          // Save bookmark after scrolling to search result
          setTimeout(() => {
            // Trigger the scroll event to save bookmark
            const scrollEvent = new Event('scroll')
            window.dispatchEvent(scrollEvent)
          }, 500)
        })
      }
    }
  }, 100)
}

export const renderTextWithSearchHighlight = (
  textToRender: string,
  searchQuery: string,
  searchResults: SearchResult[],
  currentSearchIndex: number
): React.ReactNode => {
  if (searchResults.length === 0 || !searchQuery.trim()) {
    return textToRender
  }

  const query = searchQuery.trim()
  if (!query) return textToRender

  const parts: React.ReactNode[] = []
  let lastIndex = 0

  // Use the same regex as the search function for case-insensitive highlighting
  const regex = buildFlexibleRegex(query)
  if (!regex) return textToRender

  let match: RegExpExecArray | null
  while ((match = regex.exec(textToRender)) !== null) {
    const index = match.index
    const matchedText = match[0]

    // Add text before the match
    if (index > lastIndex) {
      parts.push(textToRender.slice(lastIndex, index))
    }

    // Check if this match corresponds to the current search result
    const isCurrentResult = searchResults[currentSearchIndex] && 
      searchResults[currentSearchIndex].index >= 0 &&
      searchResults[currentSearchIndex].index === index

    // Add the highlighted match (use the actual matched text, not the query)
    parts.push(
      <span 
        key={`search-${index}`}
        style={{
          backgroundColor: isCurrentResult ? '#8b5cf6' : '#ffeb3b',
          color: isCurrentResult ? 'white' : 'black',
          padding: '1px 2px',
          borderRadius: '2px'
        }}
      >
        {matchedText}
      </span>
    )

    lastIndex = index + matchedText.length
    regex.lastIndex = index + Math.max(1, matchedText.length)
  }

  // Add remaining text
  if (lastIndex < textToRender.length) {
    parts.push(textToRender.slice(lastIndex))
  }

  return <>{parts}</>
}

// Helper function for page-based search navigation
export const findPageBySearchResult = (
  searchResult: SearchResult,
  text: string,
  pages: string[]
): number => {
  const searchText = text.slice(searchResult.index, searchResult.index + searchResult.length)
  
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].includes(searchText)) {
      return i
    }
  }
  
  // Fallback: estimate based on position
  const textPercentage = searchResult.index / text.length
  return Math.floor(textPercentage * pages.length)
}
