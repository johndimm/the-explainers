import explainers from '../data/explainers.json'
import models from '../data/models.json'
import responseLengths from '../data/response-lengths.json'
import fontFamilies from '../data/font-families.json'
import readingModes from '../data/reading-modes.json'
import defaultSettings from '../data/default-settings.json'

// Derive all types from JSON data
export type LLMProvider = typeof models.providers[number]['id']
export type LLMModel = typeof models.models[keyof typeof models.models][number]['id']
export type ResponseLength = typeof responseLengths.lengths[number]['id']
export type FontFamily = typeof fontFamilies.fonts[number]['id']
export type ReadingMode = typeof readingModes.modes[number]['id']
export type ExplanationStyle = 'neutral' | keyof typeof explainers.instructions

export interface SettingsData {
  llmProvider: LLMProvider
  llmModel?: LLMModel
  responseLength: ResponseLength
  textFont: FontFamily
  chatFont: FontFamily
  textFontSize: number
  chatFontSize: number
  readingMode: ReadingMode
  explanationStyle: ExplanationStyle
  customApiKey?: string
  customApiUrl?: string
  customModelName?: string
  language?: string
}

export interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  settings: SettingsData
  onSettingsChange: (settings: SettingsData) => void
}

// Use default settings from JSON data
export const DEFAULT_SETTINGS: SettingsData = defaultSettings as SettingsData

// Get model options from JSON data
export const getModelOptions = (provider: LLMProvider) => {
  return (models as any).models[provider] || []
}

// Get explanation style options
export const getExplanationStyleOptions = () => {
  const styles = Object.keys(explainers.instructions).map(key => ({
    id: key as ExplanationStyle,
    name: key.charAt(0).toUpperCase() + key.slice(1)
  }))
  
  return [
    { id: 'neutral' as ExplanationStyle, name: 'Neutral' },
    ...styles
  ]
}

// Get response length options
export const getResponseLengthOptions = () => {
  return responseLengths.lengths
}

// Get font family options
export const getFontFamilyOptions = () => {
  return fontFamilies.fonts
}

// Get reading mode options
export const getReadingModeOptions = () => {
  return readingModes.modes
}
