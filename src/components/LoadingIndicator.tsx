'use client'

import React from 'react'

interface LoadingIndicatorProps {
  message?: string
  style?: React.CSSProperties
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = "Loading...", 
  style = {} 
}) => {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: '#666',
        ...style
      }}
    >
      <div 
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}
      />
      <div style={{ fontSize: '14px', textAlign: 'center' }}>
        {message}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default LoadingIndicator
