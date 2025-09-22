import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserBookmark, createOrUpdateUserBookmark, getAllUserBookmarks } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, if no session, try to get the bookmark for the default user
    const userEmail = session?.user?.email || (process.env.NODE_ENV === 'development' ? 'dev-user@example.com' : null)
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookTitle = searchParams.get('bookTitle')
    const bookAuthor = searchParams.get('bookAuthor')

    if (bookTitle && bookAuthor) {
      // Get specific bookmark
      const bookmark = await getUserBookmark(userEmail, bookTitle, bookAuthor)
      
      if (!bookmark) {
        return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
      }

      return NextResponse.json(bookmark)
    } else {
      // Get all bookmarks for user
      const bookmarks = await getAllUserBookmarks(userEmail)
      return NextResponse.json(bookmarks)
    }
  } catch (error) {
    console.error('Error fetching user bookmark(s):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // In development, if no session, use the default user
    const userEmail = session?.user?.email || (process.env.NODE_ENV === 'development' ? 'dev-user@example.com' : null)
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookTitle, bookAuthor, scrollPosition } = body

    if (!bookTitle || !bookAuthor || scrollPosition === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const bookmark = await createOrUpdateUserBookmark({
      email: userEmail,
      book_title: bookTitle,
      book_author: bookAuthor,
      scroll_position: scrollPosition
    })

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error('Error creating/updating user bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}











