'use client'

import React from 'react'

interface PageTitleProps {
  title: string
  subtitle?: string
  className?: string
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`page-header ${className}`} style={{ marginTop: '60px' }}>
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
  )
}

export default PageTitle
