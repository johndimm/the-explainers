import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const { searchParams } = new URL(request.url)
    const bookTitle = searchParams.get('bookTitle')
    const bookAuthor = searchParams.get('bookAuthor')
    
    // Return mock bookmark data (no authentication required)
    const mockBookmark = {
      user_agent: userAgent,
      book_title: bookTitle || '',
      book_author: bookAuthor || '',
      scroll_position: 0,
      bookmark_exists: false,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    return NextResponse.json(mockBookmark)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const body = await request.json()
    
    // In this simplified version, we just return success
    // No actual database operations needed
    const mockBookmark = {
      user_agent: userAgent,
      book_title: body.bookTitle || '',
      book_author: body.bookAuthor || '',
      scroll_position: body.scrollPosition || 0,
      bookmark_exists: true,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    return NextResponse.json({
      success: true,
      message: 'Bookmark saved (simplified mode)',
      bookmark: mockBookmark
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}