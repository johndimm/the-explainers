export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  provider?: string
  style?: string
  model?: string
  videoId?: string
  videoTitle?: string
  rating?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}
