'use client'

import React from 'react'

interface PageLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  title, 
  subtitle, 
  children, 
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {/* Header Section */}
      <div className="page-header" style={{ marginTop: '60px' }}>
        <div className="container">
          <div className="card">
            <div className="card-body">
              <h1 className="page-title">
                {title}
              </h1>
              {subtitle && (
                <p className="page-subtitle">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container">
        {children}
      </div>
    </div>
  )
}

export default PageLayout
