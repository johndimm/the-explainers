#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Restoring all Plato works to English Literature...\n');
  
  const englishLitPath = path.join(process.cwd(), 'src', 'data', 'library', 'english-literature.json');
  const allBooksPath = path.join(process.cwd(), 'src', 'data', 'library', 'all-books.json');
  
  if (!fs.existsSync(englishLitPath)) {
    console.log(`❌ File not found: english-literature.json`);
    return;
  }
  
  if (!fs.existsSync(allBooksPath)) {
    console.log(`❌ File not found: all-books.json`);
    return;
  }
  
  const englishLitContent = fs.readFileSync(englishLitPath, 'utf8');
  const englishLitBooks = JSON.parse(englishLitContent);
  
  const allBooksContent = fs.readFileSync(allBooksPath, 'utf8');
  const allBooks = JSON.parse(allBooksContent);
  
  console.log(`📖 Current English Literature: ${englishLitBooks.length} books`);
  console.log(`📚 All books source: ${allBooks.length} books\n`);
  
  // Find all Plato works from all-books.json
  const allPlatoWorks = allBooks.filter(book => 
    book.author && (
      book.author.toLowerCase().includes('plato') ||
      book.author.toLowerCase().includes('platon')
    )
  );
  
  console.log(`🏛️ Found ${allPlatoWorks.length} Plato works in all-books.json`);
  
  // Remove current Plato works from english-literature.json
  const nonPlatoBooks = englishLitBooks.filter(book => 
    !book.author || !book.author.toLowerCase().includes('plato')
  );
  
  console.log(`📚 Current Plato works in English Literature: ${englishLitBooks.length - nonPlatoBooks.length}`);
  
  // Combine non-Plato books with all Plato works
  const updatedBooks = [...nonPlatoBooks, ...allPlatoWorks];
  
  // Sort by author name, then by title
  updatedBooks.sort((a, b) => {
    const authorA = a.author || '';
    const authorB = b.author || '';
    
    const authorCompare = authorA.localeCompare(authorB);
    if (authorCompare !== 0) return authorCompare;
    
    return a.title.localeCompare(b.title);
  });
  
  // Write the updated file
  fs.writeFileSync(englishLitPath, JSON.stringify(updatedBooks, null, 2));
  
  const added = allPlatoWorks.length - (englishLitBooks.length - nonPlatoBooks.length);
  
  console.log(`\n📊 RESTORATION COMPLETE:`);
  console.log(`  📚 Original English Literature: ${englishLitBooks.length} books`);
  console.log(`  🏛️ Plato works added: ${allPlatoWorks.length}`);
  console.log(`  📚 Total books now: ${updatedBooks.length}`);
  console.log(`  ➕ Net addition: ${added} Plato works`);
  
  console.log(`\n📄 Updated english-literature.json with ${updatedBooks.length} books`);
  
  // Show some examples of restored Plato works
  console.log(`\n🏛️ Examples of restored Plato works:`);
  allPlatoWorks.slice(0, 15).forEach((book, index) => {
    console.log(`  ${index + 1}. ${book.title}`);
  });
  
  if (allPlatoWorks.length > 15) {
    console.log(`  ... and ${allPlatoWorks.length - 15} more`);
  }
}

main().catch(console.error);
