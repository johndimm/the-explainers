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

// Get theme configuration based on environment variables
export function getThemeConfig(): ThemeConfig {
  const themeType = (process.env.NEXT_PUBLIC_THEME_TYPE || process.env.THEME_TYPE) as keyof typeof THEME_CONFIGS || 'tragedy'
  return THEME_CONFIGS[themeType] || THEME_CONFIGS.tragedy
}

// Get single play configuration
export function getSinglePlayConfig(): SinglePlayConfig {
  return {
    isEnabled: (process.env.NEXT_PUBLIC_SINGLE_PLAY_MODE || process.env.SINGLE_PLAY_MODE) === 'true',
    playTitle: process.env.NEXT_PUBLIC_PLAY_TITLE || process.env.PLAY_TITLE || 'Romeo and Juliet',
    playAuthor: process.env.NEXT_PUBLIC_PLAY_AUTHOR || process.env.PLAY_AUTHOR || 'William Shakespeare',
    playFilename: process.env.NEXT_PUBLIC_PLAY_FILENAME || process.env.PLAY_FILENAME || 'romeo-and-juliet.txt',
    isShakespeare: (process.env.NEXT_PUBLIC_IS_SHAKESPEARE || process.env.IS_SHAKESPEARE) === 'true',
    themeType: (process.env.NEXT_PUBLIC_THEME_TYPE || process.env.THEME_TYPE as any) || 'tragedy',
    appName: process.env.NEXT_PUBLIC_APP_NAME || process.env.APP_NAME || 'Romeo and Juliet Explained',
    appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || process.env.APP_DESCRIPTION || 'Understand Romeo and Juliet with AI-powered explanations',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'romeo-and-juliet-explained.vercel.app',
    appIconText: process.env.NEXT_PUBLIC_APP_ICON_TEXT || process.env.APP_ICON_TEXT || 'R&J',
    guideTitle: process.env.NEXT_PUBLIC_GUIDE_TITLE || process.env.GUIDE_TITLE || 'Understanding Romeo and Juliet',
    guideSubtitle: process.env.NEXT_PUBLIC_GUIDE_SUBTITLE || process.env.GUIDE_SUBTITLE || 'Your guide to Shakespeare\'s timeless tragedy'
  }
}

// Check if we're in single play mode
export function isSinglePlayMode(): boolean {
  return (process.env.NEXT_PUBLIC_SINGLE_PLAY_MODE || process.env.SINGLE_PLAY_MODE) === 'true'
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