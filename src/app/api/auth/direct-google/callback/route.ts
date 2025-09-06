import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🔐 Direct Google OAuth callback called')
  
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  console.log('🔐 OAuth callback params:', {
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
  
  // Verify state
  const cookieStore = cookies()
  const storedState = cookieStore.get('oauth-state')?.value
  
  if (state !== storedState) {
    console.error('🔐 State mismatch:', { received: state, stored: storedState })
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
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/direct-google/callback`,
      }),
    })
    
    const tokens = await tokenResponse.json()
    console.log('🔐 Token response:', { hasAccessToken: !!tokens.access_token, hasIdToken: !!tokens.id_token })
    
    if (!tokens.access_token) {
      throw new Error('No access token received')
    }
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })
    
    const userInfo = await userResponse.json()
    console.log('🔐 User info:', { email: userInfo.email, name: userInfo.name })
    
    // Create a simple session token (you might want to use JWT here)
    const sessionToken = Buffer.from(JSON.stringify({
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        image: userInfo.picture
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    })).toString('base64')
    
    // Set session cookie
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/library`)
    response.cookies.set('simple-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })
    
    // Clear OAuth state
    response.cookies.delete('oauth-state')
    
    console.log('🔐 Login successful, redirecting to library')
    return response
    
  } catch (error) {
    console.error('🔐 OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=oauth_failed`)
  }
}
