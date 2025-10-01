const fs = require('fs');
const path = require('path');

async function validateBook(book) {
  if (!book.id || !book.title || !book.author) {
    return { isValid: false, reason: 'Missing required fields' };
  }

  console.log(`\n🔍 Testing: "${book.title}" by ${book.author} (ID: ${book.id})`);

  // Try different URL formats
  const urls = [
    `https://www.gutenberg.org/files/${book.id}/${book.id}-0.txt`,
    `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`,
    `https://www.gutenberg.org/cache/epub/${book.id}/${book.id}-0.txt`
  ];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`  Trying URL ${i + 1}: ${url}`);
    
    try {
      const response = await fetch(url);
      console.log(`    Response status: ${response.status}`);
      
      if (!response.ok) {
        console.log(`    ❌ HTTP ${response.status}`);
        continue;
      }
      
      const text = await response.text();
      
      // Check if we got HTML (404 page) instead of text
      if (text.includes('<html') || text.includes('<!DOCTYPE html')) {
        console.log(`    ❌ Got HTML instead of text`);
        continue;
      }
      
      console.log(`    ✅ Got text content (${text.length} characters)`);
      
      // Debug: show first few lines
      const firstLines = text.split('\n').slice(0, 10).join('\n');
      console.log(`    First 10 lines:\n${firstLines}`);
      
      // Extract title and author from the text
      const titleMatch = text.match(/Title:\s*(.+?)(?:\n|$)/i);
      const authorMatch = text.match(/Author:\s*(.+?)(?:\n|$)/i);
      
      console.log(`    Title regex match:`, titleMatch);
      console.log(`    Author regex match:`, authorMatch);
      
      const actualTitle = titleMatch ? titleMatch[1].trim() : '';
      const actualAuthor = authorMatch ? authorMatch[1].trim() : '';
      
      console.log(`    Found title: "${actualTitle}"`);
      console.log(`    Found author: "${actualAuthor}"`);
      
      // Check if the book title matches (case insensitive, allow partial matches)
      const titleMatches = actualTitle.toLowerCase().includes(book.title.toLowerCase()) ||
                          book.title.toLowerCase().includes(actualTitle.toLowerCase());
      
      // Check if the author matches (case insensitive, allow partial matches)
      const authorMatches = actualAuthor.toLowerCase().includes(book.author.toLowerCase()) ||
                           book.author.toLowerCase().includes(actualAuthor.toLowerCase());
      
      console.log(`    Title matches: ${titleMatches}`);
      console.log(`    Author matches: ${authorMatches}`);
      
      if (titleMatches && authorMatches) {
        return { 
          isValid: true, 
          reason: 'Valid',
          actualTitle,
          actualAuthor,
          workingUrl: url
        };
      } else {
        return { 
          isValid: false, 
          reason: `Title/author mismatch. Expected: "${book.title}" by "${book.author}". Found: "${actualTitle}" by "${actualAuthor}"`,
          actualTitle,
          actualAuthor
        };
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      continue;
    }
  }
  
  return { isValid: false, reason: 'All URL formats failed' };
}

async function testSpecificBooks() {
  console.log('🧪 Testing validation script on specific problematic books...\n');
  
  // Test the problematic "Frightened Planet" book
  const testBooks = [
    {
      id: "33513",
      title: "The Frightened Planet",
      author: "Jane Austen"
    },
    {
      id: "1524",
      title: "Hamlet",
      author: "William Shakespeare"
    },
    {
      id: "11",
      title: "Alice's Adventures in Wonderland",
      author: "Lewis Carroll"
    }
  ];
  
  for (const book of testBooks) {
    const result = await validateBook(book);
    
    console.log(`\n📊 Result: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`Reason: ${result.reason}`);
    
    if (result.isValid) {
      console.log(`Working URL: ${result.workingUrl}`);
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testSpecificBooks().catch(console.error);

