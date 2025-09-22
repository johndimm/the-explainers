import models from '../data/models.json'

// Centralized settings management with migration
export class SettingsManager {
  private static instance: SettingsManager
  private migrations: Array<(settings: any) => any> = []

  private constructor() {
    this.setupMigrations()
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager()
    }
    return SettingsManager.instance
  }

  private setupMigrations() {
    // Migration 1: Old Claude models -> Default Claude model from JSON
    this.migrations.push((settings) => {
      if (settings.llmProvider === 'anthropic' && 
          (settings.llmModel === 'claude-3-sonnet-20240229' || settings.llmModel === 'claude-3-5-sonnet')) {
        const defaultModel = (models as any).defaults.anthropic
        console.log(`SettingsManager: Migrating old Claude model to ${defaultModel}`)
        return {
          ...settings,
          llmModel: defaultModel
        }
      }
      return settings
    })
  }

  // Get default settings with proper model selection
  getDefaultSettings() {
    return {
      llmProvider: 'gemini' as const,
      llmModel: (models as any).defaults.gemini,
      responseLength: 'brief' as const,
      textFont: 'serif' as const,
      chatFont: 'sans-serif' as const,
      textFontSize: 18,
      chatFontSize: 16,
      readingMode: 'scroll' as const,
      explanationStyle: 'neutral' as const
    }
  }

  // Get default model for a provider
  getDefaultModelForProvider(provider: string): string {
    return (models as any).defaults[provider] || (models as any).chatDefaults[provider]
  }

  // Migrate settings through all migrations
  migrateSettings(settings: any) {
    let migratedSettings = { ...settings }
    
    for (const migration of this.migrations) {
      migratedSettings = migration(migratedSettings)
    }
    
    return migratedSettings
  }

  // Get model for API call with migration
  getModelForProvider(provider: string, settingsModel?: string): string {
    // Apply migrations first
    const migratedModel = this.migrateSettings({ llmProvider: provider, llmModel: settingsModel }).llmModel
    
    if (migratedModel && this.isValidModelForProvider(provider, migratedModel)) {
      return migratedModel
    }
    
    return this.getDefaultModelForProvider(provider)
  }

  // Check if model is valid for provider
  private isValidModelForProvider(provider: string, model: string): boolean {
    const providerModels = (models as any).models[provider] || []
    return providerModels.some((m: any) => m.id === model)
  }

  // Get all available models for a provider
  getModelsForProvider(provider: string) {
    return (models as any).models[provider] || []
  }

  // Get all providers
  getProviders() {
    return (models as any).providers || []
  }
}

// Export singleton instance
export const settingsManager = SettingsManager.getInstance()
