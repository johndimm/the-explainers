'use client'

import React from 'react'

interface OnePanelLayoutProps {
  children: React.ReactNode
}

const OnePanelLayout: React.FC<OnePanelLayoutProps> = ({ children }) => {
  return (
    <div style={{ 
      height: '100vh', 
      margin: 0, 
      padding: 0, 
      overflow: 'auto' 
    }}>
      {children}
    </div>
  )
}

export default OnePanelLayout