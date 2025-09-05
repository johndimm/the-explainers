import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createOrGetUser, grantUnlimitedAccess, logUsage } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { duration } = await request.json()
    
    if (!['month', 'year'].includes(duration)) {
      return NextResponse.json({ error: 'Invalid duration. Must be "month" or "year"' }, { status: 400 })
    }

    // Get user
    const user = await createOrGetUser(session.user.email)
    
    // Grant unlimited access
    await grantUnlimitedAccess(user.id, duration)
    
    // Log the purchase
    await logUsage(user.id, 'unlimited', 'access', 'credit_purchase')
    
    return NextResponse.json({ 
      success: true,
      message: `Granted unlimited access for ${duration}`
    })
  } catch (error) {
    console.error('Error granting unlimited access:', error)
    return NextResponse.json(
      { error: 'Failed to grant unlimited access' }, 
      { status: 500 }
    )
  }
}
