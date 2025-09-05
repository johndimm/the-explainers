import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with a secret key
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (process.env.NODE_ENV === 'production' && secret !== process.env.INIT_DB_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await initializeDatabase()
    
    return NextResponse.json({ 
      message: 'Database initialized successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error }, 
      { status: 500 }
    )
  }
}
