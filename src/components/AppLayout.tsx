'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SettingsProvider } from '../contexts/SettingsContext'
import { ProfileProvider } from '../contexts/ProfileContext'
import AdaptiveAppLayout from './AdaptiveAppLayout'

// Import all page components
import ChatPage from '../app/chat/page'
import LibraryPage from '../app/library/page'
import SettingsPage from '../app/settings/page'
import CreditsPage from '../app/credits/page'
import ProfilePage from '../app/profile/page'
import StylesPage from '../app/styles/page'
import GuidePage from '../app/guide/page'

interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [currentPage, setCurrentPage] = useState<'reader' | 'chat' | 'library' | 'settings' | 'credits' | 'profile' | 'styles' | 'guide'>('reader')

  // Determine current page from pathname
  useEffect(() => {
    const path = pathname.replace('/', '') || 'reader'
    setCurrentPage(path as any)
  }, [pathname])

  // Function to get the right panel content based on current page
  const getRightPanelContent = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatPage />
      case 'library':
        return <LibraryPage />
      case 'settings':
        return <SettingsPage />
      case 'credits':
        return <CreditsPage />
      case 'profile':
        return <ProfilePage />
      case 'styles':
        return <StylesPage />
      case 'guide':
        return <GuidePage />
      case 'reader':
      default:
        return null // Reader doesn't need right panel
    }
  }

  return (
    <ProfileProvider>
      <SettingsProvider>
        <AdaptiveAppLayout>
          {children}
        </AdaptiveAppLayout>
      </SettingsProvider>
    </ProfileProvider>
  )
}

export default AppLayout