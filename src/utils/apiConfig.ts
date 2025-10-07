/**
 * API configuration utility
 * Automatically detects the correct API base URL based on environment
 */

function getApiBaseUrl(): string {
  // If we're in a mobile app (Capacitor/Cordova), use Vercel
  if (typeof window !== 'undefined') {
    // Check if we're in a mobile app environment
    const isMobileApp = window.location.protocol === 'capacitor:' || 
                       window.location.protocol === 'file:' ||
                       navigator.userAgent.includes('Capacitor') ||
                       navigator.userAgent.includes('Cordova')
    
    if (isMobileApp) {
      console.log('📱 Mobile app detected, using Vercel API')
      return 'https://romeo-and-juliet-explained.vercel.app'
    }
    
    // Check if we're accessing localhost from a mobile device
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1'
    
    if (isLocalhost) {
      console.log('💻 Local development detected, using localhost API')
      return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    }
  }
  
  // Default to environment variable
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

export const API_BASE_URL = getApiBaseUrl()

// Log the API URL being used
if (typeof window !== 'undefined') {
  console.log('🌐 API Base URL:', API_BASE_URL)
}