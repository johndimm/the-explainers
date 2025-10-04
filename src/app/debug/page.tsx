'use client'

import { useTheme } from '@/hooks/useTheme'

export default function DebugPage() {
  const theme = useTheme()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      <div className="space-y-2">
        <p><strong>SINGLE_PLAY_MODE:</strong> {process.env.SINGLE_PLAY_MODE || 'undefined'}</p>
        <p><strong>NEXT_PUBLIC_SINGLE_PLAY_MODE:</strong> {process.env.NEXT_PUBLIC_SINGLE_PLAY_MODE || 'undefined'}</p>
        <p><strong>PLAY_TITLE:</strong> {process.env.PLAY_TITLE || 'undefined'}</p>
        <p><strong>NEXT_PUBLIC_PLAY_TITLE:</strong> {process.env.NEXT_PUBLIC_PLAY_TITLE || 'undefined'}</p>
        <p><strong>THEME_TYPE:</strong> {process.env.THEME_TYPE || 'undefined'}</p>
        <p><strong>NEXT_PUBLIC_THEME_TYPE:</strong> {process.env.NEXT_PUBLIC_THEME_TYPE || 'undefined'}</p>
        <p><strong>APP_NAME:</strong> {process.env.APP_NAME || 'undefined'}</p>
        <p><strong>NEXT_PUBLIC_APP_NAME:</strong> {process.env.NEXT_PUBLIC_APP_NAME || 'undefined'}</p>
        <p><strong>PLAY_FILENAME:</strong> {process.env.PLAY_FILENAME || 'undefined'}</p>
        <p><strong>NEXT_PUBLIC_PLAY_FILENAME:</strong> {process.env.NEXT_PUBLIC_PLAY_FILENAME || 'undefined'}</p>
        
        <h2 className="text-xl font-bold mt-6 mb-2">Theme Hook Values:</h2>
        <p><strong>isSinglePlay:</strong> {theme.isSinglePlay ? 'true' : 'false'}</p>
        <p><strong>playTitle:</strong> {theme.playTitle}</p>
        <p><strong>themeType:</strong> {theme.themeType}</p>
        <p><strong>appName:</strong> {theme.appName}</p>
      </div>
    </div>
  )
}