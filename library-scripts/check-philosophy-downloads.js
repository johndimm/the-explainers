#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const FAILED_DOWNLOADS_FILE = 'failed-downloads.json';
const DELAY_BETWEEN_REQUESTS = 200; // 200ms delay to be respectful to servers

// Function to test both Gutenberg URL formats
async function testDownload(book) {
  // Skip books that don't have numeric IDs (special cases)
  if (!book.id || isNaN(book.id) || book.localPath || book.directUrl) {
    return { status: 'skipped', reason: 'Non-Gutenberg or special case' };
  }

  // Try both URL formats
  const urls = [
    {
      url: `https://www.gutenberg.org/files/${book.id}/${book.id}-0.txt`,
      format: 'files'
    },
    {
      url: `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`,
      format: 'epub'
    }
  ];
  
  for (const { url, format } of urls) {
    try {
      console.log(`    Trying ${format} format: ${url}`);
      const response = await fetch(url);
      
      if (response.ok) {
        return { status: 'success', url: url, format: format };
      } else if (response.status === 404) {
        console.log(`    ❌ 404 with ${format} format`);
        continue; // Try next format
      } else {
        console.log(`    ⚠️  HTTP ${response.status} with ${format} format`);
        continue; // Try next format
      }
    } catch (error) {
      console.log(`    ❌ Error with ${format} format: ${error.message}`);
      continue; // Try next format
    }
  }
  
  return { status: 'failed', reason: 'Both URL formats failed' };
}

// Function to process the philosophy library file
async function processPhilosophyLibrary() {
  console.log('📚 Processing philosophers.json...\n');
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', 'philosophers.json');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: philosophers.json`);
    return { total: 0, successful: 0, failed: 0, skipped: 0, failures: [] };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books\n`);
  
  const results = {
    total: books.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    failures: []
  };
  
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`[${i + 1}/${books.length}] Testing: "${book.title}" by ${book.author} (ID: ${book.id})`);
    
    const result = await testDownload(book);
    
    if (result.status === 'success') {
      results.successful++;
      console.log(`  ✅ Success with ${result.format} format: ${result.url}`);
    } else if (result.status === 'skipped') {
      results.skipped++;
      console.log(`  ⏭️  Skipped: ${result.reason}`);
    } else {
      results.failed++;
      results.failures.push({
        file: 'philosophers.json',
        id: book.id,
        title: book.title,
        author: book.author,
        reason: result.reason,
        timestamp: new Date().toISOString()
      });
      console.log(`  ❌ Failed: ${result.reason}`);
    }
    
    // Add delay between requests to be respectful
    if (i < books.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
    
    console.log(''); // Empty line for readability
  }
  
  return results;
}

// Main function
async function main() {
  console.log('🔍 Philosophy Library Download Checker');
  console.log('Testing both Gutenberg URL formats for philosophers.json');
  console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms\n`);
  
  const results = await processPhilosophyLibrary();
  
  // Write failed downloads to file
  fs.writeFileSync(FAILED_DOWNLOADS_FILE, JSON.stringify(results.failures, null, 2));
  
  // Write full results
  const fullResults = {
    timestamp: new Date().toISOString(),
    library: 'philosophers.json',
    summary: results,
    failedDownloads: results.failures
  };
  
  fs.writeFileSync('philosophy-download-results.json', JSON.stringify(fullResults, null, 2));
  
  console.log('📊 RESULTS SUMMARY:');
  console.log(`  📚 Total books checked: ${results.total}`);
  console.log(`  ✅ Successful downloads: ${results.successful}`);
  console.log(`  ❌ Failed downloads: ${results.failed}`);
  console.log(`  ⏭️  Skipped books: ${results.skipped}`);
  console.log(`  📈 Success rate: ${results.total > 0 ? Math.round((results.successful / results.total) * 100) : 0}%`);
  
  console.log(`\n📄 Failed downloads written to: ${FAILED_DOWNLOADS_FILE}`);
  console.log(`📄 Full results written to: philosophy-download-results.json`);
  
  if (results.failures.length > 0) {
    console.log(`\n❌ Failed downloads (${results.failures.length} total):`);
    results.failures.forEach((failure, index) => {
      console.log(`  ${index + 1}. "${failure.title}" by ${failure.author} (ID: ${failure.id})`);
    });
    
    // Check specifically for Stuart Hampshire books
    const hampshireBooks = results.failures.filter(f => 
      f.author.toLowerCase().includes('hampshire') || 
      f.title.toLowerCase().includes('hampshire')
    );
    
    if (hampshireBooks.length > 0) {
      console.log(`\n🎯 Stuart Hampshire books found in failures:`);
      hampshireBooks.forEach((book, index) => {
        console.log(`  ${index + 1}. "${book.title}" by ${book.author} (ID: ${book.id})`);
      });
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏸️  Download check stopped. Partial results saved.');
  process.exit(0);
});

main().catch(console.error);
