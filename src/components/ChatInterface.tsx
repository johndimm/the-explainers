'use client'

import React, { useState, useEffect, useRef } from 'react'
import { SettingsData } from './Settings'
import { ProfileData } from './Profile'
import { Message } from '../types/ChatInterface'
import { log } from '../utils/log'
import { processExplanationRequest } from '../services/explanationService'

interface ChatInterfaceProps {
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

export default function ChatInterface({
  selectedText,
  bookTitle,
  author,
  isPageMode,
  settings,
  onSettingsChange,
  contextInfo,
  profile,
  onClose
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages from storage
  useEffect(() => {
    const storedMessages = JSON.parse(sessionStorage.getItem('chatHistory') || '[]')
    // Convert timestamp strings back to Date objects
    const messagesWithDates = storedMessages.map((message: any) => ({
      ...message,
      timestamp: new Date(message.timestamp)
    }))
    setMessages(messagesWithDates)
  }, [])

  // Save messages to storage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('chatHistory', JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleExplain = async () => {
    if (!selectedText.trim()) return

    setIsLoading(true)
    
    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `"${selectedText}"`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage])
      
      // Call real explanation service
      const result = await processExplanationRequest(
        selectedText,
        settings,
        settings.llmProvider,
        settings.llmModel || 'gpt-4o',
        bookTitle,
        author,
        contextInfo
      )
      
      if (result.success) {
        setMessages(prev => [...prev, ...result.messages])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.error || 'Failed to get explanation',
          timestamp: new Date(),
          provider: 'error'
        }
        setMessages(prev => [...prev, errorMessage])
      }
      
    } catch (error) {
      log('error', 'Failed to get explanation:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'An error occurred while getting the explanation',
        timestamp: new Date(),
        provider: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearHistory = () => {
    setMessages([])
    sessionStorage.removeItem('chatHistory')
    setShowClearConfirm(false)
  }

  const getHiddenMessageCount = () => {
    if (showFullHistory) return 0
    return Math.max(0, messages.length - 2)
  }

        return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Explain Selected Text</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          "{selectedText}"
        </p>
        <button
          onClick={handleExplain}
          disabled={isLoading}
                  style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Explaining...' : 'Explain'}
        </button>
            </div>
            
      {messages.length > 0 && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4>Chat History</h4>
            <div>
              {getHiddenMessageCount() > 0 && (
              <button 
                  onClick={() => setShowFullHistory(!showFullHistory)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '3px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                >
                  {showFullHistory ? 'Hide History' : `Show Full History (${getHiddenMessageCount()} hidden)`}
                  </button>
              )}
            <button 
              onClick={() => setShowClearConfirm(true)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Clear History
            </button>
            </div>
        </div>
        
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {messages.slice(showFullHistory ? 0 : -2).map((message) => (
            <div 
              key={message.id} 
                        style={{
                  marginBottom: '10px',
                  padding: '10px',
                  backgroundColor: message.role === 'user' ? '#f8f9fa' : '#e9ecef',
                  borderRadius: '5px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
                <div>{message.content}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {message.timestamp instanceof Date ? message.timestamp.toLocaleTimeString() : new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
            ))}
            <div ref={messagesEndRef} />
                  </div>
                </div>
              )}

      {showClearConfirm && (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          backgroundColor: 'white',
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 10001
        }}>
          <p>Are you sure you want to clear all chat history?</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={clearHistory}
              style={{ 
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Yes, Clear
            </button>
            <button 
              onClick={() => setShowClearConfirm(false)}
              style={{ 
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none', 
                padding: '8px 16px',
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Re-export the types for backward compatibility
export type { SettingsData } from './Settings'
export type { ProfileData } from './Profile'