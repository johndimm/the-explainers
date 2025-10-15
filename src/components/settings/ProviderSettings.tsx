import React from 'react'
import { LLMProvider, LLMModel, SettingsData } from '../../types/settings'
import { getModelOptions } from '../../types/settings'
import styles from '../Settings.module.css'

interface ProviderSettingsProps {
  settings: SettingsData
  onSettingsChange: (settings: SettingsData) => void
}

export const ProviderSettings: React.FC<ProviderSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const modelOptions = getModelOptions(settings.llmProvider)

  const handleProviderChange = (provider: LLMProvider) => {
    const modelOptions = getModelOptions(provider)
    const firstModel = modelOptions[0]?.id
    
    onSettingsChange({
      ...settings,
      llmProvider: provider,
      llmModel: firstModel
    })
  }

  const handleModelChange = (model: LLMModel) => {
    onSettingsChange({
      ...settings,
      llmModel: model
    })
  }

  return (
    <div className={styles.settingsSection}>
      <h3>AI Provider</h3>
      
      <div className={styles.settingGroup}>
        <label htmlFor="provider-select">Provider:</label>
        <select
          id="provider-select"
          value={settings.llmProvider}
          onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
          className={styles.select}
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Google Gemini</option>
          <option value="custom">Custom API</option>
        </select>
      </div>

      <div className={styles.settingGroup}>
        <label htmlFor="model-select">Model:</label>
        <select
          id="model-select"
          value={settings.llmModel || ''}
          onChange={(e) => handleModelChange(e.target.value as LLMModel)}
          className={styles.select}
        >
          {modelOptions.map((model: any) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      {settings.llmProvider === 'custom' && (
        <div className={styles.customApiSettings}>
          <div className={styles.settingGroup}>
            <label htmlFor="custom-api-key">API Key:</label>
            <input
              id="custom-api-key"
              type="password"
              value={settings.customApiKey || ''}
              onChange={(e) => onSettingsChange({
                ...settings,
                customApiKey: e.target.value
              })}
              className={styles.input}
              placeholder="Enter your API key"
            />
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="custom-api-url">API URL:</label>
            <input
              id="custom-api-url"
              type="url"
              value={settings.customApiUrl || ''}
              onChange={(e) => onSettingsChange({
                ...settings,
                customApiUrl: e.target.value
              })}
              className={styles.input}
              placeholder="https://api.example.com/v1/chat/completions"
            />
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="custom-model-name">Model Name:</label>
            <input
              id="custom-model-name"
              type="text"
              value={settings.customModelName || ''}
              onChange={(e) => onSettingsChange({
                ...settings,
                customModelName: e.target.value
              })}
              className={styles.input}
              placeholder="gpt-4"
            />
          </div>
        </div>
      )}
    </div>
  )
}
