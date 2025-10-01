#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Analyzing Italian Literature collection...\n');
  
  const italianLitPath = path.join(process.cwd(), 'src', 'data', 'library', 'italian-literature.json');
  
  if (!fs.existsSync(italianLitPath)) {
    console.log(`❌ File not found: italian-literature.json`);
    return;
  }
  
  const italianLitContent = fs.readFileSync(italianLitPath, 'utf8');
  const italianBooks = JSON.parse(italianLitContent);
  
  console.log(`📚 Total Italian Literature books: ${italianBooks.length}\n`);
  
  // Analyze Wikipedia links
  const booksWithWiki = italianBooks.filter(book => book.wikipediaUrl && book.wikipediaUrl.trim() !== '');
  const booksWithoutWiki = italianBooks.filter(book => !book.wikipediaUrl || book.wikipediaUrl.trim() === '');
  
  console.log(`📊 WIKIPEDIA LINKS ANALYSIS:`);
  console.log(`  ✅ Books with Wikipedia links: ${booksWithWiki.length}`);
  console.log(`  ❌ Books without Wikipedia links: ${booksWithoutWiki.length}`);
  console.log(`  📈 Percentage with links: ${Math.round((booksWithWiki.length / italianBooks.length) * 100)}%`);
  
  console.log(`\n📋 Books WITHOUT Wikipedia links:`);
  booksWithoutWiki.forEach((book, index) => {
    console.log(`  ${index + 1}. "${book.title}" by ${book.author}`);
  });
  
  console.log(`\n🔧 RECOMMENDATION:`);
  if (booksWithoutWiki.length > 0) {
    console.log(`  Remove ${booksWithoutWiki.length} books without Wikipedia links`);
    console.log(`  Keep ${booksWithWiki.length} books with Wikipedia links`);
    console.log(`  This will improve the quality of the collection`);
    
    // Create cleaned version
    const cleanedBooks = booksWithWiki;
    
    // Sort by author, then by title
    cleanedBooks.sort((a, b) => {
      const authorA = a.author || '';
      const authorB = b.author || '';
      
      const authorCompare = authorA.localeCompare(authorB);
      if (authorCompare !== 0) return authorCompare;
      
      return a.title.localeCompare(b.title);
    });
    
    // Write cleaned version
    fs.writeFileSync(italianLitPath, JSON.stringify(cleanedBooks, null, 2));
    
    console.log(`\n✅ CLEANUP COMPLETE:`);
    console.log(`  📚 Original books: ${italianBooks.length}`);
    console.log(`  ✅ Books kept: ${cleanedBooks.length}`);
    console.log(`  🗑️ Books removed: ${booksWithoutWiki.length}`);
    console.log(`  📈 Reduction: ${Math.round((booksWithoutWiki.length / italianBooks.length) * 100)}%`);
    
    console.log(`\n📄 Updated italian-literature.json with ${cleanedBooks.length} books`);
    
    // Show some examples of kept books
    console.log(`\n✅ Examples of kept books with Wikipedia links:`);
    cleanedBooks.slice(0, 15).forEach((book, index) => {
      console.log(`  ${index + 1}. "${book.title}" by ${book.author}`);
    });
    
    if (cleanedBooks.length > 15) {
      console.log(`  ... and ${cleanedBooks.length - 15} more`);
    }
  } else {
    console.log(`  All books already have Wikipedia links! No cleanup needed.`);
  }
}

main().catch(console.error);
