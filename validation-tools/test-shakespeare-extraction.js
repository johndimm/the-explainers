const fs = require('fs');

async function testShakespeareExtraction() {
  console.log('🧪 Testing Shakespeare Title/Author Extraction\n');
  
  // Test a few specific Shakespeare works
  const testBooks = [
    {
      id: "1524",
      title: "Hamlet",
      author: "William Shakespeare"
    },
    {
      id: "1528",
      title: "Love's Labour's Lost",
      author: "William Shakespeare"
    },
    {
      id: "1531",
      title: "Othello",
      author: "William Shakespeare"
    }
  ];
  
  for (const book of testBooks) {
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
        
        // Show first 500 characters to see the structure
        console.log(`    First 500 characters:\n${text.substring(0, 500)}\n`);
        
        // Try to find the Project Gutenberg header section
        const headerMatch = text.match(/THE PROJECT GUTENBERG EBOOK OF\s*(.+?)\s*by\s*(.+?)(?:\n|$)/i);
        if (headerMatch) {
          console.log(`    📖 Header match found:`);
          console.log(`      Title: "${headerMatch[1].trim()}"`);
          console.log(`      Author: "${headerMatch[2].trim()}"`);
        } else {
          console.log(`    ❌ No header match found`);
          
          // Look for title patterns in the first 50 lines only
          const firstLines = text.split('\n').slice(0, 50).join('\n');
          console.log(`    First 50 lines:\n${firstLines}\n`);
          
          // Try individual patterns
          const titlePatterns = [
            /Title:\s*(.+?)(?:\n|$)/i,
            /THE PROJECT GUTENBERG EBOOK OF\s*(.+?)(?:\n|$)/i,
            /^(.+?)\s*by\s*William Shakespeare/i,
            /^(.+?)\s*by\s*Shakespeare/i
          ];
          
          for (let j = 0; j < titlePatterns.length; j++) {
            const pattern = titlePatterns[j];
            const match = firstLines.match(pattern);
            if (match && match[1].trim() && match[1].trim().length > 3) {
              console.log(`    📖 Title pattern ${j + 1} match: "${match[1].trim()}"`);
            }
          }
        }
        
        break; // If we got here, we found a working URL
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
        continue;
      }
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testShakespeareExtraction().catch(console.error);
