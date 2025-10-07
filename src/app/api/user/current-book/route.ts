import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/utils/log'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Return mock current book data (no authentication required)
    const mockCurrentBook = {
      user_id: userId,
      title: '',
      author: '',
      url: '',
      created_at: new Date(),
      updated_at: new Date()
    }
    
    return NextResponse.json(mockCurrentBook)
  } catch (error) {
    log('ui','Error fetching user current book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, url, userId } = body

    if (!title || !author || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // In this simplified version, we just return the data
    // No actual database operations needed
    const mockCurrentBook = {
      user_id: userId,
      title,
      author,
      url,
      created_at: new Date(),
      updated_at: new Date()
    }

    return NextResponse.json(mockCurrentBook)
  } catch (error) {
    log('ui','Error creating/updating user current book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}