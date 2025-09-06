import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  console.log('🔐 Google OAuth URL endpoint called:', {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  })
  
  try {
    // Generate a random state parameter for security
    const state = randomBytes(32).toString('hex')
    
    // Construct the Google OAuth URL with proper parameters
    const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      scope: 'openid email profile',
      response_type: 'code',
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      state: state,
      prompt: 'select_account'
    }).toString()
    
    console.log('🔐 Generated Google OAuth URL:', {
      state,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      oauthUrl: googleOAuthUrl,
      state,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔐 Error generating OAuth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    )
  }
}
