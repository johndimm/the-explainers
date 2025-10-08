import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/utils/log'

// CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders })
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
    
    return NextResponse.json(defaultSettings, { headers: corsHeaders })
  } catch (error) {
    log('api','Error fetching user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders })
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
    
    return NextResponse.json(defaultSettings, { headers: corsHeaders })
  } catch (error) {
    log('api','Error creating/updating user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}