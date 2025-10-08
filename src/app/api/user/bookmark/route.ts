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
  console.log('🔍 BOOKMARK GET - Request received at:', new Date().toISOString())
  console.log('🔍 BOOKMARK GET - Request URL:', request.url)
  console.log('🔍 BOOKMARK GET - Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const { searchParams } = new URL(request.url)
    const bookTitle = searchParams.get('bookTitle')
    const bookAuthor = searchParams.get('bookAuthor')
    const userId = searchParams.get('userId')
    
    console.log('🔍 BOOKMARK GET - Query params:', { bookTitle, bookAuthor, userId })
    
    if (!bookTitle || !bookAuthor) {
      console.log('🔍 BOOKMARK GET - Missing book title or author')
      return NextResponse.json({ error: 'Book title and author are required' }, { status: 400 })
    }
    
    if (!userId) {
      console.log('🔍 BOOKMARK GET - Missing user ID')
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    console.log('🔍 BOOKMARK GET - Fetching bookmark for:', { userId, bookTitle, bookAuthor })
    const bookmark = await getUserBookmark(userId, bookTitle, bookAuthor)
    console.log('🔍 BOOKMARK GET - Database result:', bookmark)
    
    if (bookmark) {
      const response = {
        ...bookmark,
        bookmark_exists: true
      }
      console.log('🔍 BOOKMARK GET - Returning existing bookmark:', response)
      return NextResponse.json(response, { headers: corsHeaders })
    } else {
      const response = { 
        user_id: userId,
        book_title: bookTitle,
        book_author: bookAuthor,
        scroll_position: 0,
        bookmark_exists: false,
        created_at: new Date(),
        updated_at: new Date()
      }
      console.log('🔍 BOOKMARK GET - Returning new bookmark template:', response)
      return NextResponse.json(response, { headers: corsHeaders })
    }
  } catch (error) {
    console.error('🔍 BOOKMARK GET - Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}

export async function POST(request: NextRequest) {
  console.log('🔍 BOOKMARK POST - Request received at:', new Date().toISOString())
  console.log('🔍 BOOKMARK POST - Request URL:', request.url)
  console.log('🔍 BOOKMARK POST - Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const body = await request.json()
    console.log('🔍 BOOKMARK POST - Request body:', JSON.stringify(body, null, 2))
    
    const { bookTitle, bookAuthor, scrollPosition, userId } = body
    
    console.log('🔍 BOOKMARK POST - Parsed data:', { bookTitle, bookAuthor, scrollPosition, userId })
    
    if (!bookTitle || !bookAuthor || scrollPosition === undefined) {
      console.log('🔍 BOOKMARK POST - Missing required fields')
      return NextResponse.json({ error: 'Book title, author, and scroll position are required' }, { status: 400, headers: corsHeaders })
    }
    
    if (!userId) {
      console.log('🔍 BOOKMARK POST - Missing user ID')
      return NextResponse.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders })
    }
    
    const bookmarkData = {
      user_id: userId,
      book_title: bookTitle,
      book_author: bookAuthor,
      scroll_position: Math.round(scrollPosition)
    }
    
    console.log('🔍 BOOKMARK POST - Saving bookmark:', bookmarkData)
    
    const bookmark = await createOrUpdateUserBookmark(bookmarkData)
    console.log('🔍 BOOKMARK POST - Database result:', bookmark)
    
    const response = {
      success: true,
      message: 'Bookmark saved successfully',
      bookmark: bookmark
    }
    
    console.log('🔍 BOOKMARK POST - Returning success response:', response)
    
    return NextResponse.json(response, { headers: corsHeaders })
  } catch (error) {
    console.error('🔍 BOOKMARK POST - Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}