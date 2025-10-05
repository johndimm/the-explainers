import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/utils/log'

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Return mock current book data (no authentication required)
    const mockCurrentBook = {
      user_agent: userAgent,
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
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const body = await request.json()
    const { title, author, url } = body

    if (!title || !author || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // In this simplified version, we just return the data
    // No actual database operations needed
    const mockCurrentBook = {
      user_agent: userAgent,
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