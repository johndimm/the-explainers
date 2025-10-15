import React from 'react'
import { Message } from '../../types/ChatInterface'
import styles from '../ChatInterface.module.css'

interface ChatMessageListProps {
  messages: Message[]
  onRateMessage?: (messageId: string, rating: number) => void
  onDeleteMessage?: (messageId: string) => void
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  onRateMessage,
  onDeleteMessage
}) => {
  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user'
    const isError = message.style === 'error'
    
    return (
      <div
        key={message.id}
        className={`${styles.message} ${isUser ? styles.userMessage : styles.assistantMessage} ${isError ? styles.errorMessage : ''}`}
      >
        <div className={styles.messageContent}>
          {message.content}
        </div>
        
        {message.videoId && (
          <div className={styles.videoContainer}>
            <iframe
              src={`https://www.youtube.com/embed/${message.videoId}`}
              title={message.videoTitle || 'Video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        
        <div className={styles.messageMeta}>
          <span className={styles.messageTime}>
            {message.timestamp.toLocaleTimeString()}
          </span>
          
          {message.provider && message.provider !== 'error' && (
            <span className={styles.messageProvider}>
              {message.provider} {message.model && `(${message.model})`}
            </span>
          )}
          
          {message.rating !== undefined && (
            <span className={styles.messageRating}>
              Rating: {message.rating}/5
            </span>
          )}
        </div>
        
        {onRateMessage && !isUser && (
          <div className={styles.messageActions}>
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => onRateMessage(message.id, rating)}
                className={`${styles.rateButton} ${message.rating === rating ? styles.rated : ''}`}
              >
                {rating}
              </button>
            ))}
          </div>
        )}
        
        {onDeleteMessage && (
          <button
            onClick={() => onDeleteMessage(message.id)}
            className={styles.deleteButton}
          >
            Delete
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={styles.messageList}>
      {messages.map(renderMessage)}
    </div>
  )
}
