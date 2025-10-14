'use client'

import React, { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from './ChatInterface.module.css'
import { SettingsData, LLMProvider, ResponseLength, ExplanationStyle, LLMModel } from './Settings'
import { ProfileData } from './Profile'
import { useProfile } from '../contexts/ProfileContext'
import explainers from '../data/explainers.json'
import models from '../data/models.json'
import { log } from '../utils/log'
import { convertToHTML, convertToMarkdown, convertToPlainText } from '../utils/chatConverters'
import { getDeviceId } from '../utils/deviceId'
import { API_BASE_URL } from '../utils/apiConfig'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  provider?: LLMProvider | 'youtube'
  style?: ExplanationStyle
  videoId?: string
  videoTitle?: string
  rating?: 'good' | 'bad' | null
  model?: string
}

interface ContextInfo {
  bookTitle: string
  author: string
  act: string | null
  scene: string | null
  speaker: string | null
  charactersOnStage: string[]
  selectedText: string
  beforeContext: string
  afterContext: string
}

interface ChatInterfaceProps {
  selectedText: string
  contextInfo: ContextInfo | null
  settings: SettingsData
  profile: ProfileData
  onClose: () => void
  onSettingsChange: (settings: SettingsData) => void
  bookTitle: string
  author: string
  isPageMode?: boolean
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedText, contextInfo, settings, profile, onClose, onSettingsChange, bookTitle, author, isPageMode = false }) => {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(settings.llmProvider)
  const [currentStyle, setCurrentStyle] = useState<ExplanationStyle>(settings.explanationStyle)
  const [currentResponseLength, setCurrentResponseLength] = useState<ResponseLength>(settings.responseLength)
  const [hasChanges, setHasChanges] = useState(false)
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [originalSelectedText, setOriginalSelectedText] = useState("")
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [showProviderMenu, setShowProviderMenu] = useState(false)
  const [showHelpPopup, setShowHelpPopup] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareFormData, setShareFormData] = useState<{ title: string; content: string } | null>(null)
  const [shareDropdownOpen, setShareDropdownOpen] = useState<string | null>(null)
  const [saveFormatDropdownOpen, setSaveFormatDropdownOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const latestResponseRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const styleMenuRef = useRef<HTMLDivElement>(null)
  const providerMenuRef = useRef<HTMLDivElement>(null)
  const saveDropdownRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const { canUseExplanation, useExplanation, getBookExplanationsUsed } = useProfile()

  // Generate ordered list of all styles
  const getAllStyles = () => {
    const allStyles: { value: ExplanationStyle, name: string }[] = [
      { value: (explainers as any).neutral.value as ExplanationStyle, name: (explainers as any).neutral.name }
    ]
    
    // Add all categories in the same order as ExplainerStyles page
    Object.values((explainers as any).categories).flat().forEach((style: any) => {
      allStyles.push({ value: style.value as ExplanationStyle, name: style.name })
    })
    
    return allStyles
  }

  const getStylePersona = (style: ExplanationStyle): string => {
    if (style === 'neutral') return 'Respond in a neutral, helpful tone without any particular style or personality.'
    const baseInstruction = (explainers as any).instructions[style] || 'Respond in a neutral, helpful tone.'
    return `${baseInstruction}\n\nIMPORTANT: Don't just mimic their writing style - adopt their actual opinions, attitudes, and perspectives on the subject matter. Think like they would think, not just write like they would write.`
  }

  const getProviderLabel = (provider: LLMProvider, _model?: LLMModel) => (
    provider === 'gemini' ? 'Google Gemini' :
    provider === 'openai' ? 'OpenAI' :
    provider === 'anthropic' ? 'Anthropic Claude' :
    provider === 'deepseek' ? 'DeepSeek' :
    'Custom LLM'
  )

  const getAllProviders = () => (models as any).providers.map((provider: any) => ({
    value: provider.id,
    name: provider.name
  }))

  const getModelLabel = (model?: string) => {
    if (!model) return ''
    
    // Find the model in the models array to get its name
    for (const provider of (models as any).providers) {
      const providerModels = (models as any).models[provider.id] || []
      const foundModel = providerModels.find((m: any) => m.id === model)
      if (foundModel) {
        return foundModel.name
      }
    }
    
    return model
  }

  const scrollToLatestResponse = () => {
    // Use requestAnimationFrame to avoid forced reflow
    requestAnimationFrame(() => {
      latestResponseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  // Mobile-specific save function using improved web download
  const saveToMobileDevice = (content: string, filename: string) => {
    try {
      log('ui', '🔍 Saving to mobile device:', { filename, contentLength: content.length })
      
      // Create a more mobile-friendly download approach
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      // Create a temporary link with mobile-friendly attributes
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      a.setAttribute('download', filename)
      a.setAttribute('target', '_blank')
      
      // Add to DOM temporarily
      document.body.appendChild(a)
      
      // Trigger download with multiple methods for better mobile compatibility
      try {
        a.click()
      } catch (clickError) {
        log('ui', '❌ Click failed, trying dispatchEvent:', clickError)
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
          button: 0
        })
        a.dispatchEvent(clickEvent)
      }
      
      // Clean up
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a)
        }
        URL.revokeObjectURL(url)
      }, 1000)
      
      log('ui', '✅ Mobile download triggered successfully')
      alert(`Chat saved as ${filename}`)
      
    } catch (error) {
      log('ui', '❌ Mobile save error:', error)
      // Fallback to clipboard
      saveToClipboard(content, filename)
    }
  }

  // Clipboard fallback for mobile
  const saveToClipboard = (content: string, filename: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(() => {
        log('ui', '✅ Content copied to clipboard')
        alert(`Chat copied to clipboard! You can paste it into a text editor and save as ${filename}`)
      }).catch((error) => {
        log('ui', '❌ Clipboard error:', error)
        alert('Save failed. Please try again or copy the content manually.')
      })
    } else {
      // Final fallback - show content in a modal
      const modal = document.createElement('div')
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 10000; display: flex; 
        align-items: center; justify-content: center; padding: 20px;
      `
      modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 90%; overflow: auto;">
          <h3>Chat Content (${filename})</h3>
          <p>Please copy this content and save it manually:</p>
          <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 12px;">${content}</textarea>
          <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 10px; padding: 10px 20px;">Close</button>
        </div>
      `
      document.body.appendChild(modal)
    }
  }

  // Web browser save function (fallback)
  const saveToWebBrowser = (content: string, filename: string) => {
    try {
      log('ui', '🔍 Saving to web browser:', { filename })
      
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      
      document.body.appendChild(a)
      a.click()
      
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a)
        }
        URL.revokeObjectURL(url)
      }, 100)
      
      log('ui', '✅ Web download triggered successfully')
    } catch (error) {
      log('ui', '❌ Web save error:', error)
      alert('Save failed. Please try again.')
    }
  }

  const saveChatHistory = (format: 'json' | 'html' | 'markdown' | 'text' = 'json') => {
    log('ui', '🔍 SAVE CHAT HISTORY:', { format, messagesLength: messages.length })
    if (messages.length === 0) {
      log('ui', '❌ No messages to save')
      return
    }
    
    const chatData = {
      bookTitle,
      author,
      selectedText: originalSelectedText,
      contextInfo,
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      })),
      settings: {
        provider: selectedProvider,
        style: currentStyle,
        responseLength: currentResponseLength
      },
      timestamp: new Date().toISOString()
    }
    
    let content: string;
    let extension: string;
    
    switch (format) {
      case 'html':
        content = convertToHTML(chatData);
        extension = 'html';
        break;
      case 'markdown':
        content = convertToMarkdown(chatData);
        extension = 'md';
        break;
      case 'text':
        content = convertToPlainText(chatData);
        extension = 'txt';
        break;
      default:
        content = JSON.stringify(chatData, null, 2);
        extension = 'json';
    }
    
    const filename = `chat-history-${bookTitle.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.${extension}`
    
    // Check if we're in a Capacitor app (mobile native)
    const isCapacitor = (window as any).Capacitor && (window as any).Capacitor.isNativePlatform()
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    log('ui', '🔍 Save context:', { isCapacitor, isMobile, filename })
    
    if (isCapacitor || isMobile) {
      // Use mobile-optimized save for both native apps and mobile browsers
      saveToMobileDevice(content, filename)
    } else {
      // Desktop - use standard web download
      saveToWebBrowser(content, filename)
    }
    
    setSaveFormatDropdownOpen(false)
  }

  const clearChatHistory = () => {
    setMessages([])
    setOriginalSelectedText('')
    setShowFullHistory(false)
    
    // Clear from sessionStorage
    sessionStorage.removeItem('chatHistory')
    
    setShowClearConfirm(false)
    log('Chat history cleared')
  }

  const shareToGitHub = () => {
    if (!messages.length) return

    // Find the last AI response (excluding YouTube video messages)
    const lastAiMessage = [...messages].reverse().find(msg => 
      msg.role === 'assistant' && 
      !msg.content.includes('YouTube video') && 
      !msg.content.includes('🎬 Found related video') &&
      msg.content.length > 50  // Ensure it's a substantial response, not just a short message
    )

    if (!lastAiMessage) {
      alert('No AI response found to share.')
      return
    }

    // Build comprehensive content including the quote and context
    let content = ''
    
    // Find the selected text quote - try multiple sources
    let quoteText = ''
    if (selectedText && selectedText.trim()) {
      quoteText = selectedText.trim()
    } else if (originalSelectedText && originalSelectedText.trim()) {
      quoteText = originalSelectedText.trim()
    } else {
      // Look for the first user message in chat history as fallback
      const firstUserMessage = messages.find(msg => msg.role === 'user')
      if (firstUserMessage && firstUserMessage.content.trim()) {
        quoteText = firstUserMessage.content.trim()
      }
    }
    
    // Start with the selected text quote at the top
    if (quoteText) {
      content += `## Selected Text\n\n> ${quoteText}\n\n`
    }
    
    // Add the AI response
    content += `## AI Response\n\n${lastAiMessage.content}\n\n`
    
    // Add book context if available
    if (bookTitle || author) {
      content += `## Source\n\n`
      if (bookTitle) content += `**Book:** ${bookTitle}\n`
      if (author) content += `**Author:** ${author}\n`
      content += `\n`
    }
    
    // Add context info if available
    if (contextInfo) {
      content += `## Context\n\n`
      if (contextInfo.act) content += `**Act:** ${contextInfo.act}\n`
      if (contextInfo.scene) content += `**Scene:** ${contextInfo.scene}\n`
      if (contextInfo.speaker) content += `**Speaker:** ${contextInfo.speaker}\n`
      if (contextInfo.charactersOnStage && contextInfo.charactersOnStage.length > 0) {
        content += `**Characters on Stage:** ${contextInfo.charactersOnStage.join(', ')}\n`
      }
      content += `\n`
    }
    
    content += `---\n*Shared from The Explainers App*`

    const title = `AI Explanation: ${bookTitle || 'Text Passage'}`
    setShareFormData({ title, content })
    setShowShareModal(true)
  }

  const rateResponse = (messageId: string, rating: 'good' | 'bad') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ))
  }

  const getRatingIcon = (rating: 'good' | 'bad' | null | undefined) => {
    if (rating === 'good') return '👍'
    if (rating === 'bad') return '👎'
    return null
  }

  const getDisplayedMessages = () => {
    if (showFullHistory) {
      return messages
    }
    
    if (messages.length <= 2) {
      return messages
    }
    
    // Find the index of the last user message (most recent quote)
    let lastUserMessageIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i
        break
      }
    }
    
    // Debug logging for chat history issues
    log('chat-history', '🔍 getDisplayedMessages debug:', {
      totalMessages: messages.length,
      lastUserMessageIndex,
      showFullHistory
    })
    
    // If we found a user message, show only the last complete exchange
    // (the last user message and the assistant response that follows it)
    if (lastUserMessageIndex >= 0) {
      // Find the last assistant message after the last user message
      let lastAssistantMessageIndex = -1
      for (let i = lastUserMessageIndex + 1; i < messages.length; i++) {
        if (messages[i].role === 'assistant') {
          lastAssistantMessageIndex = i
        }
      }
      
      // Debug logging - disabled for cleaner console
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('🔍 getDisplayedMessages exchange debug:', {
      //     lastUserMessageIndex,
      //     lastAssistantMessageIndex,
      //     sliceFrom: lastUserMessageIndex,
      //     sliceTo: lastAssistantMessageIndex + 1
      //   })
      // }
      
      // If we found an assistant message after the user message, show the complete exchange
      if (lastAssistantMessageIndex >= 0) {
        const result = messages.slice(lastUserMessageIndex, lastAssistantMessageIndex + 1)
        // Debug logging - disabled for cleaner console
        // if (process.env.NODE_ENV === 'development') {
        //   console.log('🔍 getDisplayedMessages result:', result.map((msg, i) => ({ index: i, role: msg.role, content: msg.content.substring(0, 30) + '...' })))
        // }
        return result
      } else {
        // If no assistant message found after user message, just show the user message
        const result = messages.slice(lastUserMessageIndex, lastUserMessageIndex + 1)
        // Debug logging - disabled for cleaner console
        // if (process.env.NODE_ENV === 'development') {
        //   console.log('🔍 getDisplayedMessages result (no assistant):', result.map((msg, i) => ({ index: i, role: msg.role, content: msg.content.substring(0, 30) + '...' })))
        // }
        return result
      }
    }
    
    // Fallback to showing all messages if no user message found
    return messages
  }

  const getHiddenMessageCount = () => {
    if (messages.length <= 2) {
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
    
    // Debug logging for chat history issues
    const userMessages = messages.filter(m => m.role === 'user')
    log('chat-history', '🔍 USER MESSAGE DEBUG:', {
      totalMessages: messages.length,
      userMessageCount: userMessages.length,
      lastUserMessageIndex,
      userIndices: messages.map((msg, i) => msg.role === 'user' ? i : -1).filter(i => i !== -1)
    })
    
    // If we found a user message, calculate how many messages are hidden before the last exchange
    if (lastUserMessageIndex >= 0) {
      // Find the last assistant message after the last user message
      let lastAssistantMessageIndex = -1
      for (let i = lastUserMessageIndex + 1; i < messages.length; i++) {
        if (messages[i].role === 'assistant') {
          lastAssistantMessageIndex = i
        }
      }
      
      // Calculate how many messages are hidden
      if (lastAssistantMessageIndex >= 0) {
        // Complete exchange found
        // Hide all messages before the last user message
        return lastUserMessageIndex
      } else {
        // No assistant message after user message: show only the user message
        return lastUserMessageIndex
      }
    }
    
    // Fallback: no messages are hidden
    return 0
  }

  // Track the previous message count to only scroll when new messages are added
  const prevMessageCountRef = useRef(0)
  
  useEffect(() => {
    const currentMessageCount = messages.length
    const prevMessageCount = prevMessageCountRef.current
    
    // Only scroll if we have messages AND the count increased (new message added)
    if (currentMessageCount > 0 && currentMessageCount > prevMessageCount && messages[messages.length - 1].role === 'assistant') {
      // Only scroll when a new assistant message is added
      log('ui', 'Chat: New assistant message detected, scrolling to bottom')
      setTimeout(() => scrollToLatestResponse(), 100)
    } else if (currentMessageCount > 0 && currentMessageCount === prevMessageCount) {
      log('ui', 'Chat: Message count unchanged, not scrolling (prev:', prevMessageCount, 'current:', currentMessageCount, ')')
    }
    
    // Update the previous count
    prevMessageCountRef.current = currentMessageCount
  }, [messages])

  // Load chat history from sessionStorage
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('chatHistory')
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
      } catch (error) {
        log('ui','Error loading chat history:', error)
      }
    }
  }, [])

  // Save chat history to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      log('chat-history', '💾 Saving to sessionStorage:', messages.length, 'messages')
      log('chat-history', '💾 User messages in array:', messages.filter(m => m.role === 'user').length)
      log('chat-history', '💾 Messages array:', messages.map(m => ({ role: m.role, content: m.content.substring(0, 20) + '...' })))
      sessionStorage.setItem('chatHistory', JSON.stringify(messages))
    }
  }, [messages])

  // Close save dropdown on outside click or Escape
  useEffect(() => {
    if (!saveFormatDropdownOpen) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!saveDropdownRef.current) return
      const target = event.target as Node
      if (!saveDropdownRef.current.contains(target)) {
        setSaveFormatDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSaveFormatDropdownOpen(false)
      }
    }

    // Delay binding to avoid closing from the same click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [saveFormatDropdownOpen])

  useEffect(() => {
    if (selectedText && !initializedRef.current) {
      setOriginalSelectedText(selectedText)
      initializedRef.current = true
      
      // Determine if we should auto-explain
      let shouldAutoExplain = false
      
      if (!isPageMode) {
        // Modal mode - always auto-explain
        shouldAutoExplain = true
      } else {
        // Page mode - check for stored context (user clicked "explain" button)
        const storedContext = sessionStorage.getItem('chatContext')
        if (storedContext) {
          try {
            const parsedContext = JSON.parse(storedContext)
            if (parsedContext.selectedText === selectedText) {
              shouldAutoExplain = true
              // Clear the context data so it's not used again
              sessionStorage.removeItem('chatContext')
            }
          } catch (error) {
            log('ui','Error parsing chat context:', error)
          }
        }
        // If no context data, just show the quote (user clicked "chat" in hamburger)
      }
      
      // Single call to handleExplainText
      if (shouldAutoExplain) {
        handleExplainText(selectedText)
      }
    }
  }, [selectedText, isPageMode])


  // Set original selected text when it becomes available
  useEffect(() => {
    log('ChatInterface: selectedText changed:', selectedText)
    log('ChatInterface: current originalSelectedText:', originalSelectedText)
    
    if (selectedText) {
      // Always update originalSelectedText when selectedText changes
      if (selectedText !== originalSelectedText) {
        log('ChatInterface: Updating originalSelectedText from selectedText:', selectedText)
        setOriginalSelectedText(selectedText)
      }
    }
  }, [selectedText, originalSelectedText])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Update current time every minute for countdown display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const hasProviderChange = selectedProvider !== settings.llmProvider
    const hasStyleChange = currentStyle !== settings.explanationStyle
    const hasLengthChange = currentResponseLength !== settings.responseLength
    const newHasChanges = hasProviderChange || hasStyleChange || hasLengthChange
    log('hasChanges calculation:', { hasProviderChange, hasStyleChange, hasLengthChange, newHasChanges, selectedProvider, currentStyle, currentResponseLength, settingsProvider: settings.llmProvider, settingsStyle: settings.explanationStyle, settingsLength: settings.responseLength })
    // Only set to true automatically; do not clear a user-triggered change
    if (newHasChanges) setHasChanges(true)
  }, [selectedProvider, currentStyle, currentResponseLength, settings.llmProvider, settings.explanationStyle, settings.responseLength])

  // Initialize provider from settings only on first mount
  useEffect(() => {
    if (!initializedRef.current) {
      setSelectedProvider(settings.llmProvider)
    }
  }, [settings.llmProvider])

  useEffect(() => {
    if (!initializedRef.current) {
      setCurrentStyle(settings.explanationStyle)
    }
  }, [settings.explanationStyle])

  // Mark initialized after first render pass
  useEffect(() => {
    if (!initializedRef.current) {
      setCurrentResponseLength(settings.responseLength)
      initializedRef.current = true
    }
  }, [])

  // Only update from settings on initial load, not on every settings change
  useEffect(() => {
    if (!initializedRef.current) {
      log('ChatInterface: Initializing responseLength from settings:', settings.responseLength)
      setCurrentResponseLength(settings.responseLength)
    }
  }, [settings.responseLength])

  // Close custom style menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target as Node)) {
        setShowStyleMenu(false)
      }
    }
    if (showStyleMenu) {
      document.addEventListener('mousedown', handleClickOutside as EventListener)
      document.addEventListener('touchstart', handleClickOutside as EventListener, { passive: true })
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener)
      document.removeEventListener('touchstart', handleClickOutside as EventListener)
    }
  }, [showStyleMenu])

  // Close custom provider menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (providerMenuRef.current && !providerMenuRef.current.contains(event.target as Node)) {
        setShowProviderMenu(false)
      }
    }
    if (showProviderMenu) {
      document.addEventListener('mousedown', handleClickOutside as EventListener)
      document.addEventListener('touchstart', handleClickOutside as EventListener, { passive: true })
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener)
      document.removeEventListener('touchstart', handleClickOutside as EventListener)
    }
  }, [showProviderMenu])

  // Don't auto-save immediately - let user see changes and use re-explain button
  // Settings will be saved when re-explain is used or when component unmounts

  // Resolve model for a given provider using settings
  const resolveModelFor = (provider: LLMProvider, settingsModel?: LLMModel): string | undefined => {
    if (settingsModel) {
      if (provider === 'gemini' && settingsModel.startsWith('gemini-')) return settingsModel
      if (provider === 'openai' && settingsModel.startsWith('gpt-')) return settingsModel
      if (provider === 'deepseek' && settingsModel.startsWith('deepseek-')) return settingsModel
      if (provider === 'anthropic' && settingsModel.startsWith('claude-')) return settingsModel
    }
    return (models as any).defaults[provider] || undefined
  }

  // Print current provider + model whenever selection changes
  useEffect(() => {
    const model = resolveModelFor(selectedProvider, settings.llmModel)
    log('ui', 'Chat selection:', { provider: selectedProvider, model })
  }, [selectedProvider, settings.llmModel])


  const callLLM = async (messages: Message[]): Promise<string> => {
    // Choose an appropriate model based on provider and current settings
    const chooseModelForProvider = (provider: LLMProvider, settingsModel?: LLMModel): string | undefined => {
      // Use current settings model if it matches the provider, else use default
      if (settingsModel) {
        if (provider === 'gemini' && settingsModel.startsWith('gemini-')) return settingsModel
        if (provider === 'openai' && settingsModel.startsWith('gpt-')) return settingsModel
        if (provider === 'deepseek' && settingsModel.startsWith('deepseek-')) return settingsModel
        if (provider === 'anthropic' && settingsModel.startsWith('claude-')) return settingsModel
      }
      return (models as any).defaults[provider] || undefined
    }

    const selectedModel = chooseModelForProvider ? chooseModelForProvider(selectedProvider, settings.llmModel) : resolveModelFor(selectedProvider, settings.llmModel)
    log('ui', 'ChatInterface: Selected model for API call:', { provider: selectedProvider, model: selectedModel, settingsModel: settings.llmModel })
    // Debug logging disabled
    const requestBody = {
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      provider: selectedProvider,
      model: selectedModel,
      responseLength: currentResponseLength,
      style: currentStyle,
      selectedText: selectedText,
      userId: getDeviceId()
    }

    const apiCallInfo = {
      url: `${API_BASE_URL}/api/chat`,
      method: 'POST',
      body: requestBody,
      timestamp: new Date().toISOString()
    }

    // console.log('📤 Sending chat request:', apiCallInfo)
    

    // Debug logging disabled - uncomment for troubleshooting
    // console.log('🔍 About to make fetch request to:', `${API_BASE_URL}/api/chat`)
    // console.log('🔍 Request body:', JSON.stringify(requestBody, null, 2))
    
    let response
    try {
      response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      // Debug logging disabled
    } catch (fetchError) {
      // Debug logging disabled
      throw fetchError
    }

    const responseInfo = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      timestamp: new Date().toISOString()
    }

    // console.log('📥 Chat response:', responseInfo)
    

    if (!response.ok) {
      const errorText = await response.text()
      // Debug logging disabled
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // console.log('✅ Chat API success:', data)
    
    return data.message
  }



  // Convert Roman numerals to Arabic numerals
  const romanToArabic = (roman: string): string => {
    const romanMap: { [key: string]: number } = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
      'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15,
      'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20
    }
    return romanMap[roman.toUpperCase()]?.toString() || roman
  }

  const createContextualPrompt = (text: string, context: ContextInfo | null): string => {
    log('ChatInterface: Profile data:', profile)
    
    // Check if this is Shakespeare content (has act/scene or author/book title indicates Shakespeare)
    const isShakespeare = context?.act && context?.scene || 
                         author?.toLowerCase().includes('shakespeare') || 
                         bookTitle?.toLowerCase().includes('shakespeare')
    
    // Use complete speech only for Shakespeare plays, otherwise use the selected text
    const completeSpeech = (context as any)?.completeSpeech
    const hasCompleteSpeech = isShakespeare && completeSpeech && completeSpeech !== text
    
    let prompt
    if (hasCompleteSpeech) {
      // Find the selected text within the complete speech and highlight it
      const selectedStart = completeSpeech.indexOf(text)
      if (selectedStart !== -1) {
        const beforeSelected = completeSpeech.substring(0, selectedStart)
        const afterSelected = completeSpeech.substring(selectedStart + text.length)
        prompt = `Please explain this text from ${context?.speaker}:\n\n"${beforeSelected}[SELECTED: ${text}]${afterSelected}"`
      } else {
        // Fallback if selected text not found in complete speech
        prompt = `Please explain this text: "${text}"\n\nFull speech from ${context?.speaker}: "${completeSpeech}"`
      }
    } else {
      prompt = `Please explain this text: "${text}"`
    }
    
    if (context) {
      prompt += `\n\nContext Information:`
      prompt += `\nBook: ${context.bookTitle} by ${context.author}`
      
      if (context.act) prompt += `\nAct: ${context.act}`
      if (context.scene) prompt += `\nScene: ${context.scene}`
      if (context.speaker) prompt += `\nSpeaker: ${context.speaker}`
      if (context.charactersOnStage.length > 0) {
        prompt += `\nCharacters on stage: ${context.charactersOnStage.join(', ')}`
      }
    }

    // Add user profile information
    log('ChatInterface: Profile language check:', profile.language, profile.language !== 'english')
    if (profile.age || profile.language !== 'english' || profile.educationLevel) {
      prompt += `\n\nUser Profile:`
      if (profile.age) prompt += `\nAge: ${profile.age}`
      if (profile.language !== 'english') {
        log('ChatInterface: Adding language instruction:', profile.language)
        prompt += `\nPreferred Language: Please respond in ${profile.language}`
      }
      prompt += `\nEducation Level: ${profile.educationLevel}`
    }
    
    // Add style persona if not neutral
    const stylePersona = getStylePersona(currentStyle)
    if (stylePersona) {
      prompt += `\n\nStyle Instructions:\n${stylePersona}`
    }

    prompt += `\n\nInstructions:`
    
    // Add length-specific instructions
    if (currentResponseLength === 'brief') {
      prompt += `\n- KEEP IT VERY SHORT: Maximum 2-3 sentences. One screen of text only.`
      prompt += `\n- Be concise and direct. Focus on the most essential point only.`
    } else if (currentResponseLength === 'medium') {
      prompt += `\n- Keep response moderate length: 1-2 short paragraphs maximum.`
    } else {
      prompt += `\n- Provide a detailed explanation with full context and analysis.`
    }
    
    prompt += `\n- Focus primarily on explaining unfamiliar terms, phrases, and words used in unfamiliar ways within the selected text`
    prompt += `\n- Pay special attention to archaic language, idioms, metaphors, and expressions that need explanation`
    prompt += `\n- Explain why the character is saying this and what is happening at this moment`
    prompt += `\n- Explain references that contemporary audiences would understand`
    if (profile.language !== 'english') {
      prompt += `\n- Respond in ${profile.language}`
    }
    if (profile.age) {
      prompt += `\n- Use age-appropriate vocabulary for a ${profile.age}-year-old`
    }
    prompt += `\n- Use vocabulary appropriate for ${profile.educationLevel} level`
    prompt += `\n- Use clear, accessible language in your explanation`
    prompt += `\n- Format your response as a flowing narrative, not as answers to specific questions`
    prompt += `\n- Don't be cute, peppy, enthusiastic, or excited unless the user is a child. Witty dry sarcasm is fine though`
    prompt += `\n- Avoid throat-clearing phrases like "listen up!" or "be glad to help you"`
    
    // Check prompt size and truncate if too large to prevent expensive API calls
    const MAX_PROMPT_LENGTH = 8000 // Reasonable limit for most LLMs
    if (prompt.length > MAX_PROMPT_LENGTH) {
      log('debug', '🔍 PROMPT TOO LARGE:', prompt.length, 'characters, truncating to', MAX_PROMPT_LENGTH)
      
      // Try to truncate at a reasonable point (end of context info)
      const contextEndIndex = prompt.indexOf('\n- Focus primarily on explaining')
      if (contextEndIndex > 0 && contextEndIndex < MAX_PROMPT_LENGTH) {
        prompt = prompt.substring(0, contextEndIndex) + '\n\n[Note: Prompt truncated due to length]'
      } else {
        // Fallback: truncate at max length
        prompt = prompt.substring(0, MAX_PROMPT_LENGTH) + '\n\n[Note: Prompt truncated due to length]'
      }
    }
    
    return prompt
  }

  const searchAndEmbedVideo = async (text: string) => {
    log('youtube', 'Automatically searching for video with quote:', text)
    log('youtube', 'Using context info:', contextInfo)
    
    try {
      // Build a richer search query using context information
      let searchTerms = [`"${text}"`] // Start with the exact quote
      
      // Add book and author
      if (bookTitle) searchTerms.push(bookTitle)
      if (author) searchTerms.push(author)
      
      // Add speaker information if available
      if (contextInfo?.speaker) {
        searchTerms.push(contextInfo.speaker)
      }
      
      // Add act/scene information for plays with both Roman and Arabic numerals
      if (contextInfo?.act && contextInfo?.scene) {
        // Convert Roman numerals to Arabic for better YouTube matching
        const actArabic = romanToArabic(contextInfo.act)
        const sceneArabic = romanToArabic(contextInfo.scene)
        
        // Add both Roman and Arabic versions
        searchTerms.push(`Act ${contextInfo.act}`)
        searchTerms.push(`Act ${actArabic}`)
        searchTerms.push(`Scene ${contextInfo.scene}`)
        searchTerms.push(`Scene ${sceneArabic}`)
        
        // Add specific combinations that YouTube will understand
        searchTerms.push(`Act ${actArabic} Scene ${sceneArabic}`)
        searchTerms.push(`Act ${contextInfo.act} Scene ${contextInfo.scene}`)
      }
      
      // Add performance/scene keywords
      searchTerms.push('performance', 'scene')
      
      // Create a more targeted search query
      if (contextInfo?.act && contextInfo?.scene) {
        const actArabic = romanToArabic(contextInfo.act)
        const sceneArabic = romanToArabic(contextInfo.scene)
        
        // Create a specific search phrase that YouTube will understand better
        const specificQuery = `"${text}" ${bookTitle} "Act ${actArabic} Scene ${sceneArabic}" performance`
        
        // Use the specific query instead of the complex search terms
        searchTerms = [specificQuery]
      }
      
      const searchQuery = searchTerms.join(' ').trim()
      
      log('youtube', 'Enhanced YouTube search query:', searchQuery)
      log('youtube', 'Query construction details:', {
        originalText: text,
        bookTitle,
        author,
        contextInfo: {
          act: contextInfo?.act,
          scene: contextInfo?.scene,
          speaker: contextInfo?.speaker
        },
        searchTerms,
        finalQuery: searchQuery
      })
      
      const response = await fetch(`${API_BASE_URL}/api/youtube-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery,
          bookTitle,
          author 
        })
      })
      
      if (!response.ok) {
        log('YouTube search failed, skipping video')
        return // Silently fail - no video embedded
      }
      
      const data = await response.json()
      
      log('youtube', 'Auto YouTube search results:', data)
      log('youtube', 'Found videos:', data.videos?.map((v: any) => ({ title: v.title, id: v.id })))
      
      if (data.videos && data.videos.length > 0) {
        // Add video message to chat automatically
        const videoMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `🎬 Found related video`,
          role: 'assistant',
          timestamp: new Date(),
          provider: 'youtube',
          style: 'neutral',
          videoId: data.videos[0].id,
          videoTitle: data.videos[0].title
        }
        setMessages(prev => [...prev, videoMessage])
      }
      // If no videos found, do nothing (no error message)
      
    } catch (error) {
      log('ui','Auto video search error (ignored):', error)
      // Silently ignore errors - don't interrupt the user experience
    }
  }

  // Build external Playphrase link for the currently selected/original quote
  const playphraseUrl = (() => {
    if (!originalSelectedText) return null
    // Normalize: trim, collapse whitespace, strip surrounding quotes/newlines
    const normalized = originalSelectedText
      .replace(/\s+/g, ' ')
      .replace(/^\s*["]|[\"]\s*$/g, '')
      .trim()
    const encoded = encodeURIComponent(normalized)
    return `https://www.playphrase.me/#/search?q=${encoded}&pos=0&language=en`
  })()


  const handleReExplain = async (text: string) => {
    const useCustomLLM = selectedProvider === 'custom'
    
    log('ChatInterface: handleReExplain called')
    log('ChatInterface: current profile state:', profile)
    
    // Fallback: if no text provided, try to get it from the first user message
    if (!text && messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        text = firstUserMessage.content.replace(/^"|"$/g, '') // Remove quotes
        log('ChatInterface: Using fallback text from first user message:', text)
      }
    }
    
    if (!text) {
      log('ChatInterface: No text available for re-explain')
      return
    }
    
    // Check if user can use explanation
    if (!canUseExplanation(bookTitle, author, useCustomLLM)) {
      // Check if user is authenticated to determine redirect destination
      const isLocalDev = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
      
      if (!user?.userAgent && !isLocalDev) {
        log('ChatInterface: canUseExplanation returned false - not authenticated, redirecting to sign-in')
        // Preserve the chat context when redirecting to sign-in
        if (selectedText && contextInfo) {
          const contextToStore = {
            selectedText,
            contextInfo,
            bookTitle,
            author
          }
          sessionStorage.setItem('chatContext', JSON.stringify(contextToStore))
          log('ChatInterface: Stored chatContext before redirecting to sign-in:', contextToStore)
        }
        router.push('/auth/signin')
      } else {
        log('ChatInterface: canUseExplanation returned false - authenticated but no credits, redirecting to credits')
        router.push('/credits')
      }
      return
    }
    
    log('ChatInterface: canUseExplanation returned true, proceeding with re-explanation')

    const promptText = createContextualPrompt(text, contextInfo)
    
    // CURSOR HELPER: Log the full prompt being sent to the LLM for re-explain
    log('🔄 RE-EXPLAIN PROMPT SENT TO LLM 🔄')
    log('='.repeat(80))
    log('chat', promptText)
    log('='.repeat(80))
    log('Context info:', contextInfo)
    
    log('Re-explain prompt sent to LLM:')
    log('Profile language in re-explain:', profile.language)
    log('Prompt text:', promptText)
    log('Context info:', contextInfo)

    // For re-explain, we don't add a user message, just get a new assistant response
    const llmMessage: Message = {
      id: 'llm-prompt-reexplain',
      role: 'user',
      content: promptText,
      timestamp: new Date()
    }

    setIsLoading(true)
    
    // Scroll to show the "AI is thinking..." message
    setTimeout(() => scrollToLatestResponse(), 100)

    try {
      // Use the explanation (deduct credits if needed)
      const success = useExplanation(bookTitle, author, useCustomLLM)
      if (!success) {
        router.push('/credits')
        setIsLoading(false)
        return
      }

      const response = await callLLM([llmMessage])
      const usedModel = resolveModelFor(selectedProvider, settings.llmModel)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle,
        model: usedModel
      }
      setMessages(prev => [...prev, assistantMessage])
      
      // Also automatically search for video after re-explain (but only if there's no video already for this quote)
      setTimeout(() => {
        const hasVideoForThisQuote = messages.some(msg => msg.videoId && msg.provider === 'youtube')
        if (!hasVideoForThisQuote) {
          searchAndEmbedVideo(text)
        }
      }, 500)
      
    } catch (error) {
      log('ui','Error calling LLM:', error)
      console.error('Mobile LLM Error (re-explain):', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error while trying to re-explain this text. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`,
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle,
        model: resolveModelFor(selectedProvider, settings.llmModel)
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      
      // Save settings after successful re-explain
      if (hasChanges) {
        const updatedSettings: SettingsData = {
          ...settings,
          llmProvider: selectedProvider,
          explanationStyle: currentStyle,
          responseLength: currentResponseLength
        }
        onSettingsChange(updatedSettings)
        setHasChanges(false)
      }
    }
  }

  const processingRef = useRef<string | null>(null)

  const handleExplainText = async (text: string) => {
    const useCustomLLM = selectedProvider === 'custom'
    
    // Prevent duplicate calls with the same text using a ref
    if (processingRef.current === text) {
      log('chat-history', '🚫 Duplicate call prevented for:', text)
      return
    }
    
    // Also prevent if we're already processing any text
    if (processingRef.current !== null) {
      log('chat-history', '🚫 Already processing text:', processingRef.current, 'blocking:', text)
      return
    }
    
    processingRef.current = text
    log('chat-history', '🚀 handleExplainText proceeding with:', text, 'ref set to:', processingRef.current)
    
    // Check if user can use explanation
    if (!canUseExplanation(bookTitle, author, useCustomLLM)) {
      // Check if user is authenticated to determine redirect destination
      const isLocalDev = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
      
      if (!user?.userAgent && !isLocalDev) {
        log('ChatInterface: canUseExplanation returned false - not authenticated, redirecting to sign-in')
        // Preserve the chat context when redirecting to sign-in
        if (selectedText && contextInfo) {
          const contextToStore = {
            selectedText,
            contextInfo,
            bookTitle,
            author
          }
          sessionStorage.setItem('chatContext', JSON.stringify(contextToStore))
          log('ChatInterface: Stored chatContext before redirecting to sign-in:', contextToStore)
        }
        router.push('/auth/signin')
      } else {
        log('ChatInterface: canUseExplanation returned false - authenticated but no credits, redirecting to credits')
        router.push('/credits')
      }
      return
    }
    
    log('ChatInterface: canUseExplanation returned true, proceeding with explanation')

    const promptText = createContextualPrompt(text, contextInfo)
    
    // Log the full prompt being sent to the LLM
    log('prompt', '🚀 FULL PROMPT SENT TO LLM 🚀')
    log('prompt', '='.repeat(80))
    log('prompt', promptText)
    log('prompt', '='.repeat(80))
    log('prompt', 'Context info:', contextInfo)
    
    // Display only the selected text to the user, not the full prompt
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `"${text}"`,
      role: 'user',
      timestamp: new Date()
    }

    // But send the full contextual prompt to the LLM
    const llmMessage: Message = {
      id: 'llm-prompt',
      role: 'user',
      content: promptText,
      timestamp: new Date()
    }

       // Force immediate state update to prevent batching issues
       flushSync(() => {
         setMessages(prev => [...prev, userMessage])
       })
    setIsLoading(true)

    try {
      // Use the explanation (deduct credits if needed)
      const success = useExplanation(bookTitle, author, useCustomLLM)
      if (!success) {
        router.push('/credits')
        setIsLoading(false)
        return
      }

      // First, search for YouTube video and add it if found
      await searchAndEmbedVideo(text)
      
      // Then get the AI explanation
      const response = await callLLM([llmMessage])
      const usedModel = resolveModelFor(selectedProvider, settings.llmModel)
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle,
        model: usedModel
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      log('ui','Error calling LLM:', error)
      console.error('Mobile LLM Error (explain):', error)
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        content: `Sorry, I encountered an error while trying to explain this text. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`,
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle,
        model: resolveModelFor(selectedProvider, settings.llmModel)
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      if (hasChanges) setHasChanges(false)
      processingRef.current = null
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await callLLM(newMessages)
      const usedModel = resolveModelFor(selectedProvider, settings.llmModel)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle,
        model: usedModel
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      log('ui','Error calling LLM:', error)
      console.error('Mobile LLM Error (message):', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error while processing your message. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`,
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle,
        model: resolveModelFor(selectedProvider, settings.llmModel)
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      if (hasChanges) setHasChanges(false)
      processingRef.current = null
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getHelpPopupTitle = () => {
    switch (showHelpPopup) {
      case 'ai-model':
        return 'AI Provider'
      case 'style':
        return 'Explanation Style'
      case 'length':
        return 'Response Length'
      default:
        return 'Help'
    }
  }

  const getHelpPopupContent = () => {
    switch (showHelpPopup) {
      case 'ai-model':
        return (
          <div>
            <p><strong>Claude 3.5 Sonnet:</strong> Excellent for literature, poetry, and nuanced text analysis. Often provides the most thoughtful and context-aware explanations.</p>
            <p><strong>GPT-4 (OpenAI):</strong> Great for technical texts, academic writing, and comprehensive analysis. Very strong at breaking down complex concepts.</p>
            <p><strong>DeepSeek Chat:</strong> Creative and engaging explanations, good for making difficult texts accessible and interesting.</p>
            <p><strong>{getProviderLabel('gemini', settings.llmModel)}:</strong> Fast responses, good for quick explanations and straightforward text interpretation.</p>
          </div>
        )
      case 'style':
        return (
          <div>
            <p><strong>Neutral:</strong> Clear, academic explanations without personality.</p>
            <p><strong>William Shakespeare:</strong> The Bard himself explains his plays with dramatic context and performance insights.</p>
            <p><strong>Stephen King:</strong> Lean, vivid explanations with suspenseful storytelling.</p>
            <p><strong>David Foster Wallace:</strong> Hyper-detailed, verbose analysis with deep intellectual exploration.</p>
            <p><strong>Oscar Wilde:</strong> Witty, paradoxical explanations with clever wordplay.</p>
            <p><strong>Carl Sagan:</strong> Cosmic wonder and curiosity in explaining any text.</p>
            <p>And many more! Choose from critics, writers, comedians, and talk show hosts - each offers a unique approach to understanding difficult texts.</p>
          </div>
        )
      case 'length':
        return (
          <div>
            <p><strong>Brief:</strong> 2-3 sentences maximum. Perfect for quick understanding when you just need the key point.</p>
            <p><strong>Medium:</strong> 1-2 paragraphs. Balanced explanation with context but not overwhelming.</p>
            <p><strong>Long:</strong> Comprehensive analysis with full context, historical background, and detailed interpretation.</p>
          </div>
        )
      default:
        return <p>Help information not available.</p>
    }
  }

  const shareSpecificResponse = (message: Message) => {
    // Check if this is a substantial AI response (not a YouTube video message)
    if (message.content.includes('🎬 Found related video') || message.content.length < 50) {
      alert('This message cannot be shared. Please select a substantial AI response.')
      return
    }

    // Find the user message that preceded this AI response
    const messageIndex = messages.findIndex(msg => msg.id === message.id)
    let quoteText = ''
    
    // Look for the user message before this AI response
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        quoteText = messages[i].content.trim()
        break
      }
    }
    
    // If no user message found, try to get from selectedText or originalSelectedText
    if (!quoteText) {
      if (selectedText && selectedText.trim()) {
        quoteText = selectedText.trim()
      } else if (originalSelectedText && originalSelectedText.trim()) {
        quoteText = originalSelectedText.trim()
      }
    }

    // Build content for this specific response
    let content = ''
    
    // Start with the selected text quote if available
    if (quoteText) {
      content += `## Selected Text\n\n> ${quoteText}\n\n`
    }
    
    // Add the specific AI response
    content += `## AI Response\n\n${message.content}\n\n`
    
    // Add style information if available
    if (message.style && message.style !== 'neutral') {
      const styleName = getAllStyles().find(s => s.value === message.style)?.name || message.style
      content += `## Style\n\n**Explanation Style:** ${styleName}\n\n`
    }
    
    // Add book context if available
    if (bookTitle || author) {
      content += `## Source\n\n`
      if (bookTitle) content += `**Book:** ${bookTitle}\n`
      if (author) content += `**Author:** ${author}\n`
      content += `\n`
    }
    
    // Add context info if available
    if (contextInfo) {
      content += `## Context\n\n`
      if (contextInfo.act) content += `**Act:** ${contextInfo.act}\n`
      if (contextInfo.scene) content += `**Scene:** ${contextInfo.scene}\n`
      if (contextInfo.speaker) content += `**Speaker:** ${contextInfo.speaker}\n`
      if (contextInfo.charactersOnStage && contextInfo.charactersOnStage.length > 0) {
        content += `**Characters on Stage:** ${contextInfo.charactersOnStage.join(', ')}\n`
      }
      content += `\n`
    }
    
    content += `---\n*Shared from The Explainers App*`

    // Create title with style if available
    let title = `AI Explanation: ${bookTitle || 'Text Passage'}`
    if (message.style && message.style !== 'neutral') {
      const styleName = getAllStyles().find(s => s.value === message.style)?.name || message.style
      title += ` (${styleName} style)`
    }
    
    setShareFormData({ title, content })
    setShowShareModal(true)
  }

  const shareToReddit = (message: Message) => {
    // Build content similar to GitHub but formatted for Reddit
    const messageIndex = messages.findIndex(msg => msg.id === message.id)
    let quoteText = ''
    
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        quoteText = messages[i].content.trim()
        break
      }
    }
    
    if (!quoteText && selectedText) {
      quoteText = selectedText.trim()
    }

    let content = `**AI Response:**\n\n${message.content}\n\n`
    
    // Add style information if available
    if (message.style && message.style !== 'neutral') {
      const styleName = getAllStyles().find(s => s.value === message.style)?.name || message.style
      content += `**Style:** ${styleName}\n\n`
    }
    
    if (quoteText) {
      content += `**Selected Text:**\n\n> ${quoteText}\n\n`
    }
    
    if (bookTitle) {
      content += `**Source:** ${bookTitle}${author ? ` by ${author}` : ''}\n\n`
    }
    
    content += `*Shared from The Explainers App*`

    const title = `AI Explanation: ${bookTitle || 'Text Passage'}`
    const encodedTitle = encodeURIComponent(title)
    const redditUrl = `https://reddit.com/r/TheExplainersApp/submit?title=${encodedTitle}`
    
    navigator.clipboard.writeText(content).then(() => {
      alert('✅ Content copied to clipboard!\n\nReddit will open in a new tab. Paste the content (Ctrl+V/Cmd+V) into the text area.')
      window.open(redditUrl, '_blank')
    }).catch(() => {
      alert('⚠️ Clipboard access failed. Please manually copy the content.')
      window.open(redditUrl, '_blank')
    })
  }

  const shareToDiscord = (message: Message) => {
    // Build content for Discord (simpler format)
    const messageIndex = messages.findIndex(msg => msg.id === message.id)
    let quoteText = ''
    
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        quoteText = messages[i].content.trim()
        break
      }
    }
    
    if (!quoteText && selectedText) {
      quoteText = selectedText.trim()
    }

    let content = `**AI Explanation${bookTitle ? ` - ${bookTitle}` : ''}**\n\n`
    
    // Add style information if available
    if (message.style && message.style !== 'neutral') {
      const styleName = getAllStyles().find(s => s.value === message.style)?.name || message.style
      content += `**Style:** ${styleName}\n\n`
    }
    
    if (quoteText) {
      content += `> ${quoteText}\n\n`
    }
    
    content += `${message.content}\n\n`
    content += `*Shared from The Explainers App*`

    navigator.clipboard.writeText(content).then(() => {
      alert('✅ Content copied to clipboard!\n\nYou can now paste this into Discord, Slack, or any other platform.')
    }).catch(() => {
      alert('⚠️ Clipboard access failed. Please manually select and copy the content.')
    })
  }

  const copyToClipboard = (message: Message) => {
    // Simple copy - just the AI response with minimal formatting
    const messageIndex = messages.findIndex(msg => msg.id === message.id)
    let quoteText = ''
    
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        quoteText = messages[i].content.trim()
        break
      }
    }

    let content = ''
    
    if (quoteText) {
      content += `Selected Text: "${quoteText}"\n\n`
    }
    
    content += `AI Response: ${message.content}`
    
    // Add style information if available
    if (message.style && message.style !== 'neutral') {
      const styleName = getAllStyles().find(s => s.value === message.style)?.name || message.style
      content += `\n\nStyle: ${styleName}`
    }
    
    if (bookTitle) {
      content += `\n\nSource: ${bookTitle}${author ? ` by ${author}` : ''}`
    }

    navigator.clipboard.writeText(content).then(() => {
      alert('✅ Content copied to clipboard!')
    }).catch(() => {
      alert('⚠️ Clipboard access failed.')
    })
  }

  return (
    <div className={isPageMode ? '' : styles.chatOverlay}>
      <div className={isPageMode ? '' : styles.chatContainer} style={isPageMode ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
        <div className={styles.chatHeader}>
          <div className={styles.headerTitle}>
            <div style={{ fontSize: '13px', color: '#8b5cf6', marginTop: '4px', fontWeight: '500' }}>
              {(() => {
                const useCustomLLM = selectedProvider === 'custom'
                const bookExplanationsUsed = getBookExplanationsUsed(bookTitle, author)
                const bookKey = `${bookTitle}-${author}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                const isBookPurchased = profile.purchasedBooks?.includes(bookKey)
                const hasUnlimited = profile.hasUnlimitedAccess && profile.unlimitedAccessExpiry && new Date() < new Date(profile.unlimitedAccessExpiry)
                
                if (useCustomLLM) return 'Free with your own LLM'
                if (hasUnlimited) {
                  const expiry = new Date(profile.unlimitedAccessExpiry!)
                  const msRemaining = expiry.getTime() - currentTime.getTime()
                  const minutesRemaining = Math.ceil(msRemaining / (1000 * 60))
                  
                  if (minutesRemaining > 60) {
                    const hoursRemaining = Math.ceil(minutesRemaining / 60)
                    return `Unlimited access: ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} left`
                  } else {
                    return `Unlimited access: ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} left`
                  }
                }
                if (isBookPurchased) return 'Book purchased - unlimited explanations'
                if (bookExplanationsUsed < 3) return `${3 - bookExplanationsUsed} free explanations left for this book`
                return `${profile.availableCredits || 0} credits remaining`
              })()}
            </div>
          </div>
          <div className={styles.headerControls}>
            
            {/* Dropdowns Row */}
            <div className={styles.dropdownsRow}>
              <div className={styles.providerSelector}>
                <div className={styles.dropdownLabel}>
                  <span>AI Provider</span>
                  <span 
                    className={styles.helpIcon} 
                    onClick={() => setShowHelpPopup('ai-model')}
                    title="Click for more info"
                  >?</span>
                </div>
                <div 
                  ref={providerMenuRef}
                  className={`${styles.customSelect} ${isLoading ? styles.disabled : ''}`}
                  onClick={() => { if (!isLoading) setShowProviderMenu(!showProviderMenu) }}
                  role="button"
                  aria-haspopup="listbox"
                  aria-expanded={showProviderMenu}
                  tabIndex={0}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isLoading) { e.preventDefault(); setShowProviderMenu(!showProviderMenu) } }}
                  style={{
                    backgroundColor: '#ffffff !important',
                    color: '#111827 !important'
                  }}
                >
                  <span className={styles.customSelectLabel}>{getProviderLabel(selectedProvider, settings.llmModel)}</span>
                  <span className={styles.customSelectCaret}>▾</span>
                  {showProviderMenu && (
                    <div className={styles.customMenu} role="listbox" style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}>
                      {getAllProviders().map((provider: any) => (
                        <div
                          key={provider.value}
                          role="option"
                          aria-selected={selectedProvider === provider.value}
                          className={`${styles.customOption} ${selectedProvider === provider.value ? styles.selectedOption : ''}`}
                          style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const newProvider = provider.value as LLMProvider
                            setSelectedProvider(newProvider); 
                            setShowProviderMenu(false)
                            
                            // Keep current model if it's valid for the new provider, otherwise use default
                            let newModel = settings.llmModel
                            if (!settings.llmModel || 
                                (newProvider === 'gemini' && !settings.llmModel.startsWith('gemini-')) ||
                                (newProvider === 'openai' && !settings.llmModel.startsWith('gpt-')) ||
                                (newProvider === 'deepseek' && !settings.llmModel.startsWith('deepseek-')) ||
                                (newProvider === 'anthropic' && !settings.llmModel.startsWith('claude-')) ||
                                (newProvider === 'custom' && settings.llmModel !== 'custom')) {
                              newModel = (models as any).defaults[newProvider]
                            }
                            onSettingsChange({
                              ...settings,
                              llmProvider: newProvider,
                              llmModel: newModel
                            })
                            setHasChanges(true)
                  }}
                        >
                          {provider.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.styleSelector}>
                <div className={styles.dropdownLabel}>
                  <span>Explanation Style</span>
                  <span 
                    className={styles.helpIcon} 
                    onClick={() => setShowHelpPopup('style')}
                    title="Click for more info"
                  >?</span>
                </div>
                <div 
                  ref={styleMenuRef}
                  className={`${styles.customSelect} ${isLoading ? styles.disabled : ''}`}
                  onClick={() => { if (!isLoading) setShowStyleMenu(!showStyleMenu) }}
                  role="button"
                  aria-haspopup="listbox"
                  aria-expanded={showStyleMenu}
                  tabIndex={0}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isLoading) { e.preventDefault(); setShowStyleMenu(!showStyleMenu) } }}
        style={{
          backgroundColor: '#ffffff !important',
          color: '#111827 !important'
        }}
                >
                  <span className={styles.customSelectLabel}>{getAllStyles().find(s => s.value === currentStyle)?.name || 'Neutral'}</span>
                  <span className={styles.customSelectCaret}>▾</span>
                  {showStyleMenu && (
                    <div className={styles.customMenu} role="listbox" style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}>
                      {getAllStyles().map((style) => (
                        <div
                          key={style.value}
                          role="option"
                          aria-selected={currentStyle === style.value}
                          className={`${styles.customOption} ${currentStyle === style.value ? styles.selectedOption : ''}`}
                          style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const newStyle = style.value as ExplanationStyle
                            setCurrentStyle(newStyle); 
                            setShowStyleMenu(false)
                            // Persist as new default and mark as changed
                            onSettingsChange({
                              ...settings,
                              explanationStyle: newStyle
                            })
                            setHasChanges(true)
                          }}
                        >
                          {style.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Response Length Radio Buttons Row */}
            <div className={styles.lengthRow}>
              <div className={styles.radioButtons}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="responseLength"
                    value="brief"
                    checked={currentResponseLength === 'brief'}
                    onChange={(e) => {
                      e.stopPropagation()
                      const newLength = e.target.value as ResponseLength
                      log('ui', '🔍 Brief radio clicked:', { newLength, currentResponseLength, settingsResponseLength: settings.responseLength })
                      setCurrentResponseLength(newLength)
                      // Persist as new default and mark as changed
                      onSettingsChange({
                        ...settings,
                        responseLength: newLength
                      })
                      setHasChanges(true)
                    }}
                    disabled={isLoading}
                  />
                  <span>Brief</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="responseLength"
                    value="medium"
                    checked={currentResponseLength === 'medium'}
                    onChange={(e) => {
                      e.stopPropagation()
                      const newLength = e.target.value as ResponseLength
                      log('ui', '🔍 Medium radio clicked:', { newLength, currentResponseLength, settingsResponseLength: settings.responseLength })
                      setCurrentResponseLength(newLength)
                      onSettingsChange({
                        ...settings,
                        responseLength: newLength
                      })
                      setHasChanges(true)
                    }}
                    disabled={isLoading}
                  />
                  <span>Medium</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="responseLength"
                    value="long"
                    checked={currentResponseLength === 'long'}
                    onChange={(e) => {
                      e.stopPropagation()
                      const newLength = e.target.value as ResponseLength
                      log('ui', '🔍 Long radio clicked:', { newLength, currentResponseLength, settingsResponseLength: settings.responseLength })
                      setCurrentResponseLength(newLength)
                      onSettingsChange({
                        ...settings,
                        responseLength: newLength
                      })
                      setHasChanges(true)
                    }}
                    disabled={isLoading}
                  />
                  <span>Long</span>
                </label>
              </div>
            </div>
            
            {/* Buttons Row */}
            <div className={styles.buttonsRow}>
              <button 
                onClick={() => handleReExplain(originalSelectedText || selectedText)}
                disabled={isLoading || (!originalSelectedText && !selectedText && !hasChanges)}
                className={styles.reexplainButton}
                title={`Re-explain in selected style${(!originalSelectedText && !selectedText && !hasChanges) ? ' (no text available)' : ''}${hasChanges ? ' (settings changed)' : ''}`}
              >
                Re-explain{hasChanges ? ' *' : ''}
              </button>
              <div className={styles.saveDropdown} ref={saveDropdownRef}>
              <button 
                onClick={() => setSaveFormatDropdownOpen(prev => !prev)}
                disabled={messages.length === 0}
                className={styles.saveButton}
                title="Save chat history to file"
              >
                💾 Save Chat ▾
              </button>
              {saveFormatDropdownOpen && (
                <div className={styles.saveDropdownContent} style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}>
                  <button 
                    onClick={() => {
                      log('ui', '🔍 JSON SAVE CLICKED')
                      saveChatHistory('json')
                      setSaveFormatDropdownOpen(false)
                    }}
                    className={styles.saveOption}
                    style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                  >
                    📄 JSON
                  </button>
                  <button 
                    onClick={() => {
                      log('ui', '🔍 HTML SAVE CLICKED')
                      saveChatHistory('html')
                      setSaveFormatDropdownOpen(false)
                    }}
                    className={styles.saveOption}
                    style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                  >
                    🌐 HTML
                  </button>
                  <button 
                    onClick={() => {
                      log('ui', '🔍 MARKDOWN SAVE CLICKED')
                      saveChatHistory('markdown')
                      setSaveFormatDropdownOpen(false)
                    }}
                    className={styles.saveOption}
                    style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                  >
                    📝 Markdown
                  </button>
                  <button 
                    onClick={() => {
                      log('ui', '🔍 TEXT SAVE CLICKED')
                      saveChatHistory('text')
                      setSaveFormatDropdownOpen(false)
                    }}
                    className={styles.saveOption}
                    style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                  >
                    📋 Plain Text
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowClearConfirm(true)}
              disabled={messages.length === 0}
              className={styles.clearButton}
              title="Clear all chat history"
            >
              🗑️ Clear History
            </button>
            {/* Share button moved to inline with each response */}
            </div>
          </div>
          {!isPageMode && <button onClick={onClose} className={styles.closeButton}>×</button>}
        </div>
        
        <div 
          className={styles.messagesContainer} 
          ref={messagesContainerRef}
          style={messages.length === 0 ? { flex: '0 0 auto', minHeight: '100px' } : {}}
        >
          {!showFullHistory && getHiddenMessageCount() > 0 && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button 
                onClick={() => setShowFullHistory(true)}
                className={styles.historyToggle}
                title="Show full conversation history"
              >
                Show Chat History ({getHiddenMessageCount()} earlier message{getHiddenMessageCount() !== 1 ? 's' : ''})
              </button>
            </div>
          )}
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginBottom: '8px' }}>
              Debug: showFullHistory={showFullHistory.toString()}, hiddenCount={getHiddenMessageCount()}, totalMessages={messages.length}
            </div>
          )}
          {showFullHistory && getHiddenMessageCount() > 0 && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button 
                onClick={() => setShowFullHistory(false)}
                className={styles.historyToggle}
                title="Show only current exchange"
              >
                Hide Chat History
              </button>
            </div>
          )}
          {getDisplayedMessages().map((message, index) => {
            const isLatestAssistantMessage = message.role === 'assistant' && index === getDisplayedMessages().length - 1
            return (
            <div 
              key={message.id} 
              className={`${styles.message} ${styles[message.role]}`}
              ref={isLatestAssistantMessage ? latestResponseRef : null}
            >
              {message.role === 'assistant' && message.provider && (
                <div className={styles.messageInfo}>
                  <span className={styles.providerBadge}>
                    {message.provider === 'youtube' 
                      ? '🎬 YouTube' 
                      : (() => {
                          const p = message.provider as LLMProvider
                          const modelId = message.model || resolveModelFor(p, settings.llmModel)
                          const providerText = getProviderLabel(p)
                          const modelText = getModelLabel(modelId)
                          return modelText || providerText
                        })()
                    }
                  </span>
                  {message.style && message.style !== 'neutral' && (
                    <span className={styles.styleBadge}>
                      in the style of {
                        message.style === 'harold-bloom' ? 'Harold Bloom' :
                        message.style === 'jerry-seinfeld' ? 'Jerry Seinfeld' :
                        message.style === 'david-foster-wallace' ? 'David Foster Wallace' :
                        message.style === 'oscar-wilde' ? 'Oscar Wilde' :
                        message.style === 'maya-angelou' ? 'Maya Angelou' :
                        message.style === 'douglas-adams' ? 'Douglas Adams' :
                        message.style === 'terry-pratchett' ? 'Terry Pratchett' :
                        message.style === 'joan-didion' ? 'Joan Didion' :
                        message.style === 'david-sedaris' ? 'David Sedaris' :
                        message.style === 'mark-twain' ? 'Mark Twain' :
                        message.style === 'james-joyce' ? 'James Joyce' :
                        message.style === 'samuel-beckett' ? 'Samuel Beckett' :
                        message.style === 'marilyn-monroe' ? 'Marilyn Monroe' :
                        message.style === 'louis-theroux' ? 'Louis Theroux' :
                        message.style === 'robin-williams' ? 'Robin Williams' :
                        message.style === 'kurt-vonnegut' ? 'Kurt Vonnegut' :
                        // Add more style mappings as needed
                        message.style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      }
                    </span>
                  )}
                </div>
              )}
              <div className={styles.messageContent}>
                {message.videoId ? (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <pre 
                        className={styles.messageText}
                        style={{ fontFamily: settings.chatFont }}
                      >
                        {message.content}
                      </pre>
                    </div>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', background: '#000' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${message.videoId}`}
                        title={message.videoTitle || 'YouTube video'}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%'
                        }}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {message.videoTitle && (
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                        {message.videoTitle}
                      </div>
                    )}
                  </div>
                ) : (
                  <pre 
                    className={styles.messageText}
                    style={{ fontFamily: settings.chatFont }}
                  >
                    {message.content}
                  </pre>
                )}
              </div>
              {message.role === 'assistant' && !message.videoId && (
                <div className={styles.messageActions}>
                  <div className={styles.ratingButtons}>
                    <button
                      onClick={() => rateResponse(message.id, 'good')}
                      className={`${styles.ratingButton} ${styles.goodRating} ${message.rating === 'good' ? styles.active : ''}`}
                      title="Mark as good response"
                    >
                      👍 Good
                    </button>
                    <button
                      onClick={() => rateResponse(message.id, 'bad')}
                      className={`${styles.ratingButton} ${styles.badRating} ${message.rating === 'bad' ? styles.active : ''}`}
                      title="Mark as bad response"
                    >
                      👎 Bad
                    </button>
                    <div className={styles.shareDropdown}>
                      <button
                        onClick={() => setShareDropdownOpen(shareDropdownOpen === message.id ? null : message.id)}
                        className={styles.shareResponseButton}
                        title="Share this response"
                      >
                        🐙 Share ▼
                      </button>
                      {shareDropdownOpen === message.id && (
                        <div className={styles.shareDropdownContent} style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}>
                          <button
                            onClick={() => {
                              shareSpecificResponse(message)
                              setShareDropdownOpen(null)
                            }}
                            className={styles.shareOption}
                            style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                            title="Share to GitHub Issues"
                          >
                            🐙 GitHub Issues
                          </button>
                          <button
                            onClick={() => {
                              shareToReddit(message)
                              setShareDropdownOpen(null)
                            }}
                            className={styles.shareOption}
                            style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                            title="Share to Reddit"
                          >
                            🔗 Reddit
                          </button>
                          <button
                            onClick={() => {
                              shareToDiscord(message)
                              setShareDropdownOpen(null)
                            }}
                            className={styles.shareOption}
                            style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                            title="Share to Discord"
                          >
                            💬 Discord
                          </button>
                          <button
                            onClick={() => {
                              copyToClipboard(message)
                              setShareDropdownOpen(null)
                            }}
                            className={styles.shareOption}
                            style={{ backgroundColor: '#ffffff !important', color: '#111827 !important' }}
                            title="Copy to clipboard"
                          >
                            📋 Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {message.rating && (
                    <span className={styles.ratingStatus}>
                      {getRatingIcon(message.rating)} Rated as {message.rating}
                    </span>
                  )}
                </div>
              )}
              <div className={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )})}
          
          {isLoading && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.messageContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                  <span style={{ fontSize: '14px' }}>AI is thinking</span>
                  <div className={styles.loadingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Display selected text quote if no messages yet */}
        {messages.length === 0 && (originalSelectedText || selectedText) && (
          <div className={styles.quoteDisplay}>
            <div className={styles.quoteHeader}>
              <h4>Selected Text</h4>
            </div>
            <div className={styles.quoteContent}>
              <blockquote>
                "{originalSelectedText || selectedText}"
              </blockquote>
            </div>
            <div className={styles.quoteActions}>
              <button 
                onClick={() => handleReExplain(originalSelectedText || selectedText)}
                disabled={isLoading}
                className={styles.explainButton}
                title="Explain this text"
              >
                {isLoading ? 'Explaining...' : 'Explain This Text'}
              </button>
            </div>
          </div>
        )}
        
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a follow-up question..."
            className={styles.messageInput}
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={styles.sendButton}
          >
            Send
          </button>
        </div>
      </div>
      
      {/* GitHub Sharing Modal */}
      {showShareModal && (
        <div className={styles.shareModalOverlay}>
          <div className={styles.shareModal}>
            <div className={styles.shareModalHeader}>
              <h3>🐙 Share to GitHub</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className={styles.shareModalClose}
              >
                ×
              </button>
            </div>
            
            <div className={styles.shareModalContent}>

              <div className={styles.formGroup}>
                <label htmlFor="reddit-title">Issue Title:</label>
                <input
                  id="reddit-title"
                  type="text"
                  className={styles.redditInput}
                  value={shareFormData?.title || ''}
                  onChange={(e) => setShareFormData(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Enter your GitHub issue title..."
                  maxLength={300}
                />
                <span className={styles.charCount}>
                  {shareFormData?.title?.length || 0}/300
                </span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="reddit-content">Issue Description:</label>
                <textarea
                  id="reddit-content"
                  className={styles.redditTextarea}
                  value={shareFormData?.content || ''}
                  onChange={(e) => setShareFormData(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="Your content will appear here..."
                  maxLength={40000}
                />
                <span className={styles.charCount}>
                  {shareFormData?.content?.length || 0}/40,000
                </span>
              </div>

              <div className={styles.redditActions}>
                <button
                  onClick={() => {
                    if (!shareFormData) return
                    
                    // GitHub approach: Copy to clipboard + open GitHub new issue
                    const encodedTitle = encodeURIComponent(shareFormData.title)
                    const encodedBody = encodeURIComponent(shareFormData.content)
                    const githubUrl = `https://github.com/johndimm/the-explainers/issues/new?title=${encodedTitle}&body=${encodedBody}&labels=ai-response,shared`
                    
                    navigator.clipboard.writeText(shareFormData.content).then(() => {
                      window.open(githubUrl, '_blank')
                      setShowShareModal(false)
                    }).catch(() => {
                      window.open(githubUrl, '_blank')
                      setShowShareModal(false)
                    })
                  }}
                  className={styles.redditSubmitButton}
                >
                  🐙 Create GitHub Issue
                </button>
                
                <button
                  onClick={() => {
                    if (!shareFormData) return
                    
                    navigator.clipboard.writeText(shareFormData.content).then(() => {
                      setShowShareModal(false)
                    }).catch(() => {
                      setShowShareModal(false)
                    })
                  }}
                  className={styles.redditCopyButton}
                >
                  📋 Copy Content
                </button>
                
                <button
                  onClick={() => setShowShareModal(false)}
                  className={styles.redditCancelButton}
                >
                  Cancel
                </button>
              </div>

              <div className={styles.shareTips}>
                <p>💡 <strong>Pro Tips:</strong></p>
                <ul>
                  <li>GitHub will pre-fill both title and description (much more reliable than Reddit!)</li>
                  <li>The selected text quote and context are automatically included</li>
                  <li>Use Ctrl+V (Windows) or Cmd+V (Mac) to paste if needed</li>
                  <li>Add relevant labels like "ai-response", "discussion", or "question"</li>
                  <li>Consider adding context about what you found interesting</li>
                  <li>GitHub issues support full markdown formatting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Popup */}
      {showHelpPopup && (
        <div className={styles.helpPopupOverlay} onClick={() => setShowHelpPopup(null)}>
          <div className={styles.helpPopup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.helpPopupHeader}>
              <h4>{getHelpPopupTitle()}</h4>
              <button 
                className={styles.helpPopupClose}
                onClick={() => setShowHelpPopup(null)}
              >×</button>
            </div>
            <div className={styles.helpPopupContent}>
              {getHelpPopupContent()}
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Dialog */}
      {showClearConfirm && (
        <>
          {/* Backdrop */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000
          }} />
          {/* Dialog */}
          <div style={{ 
            position: 'fixed', 
            top: '50vh', 
            left: '50vw', 
            transform: 'translate(-50%, -50%)', 
            background: 'white', 
            border: '1px solid #ccc', 
            borderRadius: '8px', 
            padding: '20px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            zIndex: 10001,
            maxWidth: '400px',
            textAlign: 'center',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#d32f2f' }}>Clear Chat History?</h3>
          <p style={{ margin: '0 0 20px 0', color: '#666' }}>
            This will permanently delete all {messages.length} messages in this conversation. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowClearConfirm(false)}
              style={{ 
                padding: '8px 16px', 
                border: '1px solid #ccc', 
                borderRadius: '4px', 
                background: 'white', 
                cursor: 'pointer' 
              }}
            >
              Cancel
            </button>
            <button 
              onClick={clearChatHistory}
              style={{ 
                padding: '8px 16px', 
                border: 'none', 
                borderRadius: '4px', 
                background: '#d32f2f', 
                color: 'white', 
                cursor: 'pointer' 
              }}
            >
              🗑️ Clear All
            </button>
          </div>
          </div>
        </>
      )}

    </div>
  )
}

export default ChatInterface
