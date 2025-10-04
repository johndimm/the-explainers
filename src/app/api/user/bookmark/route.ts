import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Return empty bookmark data to prevent console errors
  return NextResponse.json({
    scroll_position: 0,
    bookmark_exists: false
  })
}

export async function POST(request: NextRequest) {
  // Accept bookmark saves but don't actually store them
  return NextResponse.json({
    success: true,
    message: 'Bookmark saved (not persisted)'
  })
}