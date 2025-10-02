import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/utils/log'
import { initializeDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    return NextResponse.json({ message: 'Database initialized successfully' })
  } catch (error) {
    log('api','Error initializing database:', error)
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 })
  }
}











