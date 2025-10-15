export interface ContextInfo {
  selectedText: string
  bookTitle?: string
  author?: string
  act?: string
  scene?: string
  speaker?: string
  characters?: string[]
  fullSpeech?: string
  contextBefore?: string
  contextAfter?: string
}

const normalizeText = (text: string): string => {
  return text
    .replace(/[\u2018\u2019]/g, "'")  // Smart quotes to regular quotes
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes to regular quotes
    .replace(/[\u2013\u2014]/g, '-')  // En/em dashes to hyphens
    .replace(/\r\n/g, '\n')          // Windows line breaks to Unix
    .trim()
}

const extractContextFromIndex = (
  selectedIndex: number,
  selectedLength: number,
  fullText: string,
  bookTitle?: string,
  author?: string
): ContextInfo | null => {
  if (selectedIndex === -1) return null

  const contextBefore = fullText.substring(Math.max(0, selectedIndex - 300), selectedIndex)
  const contextAfter = fullText.substring(
    selectedIndex + selectedLength, 
    Math.min(fullText.length, selectedIndex + selectedLength + 100)
  )

  // Try to extract act/scene information
  let act: string | undefined
  let scene: string | undefined
  let speaker: string | undefined
  let characters: string[] = []

  // Look for Act/Scene patterns
  const actSceneMatch = contextBefore.match(/(?:ACT\s+([IVX]+)|Scene\s+([IVX]+))/gi)
  if (actSceneMatch) {
    const lastMatch = actSceneMatch[actSceneMatch.length - 1]
    if (lastMatch.toLowerCase().includes('act')) {
      act = lastMatch.replace(/act\s+/i, '').trim()
    }
    if (lastMatch.toLowerCase().includes('scene')) {
      scene = lastMatch.replace(/scene\s+/i, '').trim()
    }
  }

  // Look for speaker patterns (CHARACTER_NAME: or CHARACTER_NAME.)
  const speakerMatch = contextBefore.match(/([A-Z][A-Z\s]+)[:.]/g)
  if (speakerMatch) {
    speaker = speakerMatch[speakerMatch.length - 1].replace(/[:.]/g, '').trim()
  }

  // Extract full speech if possible
  let fullSpeech: string | undefined
  if (speaker) {
    const speechStart = contextBefore.lastIndexOf(speaker + ':') || contextBefore.lastIndexOf(speaker + '.')
    if (speechStart !== -1) {
      const speechEnd = contextAfter.indexOf('\n')
      if (speechEnd !== -1) {
        fullSpeech = fullText.substring(speechStart, selectedIndex + selectedLength + speechEnd)
      }
    }
  }

  return {
    selectedText: fullText.substring(selectedIndex, selectedIndex + selectedLength),
    bookTitle,
    author,
    act,
    scene,
    speaker,
    characters,
    fullSpeech,
    contextBefore,
    contextAfter
  }
}

export const extractContextInfo = (
  selectedText: string, 
  fullText: string, 
  bookTitle?: string, 
  author?: string
): ContextInfo | null => {
  // Normalize line breaks in selected text to match stored text format
  const normalizedSelectedText = selectedText.replace(/\n/g, '\r\n')
  
  // Try to find the selected text in the original text
  let selectedIndex = fullText.indexOf(selectedText)
  let normalizedIndex = fullText.indexOf(normalizedSelectedText)
  
  // Use the normalized version if it's found
  if (normalizedIndex !== -1) {
    selectedIndex = normalizedIndex
  }
  
  if (selectedIndex === -1) {
    // Try with normalized text
    const normalizedSelectedText2 = normalizeText(selectedText)
    const normalizedFullText = normalizeText(fullText)
    
    selectedIndex = normalizedFullText.indexOf(normalizedSelectedText2)
    
    if (selectedIndex === -1) {
      // Try flexible search with first few words
      const words = normalizedSelectedText2.split(/\s+/)
      if (words.length > 0) {
        const searchText = words.slice(0, Math.min(3, words.length)).join(' ')
        const flexibleIndex = normalizedFullText.indexOf(searchText)
        if (flexibleIndex !== -1) {
          const originalIndex = fullText.indexOf(searchText)
          if (originalIndex !== -1) {
            return extractContextFromIndex(originalIndex, selectedText.length, fullText, bookTitle, author)
          }
        }
      }
      return null
    }
    
    // Convert back to original text index if we used normalized text
    const originalIndex = fullText.indexOf(normalizedSelectedText2)
    if (originalIndex !== -1) {
      selectedIndex = originalIndex
    }
  }

  return extractContextFromIndex(selectedIndex, selectedText.length, fullText, bookTitle, author)
}

export const getCharactersOnStageAtPosition = (position: number, fullText: string): string[] => {
  // Simple character detection - look for character names in the context
  const contextBefore = fullText.substring(Math.max(0, position - 500), position)
  const characters: string[] = []
  
  // Look for character name patterns
  const characterMatches = contextBefore.match(/([A-Z][A-Z\s]{2,})[:.]/g)
  if (characterMatches) {
    characterMatches.forEach(match => {
      const name = match.replace(/[:.]/g, '').trim()
      if (name.length > 2 && !characters.includes(name)) {
        characters.push(name)
      }
    })
  }
  
  return characters.slice(-5) // Return last 5 characters found
}
