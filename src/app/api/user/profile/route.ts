import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserProfile, createOrUpdateUserProfile, updateUserProfileFields } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In local development, bypass authentication
    const isLocalDev = process.env.NODE_ENV === 'development'
    
    if (!session?.user?.email && !isLocalDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (isLocalDev && !session?.user?.email) {
      // Return mock profile for local development
      const mockProfile = {
        email: 'local-dev@example.com',
        age: null,
        language: 'english',
        education_level: 'high-school',
        first_login: new Date(),
        total_explanations: 0,
        today_explanations: 0,
        available_credits: 100,
        book_explanations: {},
        purchased_books: [],
        purchased_book_details: {},
        has_unlimited_access: true,
        unlimited_access_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date()
      }
      return NextResponse.json(mockProfile)
    }

    const profile = await getUserProfile(session.user.email)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In local development, bypass authentication
    const isLocalDev = process.env.NODE_ENV === 'development'
    
    if (!session?.user?.email && !isLocalDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (isLocalDev && !session?.user?.email) {
      // In local dev, just return the mock profile without saving
      console.log('Profile API: Local development mode - ignoring profile updates')
      const mockProfile = {
        email: 'local-dev@example.com',
        age: null,
        language: 'english',
        education_level: 'high-school',
        first_login: new Date(),
        total_explanations: 0,
        today_explanations: 0,
        available_credits: 100,
        book_explanations: {},
        purchased_books: [],
        purchased_book_details: {},
        has_unlimited_access: true,
        unlimited_access_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date()
      }
      return NextResponse.json(mockProfile)
    }

    const body = await request.json()
    
    // Check if this is a partial update (only specific fields provided)
    const providedFields = Object.keys(body).filter(key => key !== 'email')
    const isPartialUpdate = providedFields.length < 10 // Less than all fields
    
    console.log('Profile API: Update type:', isPartialUpdate ? 'partial' : 'full')
    console.log('Profile API: Provided fields:', providedFields)
    console.log('Profile API: Body:', body)
    
    let profile
    if (isPartialUpdate) {
      // Use partial update to preserve existing fields
      profile = await updateUserProfileFields(session.user.email, body)
    } else {
      // Use full update for complete profile replacement
      profile = await createOrUpdateUserProfile({
        email: session.user.email,
        ...body
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating/updating user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}











