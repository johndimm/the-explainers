import React from 'react'
import { LLMProvider, ResponseLength, ExplanationStyle, LLMModel } from '../Settings'
import styles from '../ChatInterface.module.css'

interface ChatControlsProps {
  selectedProvider: LLMProvider
  selectedModel: LLMModel | undefined
  responseLength: ResponseLength
  explanationStyle: ExplanationStyle
  onProviderChange: (provider: LLMProvider) => void
  onModelChange: (model: LLMModel) => void
  onResponseLengthChange: (length: ResponseLength) => void
  onStyleChange: (style: ExplanationStyle) => void
  isLoading: boolean
  hasChanges: boolean
}

export const ChatControls: React.FC<ChatControlsProps> = ({
  selectedProvider,
  selectedModel,
  responseLength,
  explanationStyle,
  onProviderChange,
  onModelChange,
  onResponseLengthChange,
  onStyleChange,
  isLoading,
  hasChanges
}) => {
  const providers: LLMProvider[] = ['openai', 'gemini', 'custom']
  const models: LLMModel[] = ['gpt-4o', 'gpt-4o-mini', 'gemini-2.5-flash', 'gemini-2.5-pro']
  const lengths: ResponseLength[] = ['brief', 'medium', 'detailed']
  const explanationStyles: ExplanationStyle[] = ['neutral', 'harold-bloom', 'oscar-wilde']

  return (
    <div className={styles.chatControls}>
      <div className={styles.controlGroup}>
        <label htmlFor="provider-select">Provider:</label>
        <select
          id="provider-select"
          value={selectedProvider}
          onChange={(e) => onProviderChange(e.target.value as LLMProvider)}
          disabled={isLoading}
        >
          {providers.map(provider => (
            <option key={provider} value={provider}>
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.controlGroup}>
        <label htmlFor="model-select">Model:</label>
        <select
          id="model-select"
          value={selectedModel || ''}
          onChange={(e) => onModelChange(e.target.value as LLMModel)}
          disabled={isLoading}
        >
          {models.map(model => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.controlGroup}>
        <label htmlFor="length-select">Length:</label>
        <select
          id="length-select"
          value={responseLength}
          onChange={(e) => onResponseLengthChange(e.target.value as ResponseLength)}
          disabled={isLoading}
        >
          {lengths.map(length => (
            <option key={length} value={length}>
              {length.charAt(0).toUpperCase() + length.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.controlGroup}>
        <label htmlFor="style-select">Style:</label>
        <select
          id="style-select"
          value={explanationStyle}
          onChange={(e) => onStyleChange(e.target.value as ExplanationStyle)}
          disabled={isLoading}
        >
          {explanationStyles.map(style => (
            <option key={style} value={style}>
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {hasChanges && (
        <div className={styles.unsavedChanges}>
          Unsaved changes
        </div>
      )}
    </div>
  )
}
