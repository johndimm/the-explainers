'use client'

import React from 'react'
import { ChatMessage } from '@/utils/exampleParser'

interface ExampleChatMessageProps {
  message: ChatMessage
}

const ExampleChatMessage: React.FC<ExampleChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'
  
  return (
    <div className={`d-flex mb-3 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
      <div 
        className={`p-3 rounded-3 ${isUser ? 'bg-primary text-white' : 'bg-light'}`}
        style={{ 
          maxWidth: '70%',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
      >
        <div className="message-content">
          {message.content}
        </div>
        <div 
          className={`mt-2 small ${isUser ? 'text-white-50' : 'text-muted'}`}
          style={{ fontSize: '11px' }}
        >
          {message.timestamp}
          {!isUser && message.provider && (
            <span className="ms-2">
              {message.provider}
              {message.model && ` (${message.model})`}
              {message.style && ` - ${message.style}`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExampleChatMessage
