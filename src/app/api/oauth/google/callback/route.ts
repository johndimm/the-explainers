import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔐 Google OAuth callback called - v3')
  
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  console.log('🔐 Callback params:', { 
    hasCode: !!code, 
    hasState: !!state, 
    hasError: !!error,
    error 
  })
  
  if (error) {
    console.error('🔐 OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=${error}`)
  }
  
  if (!code || !state) {
    console.error('🔐 Missing code or state')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=missing_params`)
  }
  
  // Verify state cookie
  const cookies = await request.cookies
  const stateCookie = cookies.get('oauth-state')?.value
  
  if (!stateCookie || stateCookie !== state) {
    console.error('🔐 State mismatch:', { received: state, expected: stateCookie })
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=state_mismatch`)
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/oauth/google/callback`,
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('🔐 Token exchange failed:', errorText)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=token_exchange_failed`)
    }
    
    const tokens = await tokenResponse.json()
    console.log('🔐 Tokens received:', { hasAccessToken: !!tokens.access_token, hasIdToken: !!tokens.id_token })
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })
    
    if (!userResponse.ok) {
      console.error('🔐 User info fetch failed')
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=user_info_failed`)
    }
    
    const user = await userResponse.json()
    console.log('🔐 User info received:', { email: user.email, name: user.name })
    
    // Create response with redirect to library
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/library`)
    
    // Set simple session cookie
    response.cookies.set('simple-session', JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.picture,
      },
      accessToken: tokens.access_token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    })
    
    // Clear state cookie
    response.cookies.set('oauth-state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })
    
    console.log('🔐 OAuth flow completed successfully')
    return response
    
  } catch (error) {
    console.error('🔐 OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=callback_error`)
  }
}

