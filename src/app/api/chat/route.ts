import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { log } from '@/utils/log'
import modelsData from '@/data/models.json'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  provider: 'openai' | 'anthropic' | 'deepseek' | 'gemini'
  model?: string
  responseLength: 'brief' | 'medium' | 'long'
  style?: string
  selectedText?: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const deepseekOpenai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

async function callOpenAI(messages: ChatMessage[], responseLength: string, model: string = (modelsData as any).defaults.openai, style?: string): Promise<string> {
  const maxTokens = responseLength === 'brief' ? 200 : responseLength === 'medium' ? 500 : 1200
  
  try {
    log(`Testing OpenAI with model: ${model}`)
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: maxTokens,
    })

    return completion.choices[0]?.message?.content || 'No response'
  } catch (error) {
    log('api','OpenAI API error:', error)
    throw error
  }
}

async function callAnthropic(messages: ChatMessage[], responseLength: string, model: string = (modelsData as any).defaults.anthropic, style?: string): Promise<string> {
  const maxTokens = responseLength === 'brief' ? 200 : responseLength === 'medium' ? 500 : 1200
  
  const systemMessage = messages.find(m => m.role === 'user')?.content.includes('Please explain this text:') 
    ? 'You are a helpful literary and text analysis assistant. Provide clear, insightful explanations of text passages.'
    : 'You are a helpful assistant.'

  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: 0.7,
      system: systemMessage,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    return response.content[0]?.type === 'text' ? response.content[0].text : 'No response'
  } catch (error: any) {
    log('api','Anthropic API error:', error)
    
    // Handle specific error cases
    if (error.message?.includes('model') && error.message?.includes('not found')) {
      throw new Error(`Model "${model}" is not available. Please try a different Claude model.`)
    }
    
    if (error.message?.includes('API key')) {
      throw new Error('Invalid Anthropic API key. Please check your API key configuration.')
    }
    
    if (error.message?.includes('inference profile')) {
      throw new Error(`Model "${model}" requires special setup. Please try a different Claude model like "${(modelsData as any).defaults.anthropic}".`)
    }
    
    // Generic error
    throw new Error(`Claude API error: ${error.message || 'Unknown error'}`)
  }
}

async function callDeepSeek(messages: ChatMessage[], responseLength: string, model: string = (modelsData as any).defaults.deepseek, style?: string): Promise<string> {
  const maxTokens = responseLength === 'brief' ? 200 : responseLength === 'medium' ? 500 : 2000
  
  const completion = await deepseekOpenai.chat.completions.create({
    model: model,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    temperature: 0.7,
    max_tokens: maxTokens,
  })

  return completion.choices[0]?.message?.content || 'No response'
}

async function callGemini(messages: ChatMessage[], responseLength: string, modelName: string = (modelsData as any).defaults.gemini, style?: string): Promise<string> {
  const maxTokens = responseLength === 'brief' ? 1000 : responseLength === 'medium' ? 2000 : 4000
  
  try {
    console.log('🔍 Gemini model name:', modelName)
    log('api','Gemini API call:', { modelName, maxTokens, messageCount: messages.length })
    
    const model = gemini.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        maxOutputTokens: maxTokens,
      }
    })
    
    // Combine all messages into a single prompt
    const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
    log('api','Gemini sending prompt:', prompt.substring(0, 100) + '...')
    
    const result = await model.generateContent(prompt)
    console.log('🔍 Gemini result:', result)
    
    const response = await result.response
    console.log('🔍 Gemini response:', response)
    
    const text = response.text()
    console.log('🔍 Gemini text:', text)
    console.log('🔍 Gemini text length:', text.length)
    
    log('api','Gemini response received:', text.substring(0, 100) + '...')
    return text
  } catch (error) {
    log('api','Gemini API error:', error)
    log('api','Gemini error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

export async function POST(request: NextRequest) {
  let provider: string = 'unknown'
  
  try {
    // Check API keys availability
    const apiKeys = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    }
    
    log('api','API Keys status:', apiKeys)
    log('api','Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      GEMINI_API_KEY_LENGTH: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
      GEMINI_API_KEY_PREFIX: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'undefined'
    })
    
    const body: ChatRequest = await request.json()
    const { messages, responseLength, style, selectedText, model } = body
    provider = body.provider

    log('api','Chat API request:', { 
      provider, 
      model, 
      responseLength, 
      messageCount: messages?.length,
      userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...'
    })

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Check if we have the required API key
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }
    if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }
    if (provider === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 })
    }
    if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    let response: string

    switch (provider) {
      case 'openai':
        log('api','Calling OpenAI...')
        response = await callOpenAI(messages, responseLength, model, style)
        break
      case 'anthropic':
        log('api','Calling Anthropic...')
        response = await callAnthropic(messages, responseLength, model, style)
        break
      case 'deepseek':
        log('api','Calling DeepSeek...')
        response = await callDeepSeek(messages, responseLength, model, style)
        break
      case 'gemini':
        log('api','Calling Gemini...')
        response = await callGemini(messages, responseLength, model, style)
        break
      default:
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    log('api','Chat API success:', { provider, responseLength: response.length })
    return NextResponse.json({ 
      message: response,
      provider: provider
    })

  } catch (error) {
    log('api','Chat API error for provider:', provider)
    log('api','Full error details:', error)
    
    // More specific error handling
    let errorMessage = 'Sorry, I encountered an error...'
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'API key error. Please check your configuration.'
      } else if (error.message.includes('model')) {
        errorMessage = 'Model not available. Please try a different model.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      } else {
        errorMessage = `Error: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
}
