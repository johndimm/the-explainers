import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserProfile, createOrUpdateUserProfile, updateUserProfileFields } from '@/lib/database'
import { log } from '@/utils/log'

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

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile(session.user.email)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    log('ui','Error fetching user profile:', error)
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
      log('Profile API: Local development mode - ignoring profile updates')
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
    
    // Convert frontend field names to database field names
    const convertFrontendToDatabase = (frontendData: any) => {
      const converted = { ...frontendData }
      
      // Convert camelCase to snake_case for database fields
      if (converted.educationLevel !== undefined) {
        converted.education_level = converted.educationLevel
        delete converted.educationLevel
      }
      if (converted.firstLogin !== undefined) {
        converted.first_login = converted.firstLogin
        delete converted.firstLogin
      }
      if (converted.totalExplanations !== undefined) {
        converted.total_explanations = converted.totalExplanations
        delete converted.totalExplanations
      }
      if (converted.todayExplanations !== undefined) {
        converted.today_explanations = converted.todayExplanations
        delete converted.todayExplanations
      }
      if (converted.availableCredits !== undefined) {
        converted.available_credits = converted.availableCredits
        delete converted.availableCredits
      }
      if (converted.bookExplanations !== undefined) {
        converted.book_explanations = converted.bookExplanations
        delete converted.bookExplanations
      }
      if (converted.purchasedBooks !== undefined) {
        converted.purchased_books = converted.purchasedBooks
        delete converted.purchasedBooks
      }
      if (converted.purchasedBookDetails !== undefined) {
        converted.purchased_book_details = converted.purchasedBookDetails
        delete converted.purchasedBookDetails
      }
      if (converted.hasUnlimitedAccess !== undefined) {
        converted.has_unlimited_access = converted.hasUnlimitedAccess
        delete converted.hasUnlimitedAccess
      }
      if (converted.unlimitedAccessExpiry !== undefined) {
        converted.unlimited_access_expiry = converted.unlimitedAccessExpiry
        delete converted.unlimitedAccessExpiry
      }
      
      return converted
    }
    
    const dbBody = convertFrontendToDatabase(body)
    
    // Check if this is a partial update (only specific fields provided)
    const providedFields = Object.keys(dbBody).filter(key => key !== 'email')
    const isPartialUpdate = providedFields.length < 10 // Less than all fields
    
    log('Profile API: Update type:', isPartialUpdate ? 'partial' : 'full')
    log('Profile API: Provided fields:', providedFields)
    log('Profile API: Original body:', body)
    log('Profile API: Converted body:', dbBody)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let profile
    if (isPartialUpdate) {
      // Use partial update to preserve existing fields
      profile = await updateUserProfileFields(session.user.email, dbBody)
    } else {
      // Use full update for complete profile replacement
      profile = await createOrUpdateUserProfile({
        email: session.user.email,
        ...dbBody
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    log('ui','Error creating/updating user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}











