import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserSettings, createOrUpdateUserSettings } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getUserSettings(session.user.email)
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const settings = await createOrUpdateUserSettings({
      email: session.user.email,
      ...body
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error creating/updating user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}











