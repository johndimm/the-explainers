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
  console.log('🔄 Updating english-literature.json with only successful downloads...\n');
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', 'english-literature.json');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: english-literature.json`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books to check\n`);
  
  const successfulBooks = [];
  const skippedBooks = [];
  const failedBooks = [];
  
  let processed = 0;
  
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    processed++;
    
    console.log(`[${processed}/${books.length}] Checking: "${book.title}" by ${book.author}`);
    
    const result = await testDownload(book);
    
    if (result.status === 'success') {
      successfulBooks.push(book);
      console.log(`  ✅ Keeping (successful download)`);
    } else if (result.status === 'skipped') {
      skippedBooks.push(book);
      console.log(`  ⏭️  Removing (${result.reason})`);
    } else {
      failedBooks.push(book);
      console.log(`  ❌ Removing (${result.reason})`);
    }
    
    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Show progress every 50 books
    if (processed % 50 === 0) {
      console.log(`\n📊 Progress: ${processed}/${books.length} (${Math.round((processed/books.length)*100)}%)`);
      console.log(`  ✅ Successful: ${successfulBooks.length}`);
      console.log(`  ⏭️  Skipped: ${skippedBooks.length}`);
      console.log(`  ❌ Failed: ${failedBooks.length}\n`);
    }
  }
  
  // Write the updated file with only successful books
  fs.writeFileSync(filePath, JSON.stringify(successfulBooks, null, 2));
  
  // Write removed books to separate files for reference
  fs.writeFileSync('removed-english-literature-skipped.json', JSON.stringify(skippedBooks, null, 2));
  fs.writeFileSync('removed-english-literature-failed.json', JSON.stringify(failedBooks, null, 2));
  
  console.log(`\n📊 UPDATE COMPLETE:`);
  console.log(`  📚 Original books: ${books.length}`);
  console.log(`  ✅ Kept books: ${successfulBooks.length}`);
  console.log(`  ⏭️  Removed (skipped): ${skippedBooks.length}`);
  console.log(`  ❌ Removed (failed): ${failedBooks.length}`);
  console.log(`  📈 Success rate: ${Math.round((successfulBooks.length / books.length) * 100)}%`);
  
  console.log(`\n📄 Updated english-literature.json with ${successfulBooks.length} books`);
  console.log(`📄 Skipped books saved to: removed-english-literature-skipped.json`);
  console.log(`📄 Failed books saved to: removed-english-literature-failed.json`);
  
  // Show some examples of removed books
  if (skippedBooks.length > 0) {
    console.log(`\n📋 Sample skipped books (${skippedBooks.length} total):`);
    skippedBooks.slice(0, 10).forEach((book, index) => {
      console.log(`  ${index + 1}. "${book.title}" by ${book.author} (ID: ${book.id})`);
    });
    if (skippedBooks.length > 10) {
      console.log(`  ... and ${skippedBooks.length - 10} more`);
    }
  }
  
  if (failedBooks.length > 0) {
    console.log(`\n📋 Failed downloads (${failedBooks.length} total):`);
    failedBooks.slice(0, 10).forEach((book, index) => {
      console.log(`  ${index + 1}. "${book.title}" by ${book.author} (ID: ${book.id})`);
    });
    if (failedBooks.length > 10) {
      console.log(`  ... and ${failedBooks.length - 10} more`);
    }
  }
}

main().catch(console.error);
