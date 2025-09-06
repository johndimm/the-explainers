import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔐 Test NextAuth API endpoint called:', {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  })
  
  // Test if we can import NextAuth
  try {
    const NextAuth = require('next-auth')
    console.log('🔐 NextAuth import successful')
    
    return NextResponse.json({
      message: 'NextAuth API test successful',
      timestamp: new Date().toISOString(),
      url: request.url,
      nextAuthAvailable: true
    })
  } catch (error) {
    console.error('🔐 NextAuth import failed:', error)
    
    return NextResponse.json({
      message: 'NextAuth API test failed',
      timestamp: new Date().toISOString(),
      url: request.url,
      nextAuthAvailable: false,
      error: error.message
    }, { status: 500 })
  }
}
