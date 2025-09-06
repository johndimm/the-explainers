import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔐 Direct Google OAuth endpoint called')
  
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  if (!clientId || !clientSecret) {
    console.error('🔐 Missing Google OAuth credentials')
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 })
  }
  
  // Generate state parameter for security
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  
  // Store state in a cookie for verification
  const response = NextResponse.redirect(
    `https://accounts.google.com/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/direct-google/callback`)}&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `state=${state}&` +
    `prompt=select_account`
  )
  
  // Set state cookie
  response.cookies.set('oauth-state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600 // 10 minutes
  })
  
  console.log('🔐 Redirecting to Google OAuth:', {
    clientId: clientId.substring(0, 10) + '...',
    redirectUri: `${baseUrl}/api/auth/direct-google/callback`,
    state: state.substring(0, 10) + '...'
  })
  
  return response
}
