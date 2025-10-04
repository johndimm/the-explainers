import { APP_CONFIG } from '@/config/app-config'
import { AppConfig } from '@/config/types'

export interface ThemeConfig {
  type: 'tragedy' | 'comedy' | 'history' | 'romance'
  color: string
  iconStyle: string
  mood: string
  iconColor: string
  backgroundColor: string
  textColor: string
}

export interface SinglePlayConfig {
  isEnabled: boolean
  playTitle: string
  playAuthor: string
  playFilename: string
  isShakespeare: boolean
  themeType: 'tragedy' | 'comedy' | 'history' | 'romance'
  appName: string
  appDescription: string
  appUrl: string
  appIconText: string
  guideTitle: string
  guideSubtitle: string
}

// Theme configurations for different play types
const THEME_CONFIGS: Record<string, ThemeConfig> = {
  tragedy: {
    type: 'tragedy',
    color: '#8B5CF6', // Deep purple
    iconStyle: 'crown',
    mood: 'dramatic',
    iconColor: '#8B5CF6',
    backgroundColor: '#F8F7FF',
    textColor: '#1F2937'
  },
  comedy: {
    type: 'comedy',
    color: '#10B981', // Emerald green
    iconStyle: 'mask',
    mood: 'playful',
    iconColor: '#10B981',
    backgroundColor: '#F0FDF4',
    textColor: '#1F2937'
  },
  history: {
    type: 'history',
    color: '#DC2626', // Deep red
    iconStyle: 'scroll',
    mood: 'epic',
    iconColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    textColor: '#1F2937'
  },
  romance: {
    type: 'romance',
    color: '#7C3AED', // Violet
    iconStyle: 'heart',
    mood: 'mystical',
    iconColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
    textColor: '#1F2937'
  }
}

// Get theme configuration based on app config
export function getThemeConfig(): ThemeConfig {
  const themeType = APP_CONFIG.themeType
  return THEME_CONFIGS[themeType] || THEME_CONFIGS.tragedy
}

// Get single play configuration
export function getSinglePlayConfig(): SinglePlayConfig {
  return {
    isEnabled: APP_CONFIG.isSinglePlay,
    playTitle: APP_CONFIG.playTitle,
    playAuthor: APP_CONFIG.playAuthor,
    playFilename: APP_CONFIG.playFilename,
    isShakespeare: APP_CONFIG.isShakespeare,
    themeType: APP_CONFIG.themeType,
    appName: APP_CONFIG.appName,
    appDescription: APP_CONFIG.appDescription,
    appUrl: APP_CONFIG.appUrl,
    appIconText: APP_CONFIG.appIconText,
    guideTitle: APP_CONFIG.guideTitle,
    guideSubtitle: APP_CONFIG.guideSubtitle
  }
}

// Check if we're in single play mode
export function isSinglePlayMode(): boolean {
  return APP_CONFIG.isSinglePlay
}

// Get the current theme
export function getCurrentTheme(): ThemeConfig {
  return getThemeConfig()
}

// Generate dynamic CSS variables for theming
export function generateThemeCSS(): string {
  const theme = getCurrentTheme()
  return `
    :root {
      --theme-primary: ${theme.color};
      --theme-icon-color: ${theme.iconColor};
      --theme-background: ${theme.backgroundColor};
      --theme-text: ${theme.textColor};
      --theme-mood: ${theme.mood};
    }
  `
}