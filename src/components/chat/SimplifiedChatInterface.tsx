'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { ChatHeader } from './ChatHeader'
import { ChatMessageList } from './ChatMessageList'
import { ChatControls } from './ChatControls'
import { Message } from '../../types/ChatInterface'
import { SettingsData, LLMProvider, ResponseLength, ExplanationStyle, LLMModel } from '../Settings'
import { ProfileData } from '../Profile'
import { useProfile } from '../../contexts/ProfileContext'
import { 
  createUserMessage, 
  getDisplayedMessages, 
  getHiddenMessageCount,
  saveMessagesToStorage,
  loadMessagesFromStorage,
  clearMessagesFromStorage
} from '../../utils/chatMessageUtils'
import { processExplanationRequest } from '../../services/explanationService'
import { log } from '../../utils/log'
import styles from '../ChatInterface.module.css'

interface SimplifiedChatInterfaceProps {
  selectedText: string
  bookTitle: string
  author: string
  isPageMode: boolean
  settings: SettingsData
  onSettingsChange: (settings: SettingsData) => void
  contextInfo?: any
  profile?: any
  onClose?: () => void
}

export const SimplifiedChatInterface: React.FC<SimplifiedChatInterfaceProps> = ({
  selectedText,
  bookTitle,
  author,
  isPageMode,
  settings,
  onSettingsChange,
  contextInfo,
  profile: profileProp,
  onClose
}) => {
  // State management
  const [messages, setMessages] = useState<Message[]>([])
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Refs
  const initializedRef = useRef(false)
  const processingRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Router and auth
  const router = useRouter()
  const { user } = useAuth()
  const { profile, canUseExplanation, useExplanation } = useProfile()

  // Load messages from storage on mount
  useEffect(() => {
    const storedMessages = loadMessagesFromStorage()
    if (storedMessages.length > 0) {
      setMessages(storedMessages)
    }
  }, [])

  // Save messages to storage when they change
  useEffect(() => {
    saveMessagesToStorage(messages)
  }, [messages])

  // Auto-explain selected text
  useEffect(() => {
    if (selectedText && !initializedRef.current) {
      initializedRef.current = true
      
      let shouldAutoExplain = false
      
      if (!isPageMode) {
        shouldAutoExplain = true
      } else {
        const storedContext = sessionStorage.getItem('chatContext')
        if (storedContext) {
          try {
            const parsedContext = JSON.parse(storedContext)
            if (parsedContext.selectedText === selectedText) {
              shouldAutoExplain = true
              sessionStorage.removeItem('chatContext')
            }
          } catch (error) {
            log('ui', 'Error parsing chat context:', error)
          }
        }
      }
      
      if (shouldAutoExplain) {
        handleExplainText(selectedText)
      }
    }
  }, [selectedText, isPageMode])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleExplainText = async (text: string) => {
    if (processingRef.current === text) {
      log('chat-history', '🚫 Duplicate call prevented for:', text)
      return
    }
    
    if (processingRef.current !== null) {
      log('chat-history', '🚫 Already processing text:', processingRef.current, 'blocking:', text)
      return
    }
    
    processingRef.current = text
    log('chat-history', '🚀 handleExplainText proceeding with:', text)
    
    if (!canUseExplanation(bookTitle, author, false)) {
      if (!user) {
        router.push('/auth/login')
      } else {
        router.push('/profile')
      }
      processingRef.current = null
      return
    }

    const userMessage = createUserMessage(text)
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const success = useExplanation(bookTitle, author, false)
      if (!success) {
        throw new Error('Failed to use explanation')
      }

      const result = await processExplanationRequest(
        text,
        settings,
        settings.llmProvider,
        settings.llmModel || 'gpt-4o',
        bookTitle,
        author,
        { selectedText: text, bookTitle, author }
      )

      if (result.success) {
        setMessages(prev => [...prev, ...result.messages])
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.error || 'An error occurred',
          provider: 'error',
          style: 'error',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      log('error', 'Explanation failed:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'An error occurred while processing your request',
        provider: 'error',
        style: 'error',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
      setHasChanges(false)
      processingRef.current = null
    }
  }

  const handleToggleHistory = () => {
    setShowFullHistory(!showFullHistory)
  }

  const handleClearHistory = () => {
    setShowClearConfirm(true)
  }

  const handleConfirmClear = () => {
    setMessages([])
    clearMessagesFromStorage()
    setShowClearConfirm(false)
  }

  const handleCancelClear = () => {
    setShowClearConfirm(false)
  }

  const handleRateMessage = (messageId: string, rating: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ))
  }

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  const handleProviderChange = (provider: LLMProvider) => {
    onSettingsChange({ ...settings, llmProvider: provider })
    setHasChanges(true)
  }

  const handleModelChange = (model: LLMModel) => {
    onSettingsChange({ ...settings, llmModel: model })
    setHasChanges(true)
  }

  const handleResponseLengthChange = (length: ResponseLength) => {
    onSettingsChange({ ...settings, responseLength: length })
    setHasChanges(true)
  }

  const handleStyleChange = (style: ExplanationStyle) => {
    onSettingsChange({ ...settings, explanationStyle: style })
    setHasChanges(true)
  }

  const displayedMessages = getDisplayedMessages(messages, showFullHistory)
  const hiddenMessageCount = getHiddenMessageCount(messages, showFullHistory)

  return (
    <div className={styles.chatInterface}>
      <ChatHeader
        showFullHistory={showFullHistory}
        hiddenMessageCount={hiddenMessageCount}
        onToggleHistory={handleToggleHistory}
        onClearHistory={handleClearHistory}
        showClearConfirm={showClearConfirm}
        onConfirmClear={handleConfirmClear}
        onCancelClear={handleCancelClear}
      />
      
      <ChatControls
        selectedProvider={settings.llmProvider}
        selectedModel={settings.llmModel}
        responseLength={settings.responseLength}
        explanationStyle={settings.explanationStyle}
        onProviderChange={handleProviderChange}
        onModelChange={handleModelChange}
        onResponseLengthChange={handleResponseLengthChange}
        onStyleChange={handleStyleChange}
        isLoading={isLoading}
        hasChanges={hasChanges}
      />
      
      <div className={styles.messagesContainer}>
        <ChatMessageList
          messages={displayedMessages}
          onRateMessage={handleRateMessage}
          onDeleteMessage={handleDeleteMessage}
        />
        {isLoading && (
          <div className={styles.loadingMessage}>
            Processing your request...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
