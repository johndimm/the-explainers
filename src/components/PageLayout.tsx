'use client'

import React from 'react'

interface PageLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  maxWidth?: string
  backgroundColor?: string
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  title, 
  subtitle, 
  children, 
  maxWidth = '1200px',
  backgroundColor = '#fafafa'
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
    }}>
      {/* Header Section */}
      <div style={{ 
        marginTop: '60px',
        padding: '20px',
        maxWidth,
        margin: '60px auto 0 auto'
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

      {/* Content Section */}
      <div style={{
        padding: '0 20px 20px 20px',
        maxWidth,
        margin: '0 auto'
      }}>
        {children}
      </div>
    </div>
  )
}

export default PageLayout
