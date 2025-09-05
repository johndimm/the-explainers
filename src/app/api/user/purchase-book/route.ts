import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createOrGetUser, purchaseBook, logUsage } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { bookTitle, author, url } = await request.json()
    
    if (!bookTitle || !author) {
      return NextResponse.json({ error: 'Book title and author required' }, { status: 400 })
    }

    // Get user
    const user = await createOrGetUser(session.user.email)
    
    // Purchase book
    await purchaseBook(user.id, bookTitle, author)
    
    // Log the purchase
    await logUsage(user.id, bookTitle, author, 'book_purchase')
    
    return NextResponse.json({ 
      success: true,
      message: `Purchased ${bookTitle} by ${author}`
    })
  } catch (error) {
    console.error('Error purchasing book:', error)
    return NextResponse.json(
      { error: 'Failed to purchase book' }, 
      { status: 500 }
    )
  }
}
