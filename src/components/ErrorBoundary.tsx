'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error)
    console.error('🚨 Error info:', errorInfo)
    console.error('🚨 User agent:', navigator.userAgent)
    console.error('🚨 Is iOS:', /iPhone|iPad|iPod/.test(navigator.userAgent))
    console.error('🚨 Is Safari:', /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent))
    console.error('🚨 Is Vercel:', window.location.hostname.includes('vercel'))
    console.error('🚨 Environment:', process.env.NODE_ENV)
    console.error('🚨 Hostname:', window.location.hostname)
    console.error('🚨 Error stack:', error.stack)
    
    // Also show alert for iPhone debugging
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      alert(`iPhone Error: ${error.message}\n\nEnvironment: ${process.env.NODE_ENV}\nHostname: ${window.location.hostname}\n\nCheck console for full details.`)
    }
    
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} errorInfo={this.state.errorInfo!} />
      }

      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          background: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Something went wrong</h2>
          <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>
            We're sorry, but something went wrong. Please try refreshing the page.
          </p>
          <details style={{ textAlign: 'left', marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
            <pre style={{ 
              background: '#f3f4f6', 
              padding: '12px', 
              borderRadius: '4px', 
              overflow: 'auto',
              marginTop: '8px',
              fontSize: '12px'
            }}>
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
