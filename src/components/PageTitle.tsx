'use client'

import React from 'react'

interface PageTitleProps {
  title: string
  subtitle?: string
  marginTop?: string
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, marginTop = '60px' }) => {
  return (
    <div style={{ 
      marginTop,
      padding: '20px',
      maxWidth: '1200px',
      margin: `${marginTop} auto 0 auto`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '30px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <h1 style={{ 
          color: '#8b5cf6', 
          borderBottom: '3px solid #8b5cf6', 
          paddingBottom: '10px', 
          marginBottom: subtitle ? '15px' : '0',
          marginTop: '0',
          fontSize: '28px',
          fontWeight: '600'
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ 
            margin: '0',
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export default PageTitle
