import { Message } from '../types/ChatInterface'

export const createUserMessage = (text: string): Message => ({
  id: Date.now().toString(),
  role: 'user',
  content: `"${text}"`,
  timestamp: new Date()
})

export const createAssistantMessage = (
  content: string,
  provider: string,
  style: string,
  model?: string,
  videoId?: string,
  videoTitle?: string
): Message => ({
  id: Date.now().toString(),
  role: 'assistant',
  content,
  provider,
  style,
  model,
  videoId,
  videoTitle,
  timestamp: new Date()
})

export const createErrorMessage = (content: string): Message => ({
  id: Date.now().toString(),
  role: 'assistant',
  content,
  provider: 'error',
  style: 'error',
  timestamp: new Date()
})

export const getHiddenMessageCount = (messages: Message[], showFullHistory: boolean): number => {
  if (showFullHistory || messages.length <= 2) {
    return 0
  }
  
  // Find the index of the last user message (most recent quote)
  let lastUserMessageIndex = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      lastUserMessageIndex = i
      break
    }
  }
  
  // If we found a user message, calculate how many messages are hidden before the last exchange
  if (lastUserMessageIndex >= 0) {
    // Find the last assistant message after the last user message
    let lastAssistantMessageIndex = -1
    for (let i = messages.length - 1; i > lastUserMessageIndex; i--) {
      if (messages[i].role === 'assistant') {
        lastAssistantMessageIndex = i
        break
      }
    }
    
    // If we found an assistant message after the last user message, hide everything before it
    if (lastAssistantMessageIndex >= 0) {
      return lastAssistantMessageIndex
    }
  }
  
  return 0
}

export const getDisplayedMessages = (messages: Message[], showFullHistory: boolean): Message[] => {
  if (showFullHistory) {
    return messages
  }
  
  const hiddenCount = getHiddenMessageCount(messages, showFullHistory)
  return messages.slice(hiddenCount)
}

export const saveMessagesToStorage = (messages: Message[]): void => {
  if (messages.length > 0) {
    sessionStorage.setItem('chatHistory', JSON.stringify(messages))
  }
}

export const loadMessagesFromStorage = (): Message[] => {
  try {
    const stored = sessionStorage.getItem('chatHistory')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const clearMessagesFromStorage = (): void => {
  sessionStorage.removeItem('chatHistory')
}
