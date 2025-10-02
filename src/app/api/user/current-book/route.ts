import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserCurrentBook, createOrUpdateUserCurrentBook } from '@/lib/database'
import { log } from '@/utils/log'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    log('api', 'Current book API - session:', session ? 'exists' : 'null')
    log('api', 'Current book API - user email:', session?.user?.email)
    
    // In development, if no session, try to get the current book for the default user
    if (process.env.NODE_ENV === 'development' && !session?.user?.email) {
      log('api', 'Current book API - development mode, trying default user')
      const currentBook = await getUserCurrentBook('dev-user@example.com')
      if (currentBook) {
        return NextResponse.json(currentBook)
      }
      return NextResponse.json({ error: 'Current book not found' }, { status: 404 })
    }
    
    if (!session?.user?.email) {
      log('api', 'Current book API - no user email, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentBook = await getUserCurrentBook(session.user.email)
    
    if (!currentBook) {
      return NextResponse.json({ error: 'Current book not found' }, { status: 404 })
    }

    return NextResponse.json(currentBook)
  } catch (error) {
    log('ui','Error fetching user current book:', error)
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
    const { title, author, url } = body

    if (!title || !author || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const currentBook = await createOrUpdateUserCurrentBook({
      email: userEmail,
      title,
      author,
      url
    })

    return NextResponse.json(currentBook)
  } catch (error) {
    log('ui','Error creating/updating user current book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
