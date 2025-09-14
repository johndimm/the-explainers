import { log } from './log'

export interface CharacterMapEntry {
  offset: number
  act: string
  scene: string
  characters: string[]
}

export interface CharacterMapResult {
  entries: CharacterMapEntry[]
}

/**
 * Dynamic character map generator following the two-scan approach
 * Converts the Python/shell script approach to TypeScript for runtime use
 */
export class DynamicCharacterMapGenerator {
  private fullText: string
  private entries: CharacterMapEntry[] = []

  constructor(fullText: string) {
    this.fullText = fullText
  }

  /**
   * Generate character map using the two-scan approach
   */
  public generateCharacterMap(): CharacterMapResult {
    log('character-map', '🎭 Starting dynamic character map generation')
    
    // Scan 1: Extract structure lines (ACT, SCENE, Enter, Exit, Exeunt)
    const structureEntries = this.scanStructure()
    log('character-map', `📋 Scan 1: Found ${structureEntries.length} structure entries`)
    
    // Scan 2: Extract speaker names and generic exits
    const genericExits = this.scanGenericExits()
    log('character-map', `🎭 Scan 2: Found ${genericExits.length} generic exits`)
    
    // Combine and sort by offset
    const allEntries = [...structureEntries, ...genericExits]
    allEntries.sort((a, b) => a.offset - b.offset)
    
    // Process entries to build character map
    this.processEntries(allEntries)
    
    log('character-map', `✅ Generated character map with ${this.entries.length} entries`)
    return { entries: this.entries }
  }

  /**
   * Scan 1: Extract structure lines (ACT, SCENE, Enter, Exit, Exeunt)
   */
  private scanStructure(): Array<{offset: number, content: string, type: string}> {
    const entries: Array<{offset: number, content: string, type: string}> = []
    
    // Regex patterns for structural elements
    const patterns = {
      acts: /ACT [IV]+\./g,
      scenes: /SCENE [IV]+\./g,
      enters: /^\s*Enter/gm,
      exits: /_Exit /g,
      exeunts: /_Exeunt_/g
    }

    // Find all matches with their positions
    for (const [type, pattern] of Object.entries(patterns)) {
      let match
      while ((match = pattern.exec(this.fullText)) !== null) {
        entries.push({
          offset: match.index,
          content: match[0],
          type: type
        })
      }
    }

    return entries
  }

  /**
   * Scan 2: Extract speaker names and generic exits
   */
  private scanGenericExits(): Array<{offset: number, content: string, type: string}> {
    const entries: Array<{offset: number, content: string, type: string}> = []
    
    // Speaker pattern: lines ending with period (character names)
    const speakerPattern = /^[A-Z]{3,}\.\s*$/gm
    let match
    while ((match = speakerPattern.exec(this.fullText)) !== null) {
      entries.push({
        offset: match.index,
        content: match[0],
        type: 'speaker'
      })
    }

    // Generic exit pattern
    const exitPattern = /_Exit\._/g
    while ((match = exitPattern.exec(this.fullText)) !== null) {
      entries.push({
        offset: match.index,
        content: match[0],
        type: 'generic_exit'
      })
    }

    return entries
  }

  /**
   * Process all entries to build the character map
   */
  private processEntries(allEntries: Array<{offset: number, content: string, type: string}>): void {
    let currentAct = ''
    let currentScene = ''
    let currentCharacters: string[] = []
    let lastSpeaker = ''

    for (const entry of allEntries) {
      const { offset, content, type } = entry

      switch (type) {
        case 'acts':
          currentAct = content
          break

        case 'scenes':
          currentScene = content.split('.')[0]
          currentCharacters = [] // Reset characters at start of new scene
          break

        case 'enters':
          this.addCharacters(content, currentCharacters)
          this.addEntry(offset, currentAct, currentScene, [...currentCharacters])
          break

        case 'exits':
          this.removeCharacters(content, currentCharacters)
          this.addEntry(offset, currentAct, currentScene, [...currentCharacters])
          break

        case 'exeunts':
          currentCharacters = [] // All characters exit
          this.addEntry(offset, currentAct, currentScene, [])
          break

        case 'speaker':
          lastSpeaker = content.replace('.', '').trim()
          break

        case 'generic_exit':
          if (lastSpeaker) {
            // Create explicit exit for the last speaker
            this.removeCharacter(lastSpeaker, currentCharacters)
            this.addEntry(offset, currentAct, currentScene, [...currentCharacters])
          }
          break
      }
    }
  }

  /**
   * Add characters from an Enter line
   */
  private addCharacters(enterLine: string, characters: string[]): void {
    if (!enterLine.includes('Enter')) return

    const charString = enterLine.split('Enter')[1] || ''
    const charList = charString.split(/[,;]|with|and/).map(char => 
      char.trim().replace(/\.$/, '')
    ).filter(char => char && !characters.includes(char))

    characters.push(...charList)
  }

  /**
   * Remove characters from an Exit line
   */
  private removeCharacters(exitLine: string, characters: string[]): void {
    if (!exitLine.includes('Exit')) return

    // Extract character name from [_Exit Character._] format
    const match = exitLine.match(/\[_Exit\s+([^._]+)\._\]/)
    if (match) {
      const charName = match[1].trim()
      this.removeCharacter(charName, characters)
    }
  }

  /**
   * Remove a specific character (case-insensitive)
   */
  private removeCharacter(charName: string, characters: string[]): void {
    const index = characters.findIndex(char => 
      char.toLowerCase() === charName.toLowerCase()
    )
    if (index !== -1) {
      characters.splice(index, 1)
    }
  }

  /**
   * Add entry to character map if character state changed
   */
  private addEntry(offset: number, act: string, scene: string, characters: string[]): void {
    const lastEntry = this.entries[this.entries.length - 1]
    
    // Only add if character state actually changed
    if (!lastEntry || 
        JSON.stringify(lastEntry.characters.sort()) !== JSON.stringify(characters.sort())) {
      this.entries.push({
        offset,
        act,
        scene,
        characters: [...characters]
      })
    }
  }
}

/**
 * Generate character map for any Shakespeare play text
 */
export function generateCharacterMapForText(fullText: string): CharacterMapResult {
  const generator = new DynamicCharacterMapGenerator(fullText)
  return generator.generateCharacterMap()
}

/**
 * Log character map to console in readable format
 */
export function logCharacterMap(characterMap: CharacterMapResult): void {
  console.log('🎭 CHARACTER MAP GENERATED:')
  console.log('=' .repeat(80))
  
  characterMap.entries.forEach((entry, index) => {
    const charactersStr = entry.characters.length > 0 
      ? `[${entry.characters.join(', ')}]` 
      : '[]'
    console.log(`${entry.offset} ${entry.act} ${entry.scene} ${charactersStr}`)
  })
  
  console.log('=' .repeat(80))
  console.log(`Total entries: ${characterMap.entries.length}`)
}
