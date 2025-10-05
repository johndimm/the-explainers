import { NextRequest, NextResponse } from 'next/server'
import { getUserProfile, createOrUpdateUserProfile, updateUserProfileFields } from '@/lib/database'
import { log } from '@/utils/log'

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Return mock profile for all users (no authentication required)
    const mockProfile = {
      user_agent: userAgent,
      age: null,
      language: 'english',
      education_level: 'high-school',
      first_login: new Date(),
      total_explanations: 0,
      today_explanations: 0,
      available_credits: 100,
      book_explanations: {},
      purchased_books: [],
      purchased_book_details: {},
      has_unlimited_access: true,
      unlimited_access_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date()
    }
    
    return NextResponse.json(mockProfile)
  } catch (error) {
    log('ui','Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // In this simplified version, we just return the mock profile
    // No actual database operations needed
    log('Profile API: Simplified mode - returning mock profile for userAgent:', userAgent)
    
    const mockProfile = {
      user_agent: userAgent,
      age: null,
      language: 'english',
      education_level: 'high-school',
      first_login: new Date(),
      total_explanations: 0,
      today_explanations: 0,
      available_credits: 100,
      book_explanations: {},
      purchased_books: [],
      purchased_book_details: {},
      has_unlimited_access: true,
      unlimited_access_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date()
    }
    
    return NextResponse.json(mockProfile)
  } catch (error) {
    log('ui','Error creating/updating user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}