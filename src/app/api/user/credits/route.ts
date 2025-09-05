import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createOrGetUser, purchaseCredits } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { amount = 100 } = await request.json()
    
    // For the $5 pricing model, we'll default to 100 credits
    // Only allow 100 credit purchases for now (can expand later)
    if (amount !== 100) {
      return NextResponse.json({ error: 'Only 100 credit purchases supported' }, { status: 400 })
    }

    // Get user
    const user = await createOrGetUser(session.user.email)
    
    // Purchase credits (includes logging)
    await purchaseCredits(user.id, amount)
    
    return NextResponse.json({ 
      success: true,
      message: `Purchased ${amount} credits for $5`
    })
  } catch (error) {
    console.error('Error adding credits:', error)
    return NextResponse.json(
      { error: 'Failed to add credits' }, 
      { status: 500 }
    )
  }
}
