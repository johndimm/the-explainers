#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Filtering Shakespeare to keep only authentic works...\n');
  
  const englishLitPath = path.join(process.cwd(), 'src', 'data', 'library', 'english-literature.json');
  
  if (!fs.existsSync(englishLitPath)) {
    console.log(`❌ File not found: english-literature.json`);
    return;
  }
  
  const englishLitContent = fs.readFileSync(englishLitPath, 'utf8');
  const englishLitBooks = JSON.parse(englishLitContent);
  
  console.log(`📖 Current English Literature: ${englishLitBooks.length} books\n`);
  
  // Separate Shakespeare works from others
  const shakespeareWorks = englishLitBooks.filter(book => 
    book.author && (
      book.author.includes('Shakespeare, William, 1564-1616') ||
      book.author.includes('Shakespeare (spurious and doubtful works), 1564-1616')
    )
  );
  
  const nonShakespeareBooks = englishLitBooks.filter(book => 
    !book.author || (
      !book.author.includes('Shakespeare, William, 1564-1616') &&
      !book.author.includes('Shakespeare (spurious and doubtful works), 1564-1616')
    )
  );
  
  console.log(`🎭 Total Shakespeare-related works found: ${shakespeareWorks.length}`);
  
  // Filter to keep only authentic Shakespeare works
  const authenticShakespeare = shakespeareWorks.filter(book => {
    // Keep only works by "Shakespeare, William, 1564-1616" (authentic works)
    if (book.author.includes('Shakespeare, William, 1564-1616')) {
      // Also exclude retellings and adaptations
      if (book.title.toLowerCase().includes('beautiful stories from shakespeare') ||
          book.title.toLowerCase().includes('tales from shakespeare') ||
          book.title.toLowerCase().includes('stories from shakespeare')) {
        return false;
      }
      return true;
    }
    return false; // Exclude spurious and doubtful works
  });
  
  const removedShakespeare = shakespeareWorks.filter(book => !authenticShakespeare.includes(book));
  
  console.log(`✅ Authentic Shakespeare works: ${authenticShakespeare.length}`);
  console.log(`🗑️ Removed spurious/related works: ${removedShakespeare.length}`);
  
  // Combine non-Shakespeare books with authentic Shakespeare works
  const updatedBooks = [...nonShakespeareBooks, ...authenticShakespeare];
  
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
  
  // Write removed works to a separate file for reference
  fs.writeFileSync('removed-shakespeare-spurious.json', JSON.stringify(removedShakespeare, null, 2));
  
  const removed = englishLitBooks.length - updatedBooks.length;
  
  console.log(`\n📊 FILTERING COMPLETE:`);
  console.log(`  📚 Original English Literature: ${englishLitBooks.length} books`);
  console.log(`  ✅ Authentic Shakespeare works kept: ${authenticShakespeare.length}`);
  console.log(`  🗑️ Spurious/related works removed: ${removed}`);
  console.log(`  📚 Total books now: ${updatedBooks.length}`);
  console.log(`  📈 Reduction: ${Math.round((removed / englishLitBooks.length) * 100)}%`);
  
  console.log(`\n📄 Updated english-literature.json with ${updatedBooks.length} books`);
  console.log(`📄 Removed works saved to: removed-shakespeare-spurious.json`);
  
  // Show authentic Shakespeare works
  console.log(`\n✅ Authentic Shakespeare works:`);
  authenticShakespeare.forEach((book, index) => {
    console.log(`  ${index + 1}. ${book.title}`);
  });
  
  // Show removed works
  console.log(`\n🗑️ Removed spurious/related works:`);
  removedShakespeare.forEach((book, index) => {
    console.log(`  ${index + 1}. ${book.title} (${book.author})`);
  });
}

main().catch(console.error);
