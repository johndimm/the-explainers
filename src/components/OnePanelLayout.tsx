'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

interface OnePanelLayoutProps {
  children: React.ReactNode
}

const OnePanelLayout: React.FC<OnePanelLayoutProps> = ({ children }) => {
  const pathname = usePathname()
  const isReader = pathname === '/reader'

  return (
    <div style={{ 
      height: '100vh', 
      margin: 0, 
      padding: 0, 
      overflow: isReader ? 'hidden' : 'auto' 
    }}>
      {children}
    </div>
  )
}

export default OnePanelLayout