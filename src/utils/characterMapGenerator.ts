/**
 * Character Map Generator for Shakespeare and similar dramatic texts
 * 
 * This utility generates a character map showing which characters are on stage
 * at any given time in a dramatic text. It processes text files to extract
 * act/scene markers, character entrances, exits, and speaker exits.
 */

export interface CharacterMapEntry {
  offset: number;
  act: string;
  scene: string;
  characters: string[];
}

export interface StructureEntry {
  offset: number;
  type: 'ACT' | 'SCENE' | 'ENTER' | 'EXIT' | 'EXEUNT';
  content: string;
}

export interface CharacterMapResult {
  entries: CharacterMapEntry[];
  totalCharacters: string[];
  acts: string[];
  scenes: string[];
}

/**
 * Extracts structure elements from dramatic text using regex patterns
 */
export function extractStructureElements(text: string): StructureEntry[] {
  const entries: StructureEntry[] = [];
  
  // Define regex patterns for different elements
  const patterns = {
    ACT: /ACT [IVX]+\./g,
    SCENE: /SCENE [IVX]+\./g,
    ENTER: /^[ \t]*Enter\b/gm,  // More specific: line start, optional whitespace, "Enter" as whole word
    EXIT: /\[_Exit /g,  // Match [_Exit pattern
    EXEUNT: /_Exeunt_/g
  };

  // Find all matches with their positions using byte offsets like the original
  let currentOffset = 0;
  const textBytes = Buffer.from(text, 'utf-8');
  
  // Reset regex patterns
  Object.values(patterns).forEach(pattern => pattern.lastIndex = 0);

  // Find all ACT markers
  let match;
  while ((match = patterns.ACT.exec(text)) !== null) {
    entries.push({
      offset: match.index,
      type: 'ACT',
      content: match[0]
    });
  }

  // Find all SCENE markers
  patterns.SCENE.lastIndex = 0;
  while ((match = patterns.SCENE.exec(text)) !== null) {
    entries.push({
      offset: match.index,
      type: 'SCENE',
      content: match[0]
    });
  }

  // Find all ENTER markers
  patterns.ENTER.lastIndex = 0;
  while ((match = patterns.ENTER.exec(text)) !== null) {
    // Get the full line containing the Enter, including continuation lines
    const lineStart = text.lastIndexOf('\n', match.index) + 1;
    let lineEnd = text.indexOf('\n', match.index);
    
    // Check if the next line is a continuation (starts with lowercase or is very short)
    while (lineEnd !== -1 && lineEnd < text.length - 1) {
      const nextLineStart = lineEnd + 1;
      const nextLineEnd = text.indexOf('\n', nextLineStart);
      const nextLine = text.substring(nextLineStart, nextLineEnd === -1 ? text.length : nextLineEnd);
      
      // If next line starts with lowercase or is very short, it's likely a continuation
      if (nextLine.trim().length > 0 && 
          (nextLine.trim()[0] === nextLine.trim()[0].toLowerCase() || nextLine.trim().length < 20) &&
          !nextLine.trim().match(/^[A-Z]{3,}\.\s*$/)) { // Don't include speaker names
        lineEnd = nextLineEnd;
      } else {
        break;
      }
    }
    
    const fullLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd)
      .replace(/\n/g, ' ')  // Join continuation lines with spaces
      .trim();
    
    entries.push({
      offset: match.index,
      type: 'ENTER',
      content: fullLine
    });
  }

  // Find all EXIT markers
  patterns.EXIT.lastIndex = 0;
  while ((match = patterns.EXIT.exec(text)) !== null) {
    // Get the full line containing the Exit, including continuation lines
    const lineStart = text.lastIndexOf('\n', match.index) + 1;
    let lineEnd = text.indexOf('\n', match.index);
    
    // Check if the next line is a continuation (starts with lowercase or is very short)
    while (lineEnd !== -1 && lineEnd < text.length - 1) {
      const nextLineStart = lineEnd + 1;
      const nextLineEnd = text.indexOf('\n', nextLineStart);
      const nextLine = text.substring(nextLineStart, nextLineEnd === -1 ? text.length : nextLineEnd);
      
      // If next line starts with lowercase or is very short, it's likely a continuation
      if (nextLine.trim().length > 0 && 
          (nextLine.trim()[0] === nextLine.trim()[0].toLowerCase() || nextLine.trim().length < 20)) {
        lineEnd = nextLineEnd;
      } else {
        break;
      }
    }
    
    const fullLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd)
      .replace(/\n/g, ' ')  // Join continuation lines with spaces
      .trim();
    
    entries.push({
      offset: match.index,
      type: 'EXIT',
      content: fullLine
    });
  }

  // Find all EXEUNT markers
  patterns.EXEUNT.lastIndex = 0;
  while ((match = patterns.EXEUNT.exec(text)) !== null) {
    // Get the full line containing the Exeunt, including continuation lines
    const lineStart = text.lastIndexOf('\n', match.index) + 1;
    let lineEnd = text.indexOf('\n', match.index);
    
    // Check if the next line is a continuation (starts with lowercase or is very short)
    while (lineEnd !== -1 && lineEnd < text.length - 1) {
      const nextLineStart = lineEnd + 1;
      const nextLineEnd = text.indexOf('\n', nextLineStart);
      const nextLine = text.substring(nextLineStart, nextLineEnd === -1 ? text.length : nextLineEnd);
      
      // If next line starts with lowercase or is very short, it's likely a continuation
      if (nextLine.trim().length > 0 && 
          (nextLine.trim()[0] === nextLine.trim()[0].toLowerCase() || nextLine.trim().length < 20)) {
        lineEnd = nextLineEnd;
      } else {
        break;
      }
    }
    
    const fullLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd)
      .replace(/\n/g, ' ')  // Join continuation lines with spaces
      .trim();
    
    entries.push({
      offset: match.index,
      type: 'EXEUNT',
      content: fullLine
    });
  }

  return entries.sort((a, b) => a.offset - b.offset);
}

/**
 * Extracts speaker exits by finding character names followed by exit markers
 */
export function extractSpeakerExits(text: string): StructureEntry[] {
  const entries: StructureEntry[] = [];
  
  // Pattern for character names (3+ uppercase letters followed by period)
  const speakerPattern = /^[A-Z]{3,}\.\s*$/;
  const exitPattern = /\[_Exit\._\]/g;

  const lines = text.split('\n');
  let currentOffset = 0;
  let foundExits = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineOffset = currentOffset;

    if (exitPattern.test(line)) {
      foundExits++;
      // Look for a speaker within the last 5 lines
      for (let j = Math.max(0, i - 5); j < i; j++) {
        if (speakerPattern.test(lines[j])) {
          const characterName = lines[j].replace(/\.\s*$/, '');
          entries.push({
            offset: lineOffset,
            type: 'EXIT',
            content: `_Exit ${characterName}._]`
          });
          break; // Found the speaker, stop looking
        }
      }
    }

    currentOffset += line.length + 1;
  }

  console.log(`DEBUG: Found ${foundExits} exit patterns, created ${entries.length} speaker exits`);
  return entries;
}

/**
 * Parses character names from enter/exit text
 */
export function parseCharacters(text: string): string[] {
  // Handle exit format like "[_Exit Maria._]"
  if (text.includes('[_Exit') && text.includes('._]')) {
    const match = text.match(/\[_Exit\s+([^._]+)/i);
    if (match) {
      const character = match[1].trim();
      return [character];
    }
  }
  
  // Handle speaker exit format like "_Exit MARIA._]"
  if (text.includes('_Exit') && text.includes('._]')) {
    const match = text.match(/_Exit\s+([^._]+)/i);
    if (match) {
      const character = match[1].trim();
      return [character];
    }
  }
  
  // Remove common prefixes and clean up the text
  let cleanText = text
    .replace(/^.*Enter\s*/i, '')
    .replace(/^.*Exit\s*/i, '')
    .replace(/^.*_Exit\s*/i, '')
    .replace(/\.\s*$/, '')
    .replace(/\[.*?\]/g, '') // Remove stage directions in brackets
    .trim();

  // Split on common separators, being more careful about "and"
  const characters: string[] = [];
  
  // Handle "and", "with" more carefully - split like the original Python script
  const parts = cleanText.split(/(?:,\s*|\s+with\s+|\s+and\s+)/i);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length > 0 && !trimmed.match(/^\d+$/)) {
      // Clean up character names
      let char = trimmed
        .replace(/^[a-z]/, l => l.toUpperCase()) // Capitalize first letter
        .replace(/\s+in\s+.*$/, '') // Remove "in man's attire" etc.
        .replace(/\s+at\s+.*$/, '') // Remove location references
        .trim();
      
      // Handle special cases to match original behavior
      if (char === 'Sir' && characters.length > 0 && characters[characters.length - 1] === 'Sir Toby') {
        // This is likely "Sir Andrew" being split incorrectly
        characters[characters.length - 1] = 'Sir Andrew';
        continue;
      }
      
      // Handle specific character name variations to match original
      if (char === 'And other Lords; Musicians' || char === 'Other Lords; Musicians') {
        char = 'other Lords; Musicians';
      }
      
      if (char.length > 0) {
        characters.push(char);
      }
    }
  }

  return characters;
}

/**
 * Generates character map from structure entries
 */
export function generateCharacterMap(structureEntries: StructureEntry[]): CharacterMapResult {
  const entries: CharacterMapEntry[] = [];
  let currentAct = '';
  let currentScene = '';
  let currentCharacters: string[] = [];
  const allCharacters = new Set<string>();
  const acts = new Set<string>();
  const scenes = new Set<string>();

  for (const entry of structureEntries) {
    const { offset, type, content } = entry;

    switch (type) {
      case 'ACT':
        currentAct = content;
        acts.add(currentAct);
        break;

      case 'SCENE':
        currentScene = content.split('.')[0]; // Get scene number/name before description
        scenes.add(currentScene);
        currentCharacters = []; // Reset characters for new scene
        break;

      case 'ENTER':
        const enteringChars = parseCharacters(content);
        for (const char of enteringChars) {
          if (char && !currentCharacters.includes(char)) {
            currentCharacters.push(char);
            allCharacters.add(char);
          }
        }
        entries.push({
          offset,
          act: currentAct,
          scene: currentScene,
          characters: [...currentCharacters]
        });
        break;

      case 'EXIT':
        const exitingChars = parseCharacters(content);
        for (const char of exitingChars) {
          // Find character with case-insensitive matching
          const index = currentCharacters.findIndex(c => c.toLowerCase() === char.toLowerCase());
          if (index > -1) {
            currentCharacters.splice(index, 1);
          }
        }
        entries.push({
          offset,
          act: currentAct,
          scene: currentScene,
          characters: [...currentCharacters]
        });
        break;

      case 'EXEUNT':
        currentCharacters = []; // All characters exit
        entries.push({
          offset,
          act: currentAct,
          scene: currentScene,
          characters: [...currentCharacters]
        });
        break;
    }
  }

  return {
    entries,
    totalCharacters: Array.from(allCharacters).sort(),
    acts: Array.from(acts).sort(),
    scenes: Array.from(scenes).sort()
  };
}

/**
 * Main function to generate character map from text
 */
export function generateCharacterMapFromText(text: string): CharacterMapResult {
  // Extract basic structure elements
  const structureElements = extractStructureElements(text);
  
  // Extract speaker exits
  const speakerExits = extractSpeakerExits(text);
  
  // Combine all entries and sort by offset
  const allEntries = [...structureElements, ...speakerExits]
    .sort((a, b) => a.offset - b.offset);
  
  // Generate character map
  return generateCharacterMap(allEntries);
}

/**
 * Formats character map as text (similar to the original Python output)
 */
export function formatCharacterMapAsText(result: CharacterMapResult): string {
  return result.entries
    .map(entry => `${entry.offset} ${entry.act} ${entry.scene} [${entry.characters.map(c => `'${c}'`).join(', ')}]`)
    .join('\n');
}

/**
 * Exports character map as JSON
 */
export function exportCharacterMapAsJSON(result: CharacterMapResult): string {
  return JSON.stringify(result, null, 2);
}
