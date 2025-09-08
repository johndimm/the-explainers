import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserCurrentBook, createOrUpdateUserCurrentBook } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Local development bypass
    if (process.env.NODE_ENV === 'development' && !session?.user?.email) {
      return NextResponse.json({ error: 'Current book not found' }, { status: 404 })
    }
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentBook = await getUserCurrentBook(session.user.email)
    
    if (!currentBook) {
      return NextResponse.json({ error: 'Current book not found' }, { status: 404 })
    }

    return NextResponse.json(currentBook)
  } catch (error) {
    console.error('Error fetching user current book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, author, url } = body

    if (!title || !author || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const currentBook = await createOrUpdateUserCurrentBook({
      email: session.user.email,
      title,
      author,
      url
    })

    return NextResponse.json(currentBook)
  } catch (error) {
    console.error('Error creating/updating user current book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
