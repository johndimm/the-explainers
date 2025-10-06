import { SinglePlayConfig } from './themeConfig'

export interface PlayText {
  title: string
  author: string
  url: string
  text: string
}

/**
 * Load the single play text from the public directory
 */
export async function loadSinglePlayText(config: SinglePlayConfig): Promise<PlayText> {
  try {
    console.log('🔍 Loading single play text:', config.playFilename)
    // Load text from public/public-domain-texts directory
    const response = await fetch(`/public-domain-texts/${config.playFilename}`)
    
    console.log('🔍 Fetch response status:', response.status)
    
    if (!response.ok) {
      throw new Error(`Failed to load play text: ${response.status} ${response.statusText}`)
    }
    
    const text = await response.text()
    console.log('🔍 Loaded text length:', text.length)
    
    return {
      title: config.playTitle,
      author: config.playAuthor,
      url: `/public-domain-texts/${config.playFilename}`,
      text: text
    }
  } catch (error) {
    console.error('Error loading single play text:', error)
    throw new Error(`Failed to load ${config.playTitle}: ${error}`)
  }
}

/**
 * Set the single play as the current book
 */
export async function setSinglePlayAsCurrentBook(config: SinglePlayConfig): Promise<void> {
  try {
    const playText = await loadSinglePlayText(config)
    
    // Save to current book storage
    const response = await fetch('/api/user/current-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: playText.title,
        author: playText.author,
        url: playText.url
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to set current book: ${response.status} ${response.statusText}`)
    }
    
    // Dispatch event to notify components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('currentBookChanged', {
        detail: {
          title: playText.title,
          author: playText.author,
          url: playText.url
        }
      }))
    }
  } catch (error) {
    console.error('Error setting single play as current book:', error)
    throw error
  }
}

/**
 * Get the single play text for the reader
 */
export async function getSinglePlayTextForReader(config: SinglePlayConfig): Promise<string> {
  const playText = await loadSinglePlayText(config)
  return playText.text
}