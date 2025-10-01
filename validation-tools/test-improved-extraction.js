// Test the improved title/author extraction

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
  
  // Look for "The Project Gutenberg eBook of [Title]" pattern
  const pgEbookMatch = text.match(/The Project Gutenberg eBook of\s*(.+?)(?:\n|$)/i);
  if (pgEbookMatch) {
    actualTitle = pgEbookMatch[1].trim();
    console.log(`    Found PG eBook pattern: "${actualTitle}"`);
    // Continue to find author
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
    if (trimmedLine.includes('This ebook is for the use of anyone') || trimmedLine.includes('This eBook is for the use of anyone')) continue;
    if (trimmedLine.includes('The Project Gutenberg eBook of')) continue; // Skip this pattern, we handle it above
    
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
        !trimmedLine.includes('by') && !trimmedLine.includes(':') &&
        !trimmedLine.includes('ebook') && !trimmedLine.includes('Ebook')) {
      
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
            !nextLine.includes('Scene') && !nextLine.includes('Dramatis Personæ') &&
            !nextLine.includes('ebook') && !nextLine.includes('Ebook')) {
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
    
    // Look for "by Author" pattern - be more specific
    const byMatch = line.match(/by\s+(.+)/i);
    if (byMatch && byMatch[1].trim().length > 3 && 
        !byMatch[1].includes('Project Gutenberg') && 
        !byMatch[1].includes('ebook') && 
        !byMatch[1].includes('Ebook') &&
        !byMatch[1].includes('United States') &&
        !byMatch[1].includes('anyone anywhere')) {
      actualAuthor = byMatch[1].trim();
      console.log(`    Found by pattern: "${actualAuthor}"`);
      break;
    }
  }
  
  return { actualTitle, actualAuthor };
}

// Test with a typical Project Gutenberg text
const testText = `*** START OF THE PROJECT GUTENBERG EBOOK 1342 ***




The Project Gutenberg eBook of Pride and Prejudice

This ebook is for the use of anyone anywhere in the United States and
most other parts of the world at no cost and with almost no restrictions
whatsoever. You may copy it, give it away or re-use it under the terms
of the Project Gutenberg License included with this ebook or online at
www.gutenberg.org. If you are not located in the United States, you
will have to check the laws of the country where you are located before
using this eBook.

Title: Pride and Prejudice

Author: Jane Austen

Release date: June 1, 1998 [eBook #1342]
Most recently updated: October 29, 2024

Language: English

*** START OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE ***

PRIDE AND PREJUDICE

by Jane Austen

Chapter 1

It is a truth universally acknowledged, that a single man in possession
of a good fortune, must be in want of a wife.`;

console.log('🧪 Testing Improved Title/Author Extraction\n');

const result = extractTitleAndAuthor(testText, { title: "Pride and Prejudice", author: "Jane Austen" });

console.log(`\n📊 Result:`);
console.log(`  Title: "${result.actualTitle}"`);
console.log(`  Author: "${result.actualAuthor}"`);

if (result.actualTitle && result.actualAuthor) {
  console.log(`\n✅ Successfully extracted title and author!`);
} else {
  console.log(`\n❌ Failed to extract title and author`);
}
