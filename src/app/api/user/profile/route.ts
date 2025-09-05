import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createOrGetUser, getUserCredits, getUserBookPurchases, getUserBookUsage, getAllUserBookUsage, getUserTotalUsage } from '@/lib/db'
import { log } from '@/utils/log'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get or create user in database
    const user = await createOrGetUser(
      session.user.email,
      session.user.name || undefined,
      session.user.image || undefined
    )

    // Get user credits
    const credits = await getUserCredits(user.id)

    // Get user's book purchases
    const bookPurchases = await getUserBookPurchases(user.id)

    // Get book usage data
    log('Profile API: Getting book usage for user:', user.id)
    const bookExplanations = await getAllUserBookUsage(user.id)
    log('Profile API: Book explanations:', bookExplanations)
    const usageData = await getUserTotalUsage(user.id)
    log('Profile API: Usage data:', usageData)
    const totalExplanations = usageData.total
    const todayExplanations = usageData.today

    // Normalize author names for James Joyce books
    const normalizeAuthor = (title: string, author: string) => {
      if (author === 'Joyce' && ['Ulysses', 'A Portrait of the Artist as a Young Man', 'Dubliners', 'Exiles: A Play in Three Acts', 'Finnegans Wake'].includes(title)) {
        return 'James Joyce'
      }
      return author
    }

    // Map to stable IDs for better book identification
    const mapToStableIds = (bookPurchases: any[]) => {
      const stableIdMapping: { [key: string]: string } = {
        'finnegans-wake-joyce': 'custom-finnegans-wake',
        'finnegans-wake-james-joyce': 'custom-finnegans-wake',
        'ulysses-joyce': 'pg-4300',
        'ulysses-james-joyce': 'pg-4300',
        'dubliners-joyce': 'pg-2814',
        'dubliners-james-joyce': 'pg-2814',
        'a-portrait-of-the-artist-as-a-young-man-joyce': 'pg-4217',
        'a-portrait-of-the-artist-as-a-young-man-james-joyce': 'pg-4217',
        'exiles-a-play-in-three-acts-joyce': 'pg-55945',
        'exiles-a-play-in-three-acts-james-joyce': 'pg-55945',
      }
      
      return bookPurchases.map(bp => {
        const normalizedAuthor = normalizeAuthor(bp.book_title, bp.book_author)
        const legacyKey = `${bp.book_title}-${normalizedAuthor}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
        return stableIdMapping[legacyKey] || legacyKey
      })
    }

    // Build response
    const profileData = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      firstLogin: user.created_at,
      credits: credits,
      purchasedBooks: mapToStableIds(bookPurchases),
      bookPurchases: bookPurchases.map(bp => ({
        ...bp,
        book_author: normalizeAuthor(bp.book_title, bp.book_author)
      })),
      totalExplanations: totalExplanations,
      todayExplanations: todayExplanations,
      bookExplanations: bookExplanations
    }

    return NextResponse.json(profileData)
  } catch (error) {
    console.error('Error loading user profile:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to load profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const updates = await request.json()
    
    // For now, we'll just return success since profile updates 
    // (like age, language, education) can be handled later
    // The main data (credits, purchases) is managed by other endpoints
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' }, 
      { status: 500 }
    )
  }
}
