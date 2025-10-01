#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Library files to check
const LIBRARY_FILES = [
  'shakespeare.json',
  'plato.json',
  'english-literature.json', 
  'philosophers.json',
  'poetry.json',
  'french-literature.json',
  'german-literature.json',
  'italian-literature.json',
  'spanish-literature.json',
  'gutenberg-top.json',
  'history.json',
  'humanities-101.json'
];

const FAILED_DOWNLOADS_FILE = 'failed-downloads.json';
const DELAY_BETWEEN_REQUESTS = 200; // 200ms delay to be respectful to servers

// Function to test a download URL
async function testDownload(book) {
  // Skip books that don't have numeric IDs (special cases)
  if (!book.id || isNaN(book.id) || book.localPath || book.directUrl) {
    return { status: 'skipped', reason: 'Non-Gutenberg or special case' };
  }

  // Try different URL formats
  const urls = [
    `https://www.gutenberg.org/files/${book.id}/${book.id}-0.txt`,
    `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`,
    `https://www.gutenberg.org/cache/epub/${book.id}/${book.id}-0.txt`
  ];
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        return { status: 'success', url: url };
      } else if (response.status === 404) {
        return { status: '404', url: url, reason: 'Not found' };
      } else {
        return { status: 'error', url: url, reason: `HTTP ${response.status}` };
      }
    } catch (error) {
      // Continue to next URL if this one fails
      continue;
    }
  }
  
  return { status: 'error', reason: 'All URLs failed' };
}

// Function to process a library file
async function processLibraryFile(filename) {
  console.log(`\n📚 Processing ${filename}...`);
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return { total: 0, successful: 0, failed: 0, skipped: 0, failures: [] };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books`);
  
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
      console.log(`  ✅ Success: ${result.url}`);
    } else if (result.status === 'skipped') {
      results.skipped++;
      console.log(`  ⏭️  Skipped: ${result.reason}`);
    } else if (result.status === '404') {
      results.failed++;
      results.failures.push({
        file: filename,
        id: book.id,
        title: book.title,
        author: book.author,
        url: result.url,
        reason: result.reason
      });
      console.log(`  ❌ 404 Error: ${result.url}`);
    } else {
      results.failed++;
      results.failures.push({
        file: filename,
        id: book.id,
        title: book.title,
        author: book.author,
        url: result.url || 'Multiple URLs tried',
        reason: result.reason
      });
      console.log(`  ⚠️  Error: ${result.reason}`);
    }
    
    // Add delay between requests to be respectful
    if (i < books.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }
  
  return results;
}

// Main function
async function main() {
  console.log('🔍 Library Download Checker');
  console.log('Testing download URLs for all books in library files');
  console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms\n`);
  
  const allResults = {
    timestamp: new Date().toISOString(),
    summary: {
      totalBooks: 0,
      successfulDownloads: 0,
      failedDownloads: 0,
      skippedBooks: 0
    },
    files: {},
    allFailures: []
  };
  
  for (const filename of LIBRARY_FILES) {
    const result = await processLibraryFile(filename);
    
    allResults.files[filename] = result;
    allResults.summary.totalBooks += result.total;
    allResults.summary.successfulDownloads += result.successful;
    allResults.summary.failedDownloads += result.failed;
    allResults.summary.skippedBooks += result.skipped;
    allResults.allFailures.push(...result.failures);
    
    console.log(`\n📊 ${filename} Results:`);
    console.log(`  Total books: ${result.total}`);
    console.log(`  ✅ Successful: ${result.successful}`);
    console.log(`  ❌ Failed: ${result.failed}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);
  }
  
  // Write failed downloads to file
  const failedDownloads = allResults.allFailures.filter(failure => 
    failure.reason === 'Not found' || failure.reason.includes('404')
  );
  
  fs.writeFileSync(FAILED_DOWNLOADS_FILE, JSON.stringify(failedDownloads, null, 2));
  
  // Write full results
  fs.writeFileSync('download-check-results.json', JSON.stringify(allResults, null, 2));
  
  console.log('\n📊 OVERALL SUMMARY:');
  console.log(`  📚 Total books checked: ${allResults.summary.totalBooks}`);
  console.log(`  ✅ Successful downloads: ${allResults.summary.successfulDownloads}`);
  console.log(`  ❌ Failed downloads: ${allResults.summary.failedDownloads}`);
  console.log(`  ⏭️  Skipped books: ${allResults.summary.skippedBooks}`);
  console.log(`  📈 Success rate: ${allResults.summary.totalBooks > 0 ? Math.round((allResults.summary.successfulDownloads / allResults.summary.totalBooks) * 100) : 0}%`);
  
  console.log(`\n📄 Failed downloads (404 errors) written to: ${FAILED_DOWNLOADS_FILE}`);
  console.log(`📄 Full results written to: download-check-results.json`);
  console.log(`\n🔍 Found ${failedDownloads.length} books with 404 errors that may need to be removed.`);
  
  if (failedDownloads.length > 0) {
    console.log('\n📋 Sample failed downloads:');
    failedDownloads.slice(0, 5).forEach((failure, index) => {
      console.log(`  ${index + 1}. "${failure.title}" by ${failure.author} (ID: ${failure.id}) - ${failure.file}`);
    });
    if (failedDownloads.length > 5) {
      console.log(`  ... and ${failedDownloads.length - 5} more (see ${FAILED_DOWNLOADS_FILE})`);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏸️  Download check stopped. Partial results saved.');
  process.exit(0);
});

main().catch(console.error);
