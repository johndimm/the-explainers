'use client'

import React, { createContext, useContext, useState, useRef } from 'react'

interface ReaderState {
  bookText: string
  loading: boolean
  currentBook: { title: string; author: string }
  scrollPosition: number
}

interface ReaderContextType {
  readerState: ReaderState
  setReaderState: (state: Partial<ReaderState>) => void
  textContentRef: React.RefObject<HTMLDivElement> | null
  setTextContentRef: (ref: React.RefObject<HTMLDivElement>) => void
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined)

export const ReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [readerState, setReaderStateInternal] = useState<ReaderState>({
    bookText: '',
    loading: true,
    currentBook: { title: '', author: '' },
    scrollPosition: 0
  })
  
  const [textContentRef, setTextContentRef] = useState<React.RefObject<HTMLDivElement> | null>(null)

  const setReaderState = (newState: Partial<ReaderState>) => {
    // Save scroll position before updating state
    if (textContentRef?.current) {
      newState.scrollPosition = textContentRef.current.scrollTop
    }
    
    setReaderStateInternal(prev => ({ ...prev, ...newState }))
  }

  return (
    <ReaderContext.Provider value={{
      readerState,
      setReaderState,
      textContentRef,
      setTextContentRef
    }}>
      {children}
    </ReaderContext.Provider>
  )
}

export const useReader = () => {
  const context = useContext(ReaderContext)
  if (context === undefined) {
    throw new Error('useReader must be used within a ReaderProvider')
  }
  return context
}