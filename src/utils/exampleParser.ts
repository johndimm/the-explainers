/**
 * Utility functions for parsing example chat history files
 */

export interface ExampleInfo {
  source: string
  explainer: string
  provider: string
  quote: string
  filename: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  provider?: string
  model?: string
  style?: string
}

export interface ContextInfo {
  book?: string
  verse?: string
  act?: string
  scene?: string
  chapter?: string
  speaker?: string
  charactersOnStage?: string[]
}

export interface ParsedExample {
  source: string
  explainer: string
  provider: string
  quote: string
  filename: string
  messages: ChatMessage[]
  contextInfo: ContextInfo
  settings?: {
    provider: string
    style: string
    responseLength: string
  }
}

/**
 * Extracts explainer information from the last assistant response in an HTML chat history file
 */
export function extractExplainerFromHTML(htmlContent: string): { explainer: string; provider: string } {
  // Find all provider badges in the HTML
  const providerBadgeRegex = /<span class="provider-badge[^"]*">([^<]+)<\/span>/g
  const matches = Array.from(htmlContent.matchAll(providerBadgeRegex))
  
  if (matches.length === 0) {
    return { explainer: 'Unknown', provider: 'Unknown' }
  }
  
  // Get the last provider badge (which should be from the last assistant response)
  const lastBadge = matches[matches.length - 1][1]
  
  // Parse the badge content to extract provider and style information
  // Format examples:
  // "GEMINI (gemini-1.5-flash)"
  // "GEMINI (gemini-1.5-flash) - in the style of Donald Trump"
  // "DEEPSEEK (deepseek-chat)"
  // "DEEPSEEK"
  
  const styleMatch = lastBadge.match(/- in the style of (.+)$/)
  if (styleMatch) {
    const styleName = styleMatch[1]
    const providerMatch = lastBadge.match(/^([A-Z]+)/)
    const provider = providerMatch ? providerMatch[1] : 'Unknown'
    return { 
      explainer: `In the style of ${styleName}`, 
      provider 
    }
  } else {
    // No style information, just provider
    const providerMatch = lastBadge.match(/^([A-Z]+)/)
    const provider = providerMatch ? providerMatch[1] : 'Unknown'
    return { 
      explainer: 'Neutral explanation', 
      provider 
    }
  }
}

/**
 * Extracts the selected quote from the first user message in an HTML chat history file
 */
export function extractQuoteFromHTML(htmlContent: string): string {
  // Look for the selected quote in the first user message
  const selectedQuoteRegex = /<div class="selected-quote">"([^"]+)"<\/div>/
  const match = htmlContent.match(selectedQuoteRegex)
  
  if (match) {
    return `"${match[1]}"`
  }
  
  // Fallback: look for any quoted text in user messages
  const userQuoteRegex = /<div class="message user">[\s\S]*?<div class="selected-quote">"([^"]+)"<\/div>/
  const fallbackMatch = htmlContent.match(userQuoteRegex)
  
  if (fallbackMatch) {
    return `"${fallbackMatch[1]}"`
  }
  
  return 'No quote found'
}

/**
 * Extracts the source title from the HTML title or header
 */
export function extractSourceFromHTML(htmlContent: string): string {
  // Try to extract from the title tag first
  const titleMatch = htmlContent.match(/<title>Chat History: ([^<]+)<\/title>/)
  if (titleMatch) {
    return titleMatch[1]
  }
  
  // Fallback: look for the chat title in the header
  const headerMatch = htmlContent.match(/<div class="chat-title">([^<]+)<\/div>/)
  if (headerMatch) {
    return headerMatch[1].replace(' Discussion', '')
  }
  
  return 'Unknown Source'
}

/**
 * Extracts chat messages from HTML content
 */
export function extractChatMessages(htmlContent: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  
  // Find all message divs - updated regex to handle the structure better
  const messageRegex = /<div class="message (user|assistant)">\s*<div class="message-bubble">([\s\S]*?)<\/div>\s*<div class="message-meta">([\s\S]*?)<\/div>\s*<\/div>/g
  let match
  
  while ((match = messageRegex.exec(htmlContent)) !== null) {
    const role = match[1] as 'user' | 'assistant'
    const bubbleContent = match[2]
    const metaContent = match[3]
    
    let content = bubbleContent
    
    // For user messages, extract the selected quote
    if (role === 'user') {
      const quoteMatch = content.match(/<div class="selected-quote">"([^"]+)"<\/div>/)
      if (quoteMatch) {
        content = `"${quoteMatch[1]}"`
      } else {
        // Try multi-line quote without quotes
        const multiLineQuoteMatch = content.match(/<div class="selected-quote">([^<]+)<\/div>/)
        if (multiLineQuoteMatch) {
          content = `"${multiLineQuoteMatch[1].trim()}"`
        } else {
          // Fallback: clean HTML tags if no quote found
          content = content.replace(/<[^>]*>/g, '').trim()
        }
      }
    } else {
      // For assistant messages, clean up any HTML tags
      content = content.replace(/<[^>]*>/g, '').trim()
    }
    
    // Extract timestamp
    const timestampMatch = metaContent.match(/<span class="timestamp">([^<]+)<\/span>/)
    const timestamp = timestampMatch ? timestampMatch[1] : ''
    
    // Extract provider info for assistant messages
    let provider = ''
    let model = ''
    let style = ''
    
    if (role === 'assistant') {
      const providerMatch = metaContent.match(/<span class="provider-badge[^"]*">([^<]+)<\/span>/)
      if (providerMatch) {
        const providerText = providerMatch[1]
        
        // Parse provider and model
        const providerMatch2 = providerText.match(/^([A-Z]+)/)
        if (providerMatch2) {
          provider = providerMatch2[1]
        }
        
        // Parse model (in parentheses)
        const modelMatch = providerText.match(/\(([^)]+)\)/)
        if (modelMatch) {
          model = modelMatch[1]
        }
        
        // Parse style (after "in the style of")
        const styleMatch = providerText.match(/- in the style of (.+)$/)
        if (styleMatch) {
          style = styleMatch[1]
        }
      }
    }
    
    messages.push({
      role,
      content: content.trim(),
      timestamp,
      provider: provider || undefined,
      model: model || undefined,
      style: style || undefined
    })
  }
  
  return messages
}

/**
 * Extracts context information from HTML content
 */
export function extractContextInfo(htmlContent: string): ContextInfo {
  const contextInfo: ContextInfo = {}
  
  // Look for context items
  const contextItemRegex = /<div class="context-item"><span class="context-label">([^:]+):<\/span>([^<]+)<\/div>/g
  let match
  
  while ((match = contextItemRegex.exec(htmlContent)) !== null) {
    const label = match[1].toLowerCase().trim()
    const value = match[2].trim()
    
    switch (label) {
      case 'book':
        contextInfo.book = value
        break
      case 'verse':
        contextInfo.verse = value
        break
      case 'act':
        contextInfo.act = value
        break
      case 'scene':
        contextInfo.scene = value
        break
      case 'chapter':
        contextInfo.chapter = value
        break
      case 'speaker':
        contextInfo.speaker = value
        break
      case 'characters on stage':
        contextInfo.charactersOnStage = value.split(',').map(c => c.trim())
        break
    }
  }
  
  return contextInfo
}

/**
 * Extracts settings from HTML content
 */
export function extractSettings(htmlContent: string): { provider: string; style: string; responseLength: string } | undefined {
  const settingsRegex = /<div class="settings-footer">([\s\S]*?)<\/div>/
  const settingsMatch = htmlContent.match(settingsRegex)
  
  if (!settingsMatch) return undefined
  
  const settingsContent = settingsMatch[1]
  const settings: { provider: string; style: string; responseLength: string } = {
    provider: '',
    style: '',
    responseLength: ''
  }
  
  // Extract provider
  const providerMatch = settingsContent.match(/<span class="settings-item"><span class="settings-label">Provider:<\/span>([^<]+)<\/span>/)
  if (providerMatch) settings.provider = providerMatch[1]
  
  // Extract style
  const styleMatch = settingsContent.match(/<span class="settings-item"><span class="settings-label">Style:<\/span>([^<]+)<\/span>/)
  if (styleMatch) settings.style = styleMatch[1]
  
  // Extract response length
  const lengthMatch = settingsContent.match(/<span class="settings-item"><span class="settings-label">Length:<\/span>([^<]+)<\/span>/)
  if (lengthMatch) settings.responseLength = lengthMatch[1]
  
  return settings
}

/**
 * Parses a complete HTML chat history file and extracts all relevant information
 */
export function parseExampleHTML(htmlContent: string, filename: string): ExampleInfo {
  const { explainer, provider } = extractExplainerFromHTML(htmlContent)
  const quote = extractQuoteFromHTML(htmlContent)
  const source = extractSourceFromHTML(htmlContent)
  
  return {
    source,
    explainer,
    provider,
    quote,
    filename
  }
}

/**
 * Parses a complete HTML chat history file and extracts all detailed information
 */
export function parseDetailedExampleHTML(htmlContent: string, filename: string): ParsedExample {
  const { explainer, provider } = extractExplainerFromHTML(htmlContent)
  const quote = extractQuoteFromHTML(htmlContent)
  const source = extractSourceFromHTML(htmlContent)
  const messages = extractChatMessages(htmlContent)
  const contextInfo = extractContextInfo(htmlContent)
  const settings = extractSettings(htmlContent)
  
  return {
    source,
    explainer,
    provider,
    quote,
    filename,
    messages,
    contextInfo,
    settings
  }
}

/**
 * Static examples data with correct explainer information extracted from the actual files
 * This is a fallback in case dynamic parsing fails
 */
export const staticExamples: ExampleInfo[] = [
  {
    source: "The King James Version of the Bible",
    explainer: "In the style of Donald Trump",
    provider: "DEEPSEEK",
    quote: "\"37:11 But the meek shall inherit the earth\"",
    filename: "bible-trump.html"
  },
  {
    source: "Tractatus Logico-Philosophicus by Ludwig Wittgenstein",
    explainer: "In the style of W.V.O. Quine",
    provider: "DEEPSEEK",
    quote: "\"[1] The world is everything that is the case.\"",
    filename: "wittgenstein-quine.html"
  },
  {
    source: "Finnegans Wake by James Joyce",
    explainer: "In the style of David Foster Wallace",
    provider: "GEMINI",
    quote: "\"This the way to the museyroom. Mind your hats goan in! Now yiz are in the Willingdone Museyroom. This is a Prooshi-ous gunn. This is a ffrinch. Tip. This is the flag of the Prooshi-ous, the Cap and Soracer. This is the bullet that byng the flag of the Prooshious.\"",
    filename: "finnigans-wake-david-foster-wallace.html"
  },
  {
    source: "The Merchant of Venice by William Shakespeare",
    explainer: "Neutral explanation",
    provider: "GEMINI",
    quote: "\"Your mind is tossing on the ocean, There where your argosies, with portly sail Like signiors and rich burghers on the flood, Or as it were the pageants of the sea,\"",
    filename: "merchant-of-venice-ship-worries.html"
  },
  {
    source: "The Merchant of Venice by William Shakespeare",
    explainer: "Neutral explanation",
    provider: "DEEPSEEK",
    quote: "\"Then let us say you are sad Because you are not merry; and 'twere as easy For you to laugh and leap and say you are merry Because you are not sad.\"",
    filename: "merchant-of-venice-happy-sad.html"
  },
  {
    source: "Othello by William Shakespeare",
    explainer: "In the style of Harold Bloom",
    provider: "DEEPSEEK",
    quote: "\"Let the devil and his dam haunt you!\"",
    filename: "devil-and-his-dam.html"
  }
]
