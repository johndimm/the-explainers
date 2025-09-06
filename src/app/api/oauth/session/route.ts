import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔐 Simple session check called - v3')
  
  try {
    const cookies = await request.cookies
    const sessionCookie = cookies.get('simple-session')?.value
    
    if (!sessionCookie) {
      console.log('🔐 No session cookie found')
      return NextResponse.json({ user: null })
    }
    
    const session = JSON.parse(sessionCookie)
    
    // Check if session is expired
    if (session.expires && new Date(session.expires) < new Date()) {
      console.log('🔐 Session expired')
      return NextResponse.json({ user: null })
    }
    
    console.log('🔐 Session found:', { email: session.user?.email, name: session.user?.name })
    return NextResponse.json({ user: session.user })
    
  } catch (error) {
    console.error('🔐 Session check error:', error)
    return NextResponse.json({ user: null })
  }
}
