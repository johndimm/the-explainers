import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/utils/log'

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Return default settings for all users (no authentication required)
    const defaultSettings = {
      user_agent: userAgent,
      llm_provider: 'gemini',
      llm_model: 'gemini-1.5-flash',
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
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // In this simplified version, we just return the default settings
    // No actual database operations needed
    log('Settings API: Simplified mode - returning default settings for userAgent:', userAgent)
    
    const defaultSettings = {
      user_agent: userAgent,
      llm_provider: 'gemini',
      llm_model: 'gemini-1.5-flash',
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