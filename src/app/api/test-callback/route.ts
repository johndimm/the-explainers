import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔐 Test callback endpoint called:', {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    timestamp: new Date().toISOString()
  })
  
  return NextResponse.json({ 
    message: 'Callback test successful',
    url: request.url,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    timestamp: new Date().toISOString()
  })
}
