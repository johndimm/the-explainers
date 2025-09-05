// Vercel-specific debugging utilities
export const debugVercelEnvironment = () => {
  if (typeof window === 'undefined') return

  const debugInfo = {
    // Environment info
    nodeEnv: process.env.NODE_ENV,
    isVercel: window.location.hostname.includes('vercel'),
    hostname: window.location.hostname,
    
    // Browser info
    userAgent: navigator.userAgent,
    isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    
    // Feature detection
    hasLocalStorage: typeof localStorage !== 'undefined',
    hasSessionStorage: typeof sessionStorage !== 'undefined',
    hasFetch: typeof fetch !== 'undefined',
    hasWebSocket: typeof WebSocket !== 'undefined',
    
    // API availability
    hasCaretRangeFromPoint: typeof document !== 'undefined' && 'caretRangeFromPoint' in document,
    hasCaretPositionFromPoint: typeof document !== 'undefined' && 'caretPositionFromPoint' in document,
    
    // React/Next.js info
    reactVersion: 'unknown', // Will be detected at runtime
    nextVersion: process.env.__NEXT_VERSION || 'unknown',
    
    // Timestamp
    timestamp: new Date().toISOString()
  }

  console.log('🔍 Vercel Environment Debug:', debugInfo)
  return debugInfo
}

// Check for common Vercel issues
export const checkVercelIssues = () => {
  const issues: string[] = []
  
  if (typeof window === 'undefined') return issues
  
  // Check for missing APIs that might cause issues
  if (!window.localStorage) {
    issues.push('localStorage not available')
  }
  
  if (!window.sessionStorage) {
    issues.push('sessionStorage not available')
  }
  
  if (!window.fetch) {
    issues.push('fetch not available')
  }
  
  // Check for iOS-specific issues
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    if (!document.caretRangeFromPoint && !(document as any).caretPositionFromPoint) {
      issues.push('Text selection APIs not available on iOS')
    }
  }
  
  // Check for Vercel-specific issues
  if (window.location.hostname.includes('vercel')) {
    if (process.env.NODE_ENV === 'production') {
      issues.push('Running in production mode on Vercel')
    }
  }
  
  return issues
}

// Initialize debugging on page load
if (typeof window !== 'undefined') {
  // Run immediately
  debugVercelEnvironment()
  
  // Also run after a short delay to catch any async issues
  setTimeout(() => {
    const issues = checkVercelIssues()
    if (issues.length > 0) {
      console.warn('⚠️ Potential Vercel issues detected:', issues)
    }
  }, 1000)
}
