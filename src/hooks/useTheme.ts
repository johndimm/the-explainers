import { useMemo } from 'react'
import { getSinglePlayConfig, getCurrentTheme, isSinglePlayMode } from '@/utils/themeConfig'

export function useTheme() {
  const singlePlayConfig = useMemo(() => getSinglePlayConfig(), [])
  const theme = useMemo(() => getCurrentTheme(), [])
  const isSinglePlay = useMemo(() => isSinglePlayMode(), [])

  return {
    // Single play configuration
    isSinglePlay,
    playTitle: singlePlayConfig.playTitle,
    playAuthor: singlePlayConfig.playAuthor,
    playFilename: singlePlayConfig.playFilename,
    isShakespeare: singlePlayConfig.isShakespeare,
    appName: singlePlayConfig.appName,
    appDescription: singlePlayConfig.appDescription,
    appIconText: singlePlayConfig.appIconText,
    guideTitle: singlePlayConfig.guideTitle,
    guideSubtitle: singlePlayConfig.guideSubtitle,
    
    // Theme configuration
    themeType: theme.type,
    themeColor: theme.color,
    iconStyle: theme.iconStyle,
    mood: theme.mood,
    iconColor: theme.iconColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
    
    // Helper functions
    getThemeCSS: () => `
      --theme-primary: ${theme.color};
      --theme-icon-color: ${theme.iconColor};
      --theme-background: ${theme.backgroundColor};
      --theme-text: ${theme.textColor};
      --theme-mood: ${theme.mood};
    `
  }
}