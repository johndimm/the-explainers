import { NextRequest, NextResponse } from 'next/server'
import { getUserBookmark, createOrUpdateUserBookmark } from '@/lib/database'

// CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookTitle = searchParams.get('bookTitle')
    const bookAuthor = searchParams.get('bookAuthor')
    const userId = searchParams.get('userId')
    
    if (!bookTitle || !bookAuthor) {
      return NextResponse.json({ error: 'Book title and author are required' }, { status: 400 })
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const bookmark = await getUserBookmark(userId, bookTitle, bookAuthor)
    
    if (bookmark) {
      return NextResponse.json({
        ...bookmark,
        bookmark_exists: true
      }, { headers: corsHeaders })
    } else {
      return NextResponse.json({ 
        user_id: userId,
        book_title: bookTitle,
        book_author: bookAuthor,
        scroll_position: 0,
        bookmark_exists: false,
        created_at: new Date(),
        updated_at: new Date()
      }, { headers: corsHeaders })
    }
  } catch (error) {
    console.error('Error getting bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { bookTitle, bookAuthor, scrollPosition, userId } = body
    
    console.log('🔍 API: Full body:', JSON.stringify(body))
    console.log('🔍 API: Received user ID:', userId)
    
    if (!bookTitle || !bookAuthor || scrollPosition === undefined) {
      return NextResponse.json({ error: 'Book title, author, and scroll position are required' }, { status: 400, headers: corsHeaders })
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders })
    }
    
    console.log('🔍 API: Using user ID:', userId)
    
    const bookmark = await createOrUpdateUserBookmark({
      user_id: userId,
      book_title: bookTitle,
      book_author: bookAuthor,
      scroll_position: Math.round(scrollPosition)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Bookmark saved successfully',
      bookmark: bookmark
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error saving bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}