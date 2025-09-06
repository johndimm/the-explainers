import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🔐 Simple session check called')
  
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('simple-session')?.value
  
  if (!sessionToken) {
    console.log('🔐 No session token found')
    return NextResponse.json({ user: null })
  }
  
  try {
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
    
    // Check if session is expired
    if (new Date(sessionData.expires) < new Date()) {
      console.log('🔐 Session expired')
      return NextResponse.json({ user: null })
    }
    
    console.log('🔐 Session found:', { email: sessionData.user.email, name: sessionData.user.name })
    return NextResponse.json({ user: sessionData.user })
    
  } catch (error) {
    console.error('🔐 Error parsing session:', error)
    return NextResponse.json({ user: null })
  }
}
