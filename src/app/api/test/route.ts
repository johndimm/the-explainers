import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔐 Test API endpoint called:', {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  })
  
  return NextResponse.json({
    message: 'API routes are working',
    timestamp: new Date().toISOString(),
    url: request.url
  })
}
