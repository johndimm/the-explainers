import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { log } from '@/utils/log'

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

async function callOpenAI(messages: ChatMessage[], responseLength: string, model: string = 'gpt-4o', style?: string): Promise<string> {
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
    console.error('OpenAI API error:', error)
    throw error
  }
}

async function callAnthropic(messages: ChatMessage[], responseLength: string, model: string = 'claude-3-5-sonnet-20241022', style?: string): Promise<string> {
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
    console.error('Anthropic API error:', error)
    
    // Handle specific error cases
    if (error.message?.includes('model') && error.message?.includes('not found')) {
      throw new Error(`Model "${model}" is not available. Please try a different Claude model.`)
    }
    
    if (error.message?.includes('API key')) {
      throw new Error('Invalid Anthropic API key. Please check your API key configuration.')
    }
    
    if (error.message?.includes('inference profile')) {
      throw new Error(`Model "${model}" requires special setup. Please try a different Claude model like "claude-3-5-sonnet-20241022".`)
    }
    
    // Generic error
    throw new Error(`Claude API error: ${error.message || 'Unknown error'}`)
  }
}

async function callDeepSeek(messages: ChatMessage[], responseLength: string, model: string = 'deepseek-chat', style?: string): Promise<string> {
  const maxTokens = responseLength === 'brief' ? 200 : responseLength === 'medium' ? 500 : 1500
  
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

async function callGemini(messages: ChatMessage[], responseLength: string, modelName: string = 'gemini-1.5-flash', style?: string): Promise<string> {
  const maxTokens = responseLength === 'brief' ? 200 : responseLength === 'medium' ? 500 : 1200
  
  const model = gemini.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      maxOutputTokens: maxTokens,
    }
  })
  
  // Start chat session with conversation history
  const chat = model.startChat({
    history: messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))
  })
  
  const lastUserMessage = messages[messages.length - 1]?.content || ''
  const result = await chat.sendMessage(lastUserMessage)
  const response = await result.response
  return response.text()
}

export async function POST(request: NextRequest) {
  let provider: string = 'unknown'
  
  try {
    const body: ChatRequest = await request.json()
    const { messages, responseLength, style, selectedText, model } = body
    provider = body.provider

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    let response: string

    switch (provider) {
      case 'openai':
        response = await callOpenAI(messages, responseLength, model, style)
        break
      case 'anthropic':
        response = await callAnthropic(messages, responseLength, model, style)
        break
      case 'deepseek':
        response = await callDeepSeek(messages, responseLength, model, style)
        break
      case 'gemini':
        response = await callGemini(messages, responseLength, model, style)
        break
      default:
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: response,
      provider: provider
    })

  } catch (error) {
    console.error('Chat API error for provider:', provider)
    console.error('Full error details:', error)
    return NextResponse.json(
      { error: `Failed to process chat request with ${provider}: ${error}` }, 
      { status: 500 }
    )
  }
}
