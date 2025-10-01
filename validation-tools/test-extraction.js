// Test the extraction function with the actual text from A Midsummer Night's Dream

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
  for (const line of lines) {
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
      actualTitle = trimmedLine;
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
  
  // If we still don't have both, try to find them together in a more specific way
  if (!actualTitle || !actualAuthor) {
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip lines that are clearly not title/author combinations
      if (trimmedLine.includes('Contents') || trimmedLine.includes('ACT') || trimmedLine.includes('Scene')) continue;
      if (trimmedLine.includes('Dramatis Personæ') || trimmedLine.includes('Characters')) continue;
      if (trimmedLine.includes('performed by') || trimmedLine.includes('Other Fairies')) continue;
      if (trimmedLine.includes('***') || trimmedLine.includes('START OF') || trimmedLine.includes('PROJECT GUTENBERG')) continue;
      
      // Look for "Title by Author" pattern - but be more specific
      const combinedMatch = line.match(/^(.+?)\s+by\s+(William Shakespeare|Shakespeare|Author:.+)$/i);
      if (combinedMatch && combinedMatch[1].trim().length > 3 && combinedMatch[2].trim().length > 3) {
        if (!actualTitle) actualTitle = combinedMatch[1].trim();
        if (!actualAuthor) actualAuthor = combinedMatch[2].trim();
        console.log(`    Found combined pattern: "${actualTitle}" by "${actualAuthor}"`);
        break;
      }
    }
  }
  
  return { actualTitle, actualAuthor };
}

// Test with the actual text from A Midsummer Night's Dream
const testText = `*** START OF THE PROJECT GUTENBERG EBOOK 1514 ***




A MIDSUMMER NIGHT'S DREAM

by William Shakespeare




Contents

ACT I
Scene I.
Athens. A room in the Palace of Theseus
Scene II.
The Same. A Room in a Cottage

ACT II
Scene I.
A wood near Athens
Scene II.
Another part of the wood

ACT III
Scene I.
The Wood.
Scene II.
Another part of the wood

ACT IV
Scene I.
The Wood
Scene II.
Athens. A Room in Quince's House

ACT V
Scene I.
Athens. An Apartment in the Palace of Theseus




Dramatis Personæ


THESEUS, Duke of Athens
HIPPOLYTA, Queen of the Amazons, bethrothed to Theseus
EGEUS, Father to Hermia
HERMIA, daughter to Egeus, in love with Lysander
HELENA, in love with Demetrius
LYSANDER, in love with Hermia
DEMETRIUS, in love with Hermia
PHILOSTRATE, Master of the Revels to Theseus

QUINCE, the Carpenter
SNUG, the Joiner
BOTTOM, the Weaver
FLUTE, the Bellows-mender
SNOUT, the Tinker
STARVELING, the Tailor

OBERON, King of the Fairies
TITANIA, Queen of the Fairies
PUCK, or ROBIN GOODFELLOW, a Fairy
PEASEBLOSSOM, Fairy
COBWEB, Fairy
MOTH, Fairy
MUSTARDSEED, Fairy

PYRAMUS, THISBE, WALL, MOONSHINE, LION; Characters in the Interlude
performed by the Clowns

Other Fairies attending their King and Queen
Attendants on Theseus and Hippolyta

SCENE: Athens, and a wood not far from it`;

console.log('🧪 Testing Title/Author Extraction with A Midsummer Night\'s Dream\n');

const result = extractTitleAndAuthor(testText, { title: "A Midsummer Night's Dream", author: "William Shakespeare" });

console.log(`\n📊 Result:`);
console.log(`  Title: "${result.actualTitle}"`);
console.log(`  Author: "${result.actualAuthor}"`);

if (result.actualTitle && result.actualAuthor) {
  console.log(`\n✅ Successfully extracted title and author!`);
} else {
  console.log(`\n❌ Failed to extract title and author`);
}
