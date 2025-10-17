/**
 * API configuration utility
 * Simple approach: use Vercel for mobile, localhost for development
 */

function getApiBaseUrl(): string {
  // Use localhost for development, Vercel for production
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000'
  }
  return 'https://romeo-and-juliet-explained.vercel.app'
}

export const API_BASE_URL = getApiBaseUrl()

// Log the API URL being used
if (typeof window !== 'undefined') {
  // console.log('🌐 API Base URL:', API_BASE_URL)
}