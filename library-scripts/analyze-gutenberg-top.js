#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Analyzing Gutenberg Top collection...\n');
  
  const gutenbergPath = path.join(process.cwd(), 'src', 'data', 'library', 'gutenberg-top.json');
  
  if (!fs.existsSync(gutenbergPath)) {
    console.log(`❌ File not found: gutenberg-top.json`);
    return;
  }
  
  const gutenbergContent = fs.readFileSync(gutenbergPath, 'utf8');
  const gutenbergBooks = JSON.parse(gutenbergContent);
  
  console.log(`📚 Total Gutenberg Top books: ${gutenbergBooks.length}\n`);
  
  // Analyze Wikipedia links
  const booksWithWiki = gutenbergBooks.filter(book => book.wikipediaUrl && book.wikipediaUrl.trim() !== '');
  const booksWithoutWiki = gutenbergBooks.filter(book => !book.wikipediaUrl || book.wikipediaUrl.trim() === '');
  
  console.log(`📊 WIKIPEDIA LINKS ANALYSIS:`);
  console.log(`  ✅ Books with Wikipedia links: ${booksWithWiki.length}`);
  console.log(`  ❌ Books without Wikipedia links: ${booksWithoutWiki.length}`);
  console.log(`  📈 Percentage with links: ${Math.round((booksWithWiki.length / gutenbergBooks.length) * 100)}%`);
  
  console.log(`\n📋 Books WITHOUT Wikipedia links:`);
  booksWithoutWiki.forEach((book, index) => {
    console.log(`  ${index + 1}. "${book.title}" by ${book.author}`);
  });
  
  if (booksWithoutWiki.length > 0) {
    console.log(`\n🔍 Let me try to find Wikipedia links for these books...`);
    
    // Try to find Wikipedia links for missing books
    const updatedBooks = [...gutenbergBooks];
    let foundLinks = 0;
    
    for (const book of booksWithoutWiki) {
      const possibleWikipediaUrls = [
        // Try different URL formats
        `https://en.wikipedia.org/wiki/${encodeURIComponent(book.title.replace(/[^\w\s]/g, '').replace(/\s+/g, '_'))}`,
        `https://en.wikipedia.org/wiki/${encodeURIComponent(book.author.replace(/[^\w\s]/g, '').replace(/\s+/g, '_'))}`,
        // Try with author and title
        `https://en.wikipedia.org/wiki/${encodeURIComponent(`${book.title}_(${book.author})`.replace(/[^\w\s]/g, '').replace(/\s+/g, '_'))}`
      ];
      
      // For now, let's just identify the books and suggest manual lookup
      console.log(`\n  📖 "${book.title}" by ${book.author}`);
      console.log(`     Suggested Wikipedia search: "${book.title}" OR "${book.author}"`);
    }
    
    console.log(`\n💡 RECOMMENDATION:`);
    console.log(`  ${booksWithoutWiki.length} books need Wikipedia links added manually`);
    console.log(`  These are well-known books that should have Wikipedia pages`);
    console.log(`  Consider adding the links or removing books without them`);
  } else {
    console.log(`  All books already have Wikipedia links! No cleanup needed.`);
  }
}

main().catch(console.error);
