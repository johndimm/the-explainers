#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Restoring all Shakespeare works to English Literature...\n');
  
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
  
  // Find all Shakespeare works from all-books.json
  const allShakespeareWorks = allBooks.filter(book => 
    book.author && (
      book.author.includes('Shakespeare, William, 1564-1616') ||
      book.author.includes('Shakespeare (spurious and doubtful works), 1564-1616')
    )
  );
  
  console.log(`🎭 Found ${allShakespeareWorks.length} Shakespeare works in all-books.json`);
  
  // Remove current Shakespeare works from english-literature.json
  const nonShakespeareBooks = englishLitBooks.filter(book => 
    !book.author || (
      !book.author.includes('Shakespeare, William, 1564-1616') &&
      !book.author.includes('Shakespeare (spurious and doubtful works), 1564-1616')
    )
  );
  
  console.log(`📚 Current Shakespeare works in English Literature: ${englishLitBooks.length - nonShakespeareBooks.length}`);
  
  // Combine non-Shakespeare books with all Shakespeare works
  const updatedBooks = [...nonShakespeareBooks, ...allShakespeareWorks];
  
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
  
  const added = allShakespeareWorks.length - (englishLitBooks.length - nonShakespeareBooks.length);
  
  console.log(`\n📊 RESTORATION COMPLETE:`);
  console.log(`  📚 Original English Literature: ${englishLitBooks.length} books`);
  console.log(`  🎭 Shakespeare works added: ${allShakespeareWorks.length}`);
  console.log(`  📚 Total books now: ${updatedBooks.length}`);
  console.log(`  ➕ Net addition: ${added} Shakespeare works`);
  
  console.log(`\n📄 Updated english-literature.json with ${updatedBooks.length} books`);
  
  // Show some examples of restored Shakespeare works
  console.log(`\n🎭 Examples of restored Shakespeare works:`);
  allShakespeareWorks.slice(0, 15).forEach((book, index) => {
    console.log(`  ${index + 1}. ${book.title}`);
  });
  
  if (allShakespeareWorks.length > 15) {
    console.log(`  ... and ${allShakespeareWorks.length - 15} more`);
  }
}

main().catch(console.error);
