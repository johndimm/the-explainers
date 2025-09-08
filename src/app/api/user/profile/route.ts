import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserProfile, createOrUpdateUserProfile, updateUserProfileFields } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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











