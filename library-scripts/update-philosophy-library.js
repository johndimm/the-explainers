#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to test if a book can be downloaded (same logic as the check script)
async function testDownload(book) {
  // Skip books that don't have numeric IDs (special cases)
  if (!book.id || isNaN(book.id) || book.localPath || book.directUrl) {
    return { status: 'skipped', reason: 'Non-Gutenberg or special case' };
  }

  // Try both URL formats
  const urls = [
    `https://www.gutenberg.org/files/${book.id}/${book.id}-0.txt`,
    `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`
  ];
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        return { status: 'success', url: url };
      } else if (response.status === 404) {
        continue; // Try next format
      } else {
        continue; // Try next format
      }
    } catch (error) {
      continue; // Try next format
    }
  }
  
  return { status: 'failed', reason: 'Both URL formats failed' };
}

// Main function
async function main() {
  console.log('🔄 Updating philosophers.json with only successful downloads...\n');
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', 'philosophers.json');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: philosophers.json`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books to check\n`);
  
  const successfulBooks = [];
  const skippedBooks = [];
  
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`[${i + 1}/${books.length}] Checking: "${book.title}" by ${book.author}`);
    
    const result = await testDownload(book);
    
    if (result.status === 'success') {
      successfulBooks.push(book);
      console.log(`  ✅ Keeping (successful download)`);
    } else {
      skippedBooks.push(book);
      console.log(`  ⏭️  Removing (${result.reason})`);
    }
    
    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Write the updated file with only successful books
  fs.writeFileSync(filePath, JSON.stringify(successfulBooks, null, 2));
  
  // Write removed books to a separate file for reference
  fs.writeFileSync('removed-philosophy-books.json', JSON.stringify(skippedBooks, null, 2));
  
  console.log(`\n📊 UPDATE COMPLETE:`);
  console.log(`  📚 Original books: ${books.length}`);
  console.log(`  ✅ Kept books: ${successfulBooks.length}`);
  console.log(`  ⏭️  Removed books: ${skippedBooks.length}`);
  console.log(`  📈 Success rate: ${Math.round((successfulBooks.length / books.length) * 100)}%`);
  
  console.log(`\n📄 Updated philosophers.json with ${successfulBooks.length} books`);
  console.log(`📄 Removed books saved to: removed-philosophy-books.json`);
  
  if (skippedBooks.length > 0) {
    console.log(`\n📋 Removed books:`);
    skippedBooks.forEach((book, index) => {
      console.log(`  ${index + 1}. "${book.title}" by ${book.author} (ID: ${book.id})`);
    });
  }
}

main().catch(console.error);
