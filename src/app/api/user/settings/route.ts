import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/utils/log'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Return default settings for all users (no authentication required)
    const defaultSettings = {
      user_id: userId,
      llm_provider: 'gemini',
      llm_model: 'gemini-2.5-flash',
      response_length: 'medium',
      text_font: 'serif',
      chat_font: 'sans-serif',
      reading_mode: 'scroll',
      explanation_style: 'conversational',
      custom_api_key: '',
      custom_api_url: '',
      custom_model_name: '',
      created_at: new Date(),
      updated_at: new Date()
    }
    
    return NextResponse.json(defaultSettings)
  } catch (error) {
    log('api','Error fetching user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // In this simplified version, we just return the default settings
    // No actual database operations needed
    log('Settings API: Simplified mode - returning default settings for userId:', userId)
    
    const defaultSettings = {
      user_id: userId,
      llm_provider: 'gemini',
      llm_model: 'gemini-2.5-flash',
      response_length: 'medium',
      text_font: 'serif',
      chat_font: 'sans-serif',
      reading_mode: 'scroll',
      explanation_style: 'conversational',
      custom_api_key: '',
      custom_api_url: '',
      custom_model_name: '',
      created_at: new Date(),
      updated_at: new Date()
    }
    
    return NextResponse.json(defaultSettings)
  } catch (error) {
    log('api','Error creating/updating user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}