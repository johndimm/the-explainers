import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/database'

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Recreating user_bookmarks table with font_size column...')
    
    // Drop and recreate the table
    await client.query(`DROP TABLE IF EXISTS user_bookmarks CASCADE`)
    console.log('✅ Dropped existing user_bookmarks table')
    
    await client.query(`
      CREATE TABLE user_bookmarks (
        user_id VARCHAR(255),
        book_title TEXT NOT NULL,
        book_author TEXT NOT NULL,
        scroll_position INTEGER NOT NULL DEFAULT 0,
        font_size INTEGER DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, book_title, book_author)
      )
    `)
    console.log('✅ Created new user_bookmarks table with font_size column')
    
    return NextResponse.json({ 
      message: 'user_bookmarks table recreated successfully with font_size column',
      success: true 
    })
  } catch (error) {
    console.error('❌ Error recreating user_bookmarks table:', error)
    return NextResponse.json({ 
      error: 'Failed to recreate user_bookmarks table',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  } finally {
    client.release()
  }
}