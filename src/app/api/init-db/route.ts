import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/utils/log'
import { initializeDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Initializing database...')
    console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL)
    await initializeDatabase()
    console.log('✅ Database initialized successfully')
    return NextResponse.json({ message: 'Database initialized successfully' })
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    log('api','Error initializing database:', error)
    return NextResponse.json({ 
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}











