import { Message } from '../types/ChatInterface'
import { SettingsData } from '../components/Settings'
import { log } from '../utils/log'

interface ExplanationResult {
  success: boolean
  messages: Message[]
  error?: string
}

export const callLLMAPI = async (
  prompt: string,
  settings: SettingsData,
  selectedProvider: string,
  selectedModel: string
): Promise<{ success: boolean; content?: string; error?: string }> => {
  try {
    log('api', '🚀 Calling LLM API with provider:', selectedProvider)
    
    const response = await fetch('/api/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        provider: selectedProvider,
        model: selectedModel,
        responseLength: settings.responseLength,
        style: settings.explanationStyle,
        language: settings.language
      }),
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      return { success: false, error: data.error }
    }

    return { success: true, content: data.content }
  } catch (error) {
    log('api', '❌ LLM API error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const searchYouTubeVideos = async (
  text: string,
  bookTitle: string,
  author: string,
  contextInfo: any
): Promise<{ success: boolean; videos?: any[]; error?: string }> => {
  try {
    log('youtube', '🎬 Searching YouTube for:', text)
    
    const response = await fetch('/api/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        bookTitle,
        author,
        contextInfo
      }),
    })

    if (!response.ok) {
      throw new Error(`YouTube API call failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      return { success: false, error: data.error }
    }

    return { success: true, videos: data.videos }
  } catch (error) {
    log('youtube', '❌ YouTube API error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const processExplanationRequest = async (
  text: string,
  settings: SettingsData,
  selectedProvider: string,
  selectedModel: string,
  bookTitle: string,
  author: string,
  contextInfo: any
): Promise<ExplanationResult> => {
  const messages: Message[] = []
  
  try {
    // Call LLM API
    const llmResult = await callLLMAPI(text, settings, selectedProvider, selectedModel)
    
    if (llmResult.success && llmResult.content) {
      messages.push({
        id: Date.now().toString(),
        role: 'assistant',
        content: llmResult.content,
        provider: selectedProvider,
        style: settings.explanationStyle,
        model: selectedModel,
        timestamp: new Date()
      })
    } else {
      messages.push({
        id: Date.now().toString(),
        role: 'assistant',
        content: llmResult.error || 'Failed to get explanation',
        provider: 'error',
        style: 'error',
        timestamp: new Date()
      })
    }
    
    // Search for YouTube videos
    const youtubeResult = await searchYouTubeVideos(text, bookTitle, author, contextInfo)
    
    if (youtubeResult.success && youtubeResult.videos && youtubeResult.videos.length > 0) {
      const video = youtubeResult.videos[0]
      messages.push({
        id: Date.now().toString(),
        role: 'assistant',
        content: '🎬 Found related video',
        provider: 'youtube',
        style: 'neutral',
        videoId: video.videoId,
        videoTitle: video.title,
        timestamp: new Date()
      })
    }
    
    return { success: true, messages }
  } catch (error) {
    log('api', '❌ Explanation request failed:', error)
    return { 
      success: false, 
      messages: [{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'An error occurred while processing your request',
        provider: 'error',
        style: 'error',
        timestamp: new Date()
      }],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
