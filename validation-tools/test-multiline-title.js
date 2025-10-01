// Test multi-line title extraction

function extractTitleAndAuthor(text, book) {
  let actualTitle = '';
  let actualAuthor = '';
  
  // Look for Project Gutenberg header pattern first
  const headerMatch = text.match(/THE PROJECT GUTENBERG EBOOK OF\s*(.+?)\s*by\s*(.+?)(?:\n|$)/i);
  if (headerMatch) {
    actualTitle = headerMatch[1].trim();
    actualAuthor = headerMatch[2].trim();
    console.log(`    Found PG header: "${actualTitle}" by "${actualAuthor}"`);
    return { actualTitle, actualAuthor };
  }
  
  // Look in the first 50 lines for title and author (more focused search)
  const lines = text.split('\n').slice(0, 50);
  
  // Try to find title patterns - look for standalone titles
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines and lines that are clearly not titles
    if (!trimmedLine || trimmedLine.length < 3) continue;
    if (trimmedLine.includes('Contents') || trimmedLine.includes('ACT') || trimmedLine.includes('Scene')) continue;
    if (trimmedLine.includes('Dramatis Personæ') || trimmedLine.includes('Characters')) continue;
    if (trimmedLine.includes('performed by') || trimmedLine.includes('Other Fairies')) continue;
    if (trimmedLine.includes('***') || trimmedLine.includes('START OF') || trimmedLine.includes('PROJECT GUTENBERG')) continue;
    
    // Look for "Title:" pattern
    const titleMatch = line.match(/Title:\s*(.+)/i);
    if (titleMatch && titleMatch[1].trim().length > 3) {
      actualTitle = titleMatch[1].trim();
      console.log(`    Found title pattern: "${actualTitle}"`);
      break;
    }
    
    // Look for standalone title (all caps or title case, not too long)
    if (trimmedLine.length > 5 && trimmedLine.length < 100 && 
        (trimmedLine === trimmedLine.toUpperCase() || 
         /^[A-Z][a-z].*/.test(trimmedLine)) &&
        !trimmedLine.includes('by') && !trimmedLine.includes(':')) {
      
      // Check if this might be a multi-line title
      let fullTitle = trimmedLine;
      
      // Look at the next few lines to see if the title continues
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        
        // If next line is empty, stop looking
        if (!nextLine) break;
        
        // If next line looks like it continues the title (all caps, reasonable length)
        if (nextLine.length > 2 && nextLine.length < 100 && 
            nextLine === nextLine.toUpperCase() &&
            !nextLine.includes('by') && !nextLine.includes(':') &&
            !nextLine.includes('Contents') && !nextLine.includes('ACT') &&
            !nextLine.includes('Scene') && !nextLine.includes('Dramatis Personæ')) {
          fullTitle += ' ' + nextLine;
        } else {
          break;
        }
      }
      
      actualTitle = fullTitle;
      console.log(`    Found standalone title: "${actualTitle}"`);
      break;
    }
  }
  
  // Try to find author patterns
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Look for "Author:" pattern
    const authorMatch = line.match(/Author:\s*(.+)/i);
    if (authorMatch && authorMatch[1].trim().length > 3) {
      actualAuthor = authorMatch[1].trim();
      console.log(`    Found author pattern: "${actualAuthor}"`);
      break;
    }
    
    // Look for "by Author" pattern
    const byMatch = line.match(/by\s+(.+)/i);
    if (byMatch && byMatch[1].trim().length > 3 && 
        (byMatch[1].includes('Shakespeare') || byMatch[1].includes('Author'))) {
      actualAuthor = byMatch[1].trim();
      console.log(`    Found by pattern: "${actualAuthor}"`);
      break;
    }
  }
  
  return { actualTitle, actualAuthor };
}

// Test with Julius Caesar example
const testText = `*** START OF THE PROJECT GUTENBERG EBOOK 1522 ***




THE TRAGEDY OF
JULIUS CAESAR

by William Shakespeare




Contents

ACT I
Scene I.
Rome. A street.
Scene II.
The Same. A public place.
Scene III.
The Same. A street.

ACT II
Scene I.
Rome. Brutus's orchard.
Scene II.
A room in Caesar's palace.
Scene III.
A street near the Capitol.
Scene IV.
Another part of the same street, before the house of Brutus.

ACT III
Scene I.
Rome. Before the Capitol; the Senate sitting above.
Scene II.
The Forum.
Scene III.
A street.

ACT IV
Scene I.
A house in Rome.
Scene II.
Camp near Sardis. Before Brutus's tent.
Scene III.
Brutus's tent.

ACT V
Scene I.
The plains of Philippi.
Scene II.
The same. The field of battle.
Scene III.
The same. Another part of the field.

Dramatis Personæ

JULIUS CAESAR
OCTAVIUS CAESAR, triumvir after the death of Julius Caesar
MARCUS ANTONIUS, triumvir after the death of Julius Caesar
M. AEMILIUS LEPIDUS, triumvir after the death of Julius Caesar
CICERO, senator
PUBLIUS, senator
POPILIUS LENA, senator
MARCUS BRUTUS, conspirator against Julius Caesar
CASSIUS, conspirator against Julius Caesar
CASCA, conspirator against Julius Caesar
TREBONIUS, conspirator against Julius Caesar
LIGARIUS, conspirator against Julius Caesar
DECIUS BRUTUS, conspirator against Julius Caesar
METELLUS CIMBER, conspirator against Julius Caesar
CINNA, conspirator against Julius Caesar
FLAVIUS, tribune
MARULLUS, tribune
ARTEMIDORUS, a teacher of rhetoric
A Soothsayer
CINNA, a poet
Another Poet
LUCILIUS, friend to Brutus and Cassius
TITINIUS, friend to Brutus and Cassius
MESSALA, friend to Brutus and Cassius
YOUNG CATO, friend to Brutus and Cassius
VOLUMNIUS, friend to Brutus and Cassius
VARRO, servant to Brutus
CLITUS, servant to Brutus
CLAUDIUS, servant to Brutus
STRATO, servant to Brutus
LUCIUS, servant to Brutus
DARDANIUS, servant to Brutus
PINDARUS, servant to Cassius
CALPURNIA, wife to Caesar
PORTIA, wife to Brutus

Senators, Citizens, Guards, Attendants, etc.

SCENE: Rome, the conspirators' camp near Sardis, and the plains of Philippi.`;

console.log('🧪 Testing Multi-line Title Extraction with Julius Caesar\n');

const result = extractTitleAndAuthor(testText, { title: "Julius Caesar", author: "William Shakespeare" });

console.log(`\n📊 Result:`);
console.log(`  Title: "${result.actualTitle}"`);
console.log(`  Author: "${result.actualAuthor}"`);

if (result.actualTitle && result.actualAuthor) {
  console.log(`\n✅ Successfully extracted title and author!`);
  
  // Test the matching
  const normalize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const normExpected = normalize("Julius Caesar");
  const normActual = normalize(result.actualTitle);
  
  console.log(`\n🔍 Title matching test:`);
  console.log(`  Expected: "Julius Caesar" -> "${normExpected}"`);
  console.log(`  Actual:   "${result.actualTitle}" -> "${normActual}"`);
  console.log(`  Match: ${normActual.includes(normExpected) ? '✅' : '❌'}`);
} else {
  console.log(`\n❌ Failed to extract title and author`);
}
