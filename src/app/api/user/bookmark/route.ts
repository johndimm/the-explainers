import { NextRequest, NextResponse } from 'next/server'
import { getUserBookmark, createOrUpdateUserBookmark } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const { searchParams } = new URL(request.url)
    const bookTitle = searchParams.get('bookTitle')
    const bookAuthor = searchParams.get('bookAuthor')
    
    if (!bookTitle || !bookAuthor) {
      return NextResponse.json({ error: 'Book title and author are required' }, { status: 400 })
    }
    
    const bookmark = await getUserBookmark(userAgent, bookTitle, bookAuthor)
    
    if (bookmark) {
      return NextResponse.json(bookmark)
    } else {
      return NextResponse.json({ 
        user_agent: userAgent,
        book_title: bookTitle,
        book_author: bookAuthor,
        scroll_position: 0,
        bookmark_exists: false,
        created_at: new Date(),
        updated_at: new Date()
      })
    }
  } catch (error) {
    console.error('Error getting bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const body = await request.json()
    
    const { bookTitle, bookAuthor, scrollPosition } = body
    
    if (!bookTitle || !bookAuthor || scrollPosition === undefined) {
      return NextResponse.json({ error: 'Book title, author, and scroll position are required' }, { status: 400 })
    }
    
    const bookmark = await createOrUpdateUserBookmark({
      user_agent: userAgent,
      book_title: bookTitle,
      book_author: bookAuthor,
      scroll_position: Math.round(scrollPosition)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Bookmark saved successfully',
      bookmark: bookmark
    })
  } catch (error) {
    console.error('Error saving bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}