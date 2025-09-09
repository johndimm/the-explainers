'use client'

import React, { useState, useEffect } from 'react'
import { extractContextInfo } from './BaseTextReader'

export interface TOCItem {
  id: string
  title: string
  level: number
  position: number
  children?: TOCItem[]
}

interface TableOfContentsProps {
  text: string
  isVisible: boolean
  onToggle: () => void
  onNavigateToPosition: (position: number) => void
  currentPosition?: number
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  text,
  isVisible,
  onToggle,
  onNavigateToPosition,
  currentPosition = 0
}) => {
  const [tocItems, setTocItems] = useState<TOCItem[]>([])

  // Use existing context extraction to find structure
  useEffect(() => {
    if (!text) return

    const items: TOCItem[] = []
    const lines = text.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines
      if (!line) continue
      
      // Use the same patterns that extractContextInfo uses
      let match: RegExpMatchArray | null = null
      let level = 0
      let title = ''
      
      // Shakespeare-specific patterns (same as extractContextInfo) - support both Roman and Arabic numerals
      if (match = line.match(/\bACT\s+([IVXLCDM]+|\d+)\b/i)) {
        level = 1
        title = `Act ${match[1]}`
        
        // Look for stage directions or context in the next few lines
        let context = ''
        for (let j = 1; j <= 3 && i + j < lines.length; j++) {
          const nextLine = lines[i + j].trim()
          if (nextLine && nextLine.length > 10 && nextLine.length < 100) {
            context = nextLine
            break
          }
        }
        if (context) {
          title += `: ${context}`
        }
      }
      else if (match = line.match(/\bSCENE\s+([IVXLCDM]+|\d+)\b/i)) {
        level = 2
        title = `Scene ${match[1]}`
        
        // Look for stage directions or context in the next few lines
        let context = ''
        for (let j = 1; j <= 3 && i + j < lines.length; j++) {
          const nextLine = lines[i + j].trim()
          if (nextLine && nextLine.length > 10 && nextLine.length < 100) {
            context = nextLine
            break
          }
        }
        if (context) {
          title += `: ${context}`
        }
      }
      // General book patterns
      else if (match = line.match(/\bChapter\s+([IVXLCDM0-9]+)\b/i)) {
        level = 1
        title = `Chapter ${match[1]}`
      }
      else if (match = line.match(/\bBook\s+([IVXLCDM0-9]+)\b/i)) {
        level = 1
        title = `Book ${match[1]}`
      }
      else if (match = line.match(/\bPart\s+([IVXLCDM0-9]+)\b/i)) {
        level = 1
        title = `Part ${match[1]}`
      }
      else if (match = line.match(/\bSection\s+([IVXLCDM0-9]+)\b/i)) {
        level = 2
        title = `Section ${match[1]}`
      }
      
      if (title && level > 0) {
        // Calculate position in text
        const position = text.indexOf(line, i > 0 ? text.indexOf(lines[i - 1]) + lines[i - 1].length + 1 : 0)
        
        items.push({
          id: `toc-${items.length}`,
          title,
          level,
          position: Math.max(0, position)
        })
      }
    }
    
    setTocItems(items)
  }, [text])

  if (!isVisible) return null

  const handleItemClick = (item: TOCItem) => {
    onNavigateToPosition(item.position)
  }

  const getCurrentSection = (): TOCItem | null => {
    if (!tocItems.length) return null
    
    // Find the last TOC item before or at the current position
    for (let i = tocItems.length - 1; i >= 0; i--) {
      if (tocItems[i].position <= currentPosition) {
        return tocItems[i]
      }
    }
    
    return tocItems[0]
  }

  const currentSection = getCurrentSection()

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '300px',
      height: '100vh',
      backgroundColor: 'white',
      borderRight: '1px solid #e0e0e0',
      boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Table of Contents</h3>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            color: '#666'
          }}
          title="Close table of contents"
        >
          ×
        </button>
      </div>

      {/* Current section indicator */}
      {currentSection && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#e3f2fd',
          borderBottom: '1px solid #bbdefb',
          fontSize: '14px'
        }}>
          <strong>Current:</strong> {currentSection.title}
        </div>
      )}

      {/* TOC Items */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {tocItems.length === 0 ? (
          <div style={{
            padding: '12px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            No headings found in this text.
          </div>
        ) : (
          tocItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                padding: `${4 + (item.level - 1) * 12}px 16px`,
                cursor: 'pointer',
                fontSize: '14px',
                borderLeft: item.level === 1 ? '3px solid #2196f3' : 'none',
                backgroundColor: currentSection?.id === item.id ? '#f3f3f3' : 'transparent',
                color: currentSection?.id === item.id ? '#1976d2' : '#333',
                fontWeight: item.level === 1 ? '600' : 'normal',
                transition: 'background-color 0.2s'
              }}
              title={`Go to ${item.title}`}
            >
              {item.title}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TableOfContents
