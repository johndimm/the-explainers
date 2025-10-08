/**
 * API configuration utility
 * Simple approach: use Vercel for mobile, localhost for development
 */

function getApiBaseUrl(): string {
  // Use Vercel for testing updated server with CORS headers
  return 'https://romeo-and-juliet-explained.vercel.app'
}

export const API_BASE_URL = getApiBaseUrl()

// Log the API URL being used
if (typeof window !== 'undefined') {
  console.log('🌐 API Base URL:', API_BASE_URL)
}