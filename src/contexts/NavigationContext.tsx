'use client'

import React, { createContext, useContext, useState } from 'react'

type SidePanelPage = 'chat' | 'library' | 'settings' | 'credits' | 'profile' | 'styles' | 'guide' | null

interface NavigationContextType {
  sidePanelPage: SidePanelPage
  setSidePanelPage: (page: SidePanelPage) => void
  isReaderActive: boolean
  setIsReaderActive: (active: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidePanelPage, setSidePanelPage] = useState<SidePanelPage>(null)
  const [isReaderActive, setIsReaderActive] = useState(true)

  const setSidePanelPageWithDebug = (page: SidePanelPage) => {
    console.log('NavigationContext: Setting side panel page to:', page, 'from:', sidePanelPage)
    setSidePanelPage(page)
  }

  return (
    <NavigationContext.Provider
      value={{
        sidePanelPage,
        setSidePanelPage: setSidePanelPageWithDebug,
        isReaderActive,
        setIsReaderActive,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}