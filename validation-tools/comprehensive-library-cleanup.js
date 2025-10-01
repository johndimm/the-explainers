const fs = require('fs');
const path = require('path');

// Library files to validate
const LIBRARY_FILES = [
  'shakespeare.json',
  'english-literature.json', 
  'philosophers.json',
  'poetry.json',
  'french-literature.json',
  'german-literature.json',
  'italian-literature.json',
  'spanish-literature.json',
  'gutenberg-top.json'
];

// Progress tracking file
const PROGRESS_FILE = 'validation-progress.json';

// Known problematic authors and their corrections
const AUTHOR_CORRECTIONS = {
  'Sidney Austen': null, // Remove entirely - not a classic author
  'Bacon': 'Francis Bacon', // Many works incorrectly attributed to just "Bacon"
  'Jane Austen': 'Jane Austen', // Keep as is
  'William Shakespeare': 'William Shakespeare' // Keep as is
};

// Load progress from file
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch (error) {
      console.log('⚠️  Error loading progress file, starting fresh');
    }
  }
  return {
    completedFiles: [],
    currentFile: null,
    currentFileProgress: 0,
    totalValid: 0,
    totalInvalid: 0,
    totalBooks: 0,
    startTime: Date.now()
  };
}

// Save progress to file
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Clean up progress file when done
function cleanupProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }
}

async function validateBook(book) {
  if (!book.id || !book.title || !book.author) {
    return { isValid: false, reason: 'Missing required fields' };
  }

  // Check if this is a known problematic author
  if (AUTHOR_CORRECTIONS[book.author] === null) {
    return { 
      isValid: false, 
      reason: `Author "${book.author}" should be removed (not a classic author)`,
      shouldRemove: true
    };
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
      if (!response.ok) continue;
      
      const text = await response.text();
      
      // Check if we got HTML (404 page) instead of text
      if (text.includes('<html') || text.includes('<!DOCTYPE html')) {
        continue;
      }
      
      // Extract title and author from the text with more specific patterns
      // Look for Project Gutenberg header patterns first
      let actualTitle = '';
      let actualAuthor = '';
      
      // Try to find the Project Gutenberg header section
      const headerMatch = text.match(/THE PROJECT GUTENBERG EBOOK OF\s*(.+?)\s*by\s*(.+?)(?:\n|$)/i);
      if (headerMatch) {
        actualTitle = headerMatch[1].trim();
        actualAuthor = headerMatch[2].trim();
      } else {
        // Look for title patterns in the first 50 lines only
        const firstLines = text.split('\n').slice(0, 50).join('\n');
        
        // More specific title patterns
        const titlePatterns = [
          /Title:\s*(.+?)(?:\n|$)/i,
          /THE PROJECT GUTENBERG EBOOK OF\s*(.+?)(?:\n|$)/i,
          /^(.+?)\s*by\s*William Shakespeare/i,
          /^(.+?)\s*by\s*Shakespeare/i
        ];
        
        const authorPatterns = [
          /Author:\s*(.+?)(?:\n|$)/i,
          /by\s*(William Shakespeare)/i,
          /by\s*(Shakespeare)/i
        ];
        
        for (const pattern of titlePatterns) {
          const match = firstLines.match(pattern);
          if (match && match[1].trim() && match[1].trim().length > 3) {
            actualTitle = match[1].trim();
            break;
          }
        }
        
        for (const pattern of authorPatterns) {
          const match = firstLines.match(pattern);
          if (match && match[1].trim()) {
            actualAuthor = match[1].trim();
            break;
          }
        }
      }
      
      // Clean up extracted data
      actualTitle = actualTitle.replace(/^["']|["']$/g, '').trim();
      actualAuthor = actualAuthor.replace(/^["']|["']$/g, '').trim();
      
      // Debug output for problematic extractions
      if (actualTitle.length < 5 || actualTitle.includes(',') || actualTitle.includes(';')) {
        console.log(`    🔍 Debug - Raw title: "${actualTitle}"`);
        console.log(`    🔍 Debug - Raw author: "${actualAuthor}"`);
        console.log(`    🔍 Debug - First 200 chars: "${text.substring(0, 200)}"`);
      }
      
      // Check if the book title matches (case insensitive, allow partial matches)
      const normalizeText = (text) => text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
      
      const normalizedActualTitle = normalizeText(actualTitle);
      const normalizedExpectedTitle = normalizeText(book.title);
      
      const titleMatches = normalizedActualTitle.includes(normalizedExpectedTitle) ||
                          normalizedExpectedTitle.includes(normalizedActualTitle) ||
                          normalizedActualTitle === normalizedExpectedTitle;
      
      // Check if the author matches (case insensitive, allow partial matches)
      const normalizedActualAuthor = normalizeText(actualAuthor);
      const normalizedExpectedAuthor = normalizeText(book.author);
      
      const authorMatches = normalizedActualAuthor.includes(normalizedExpectedAuthor) ||
                           normalizedExpectedAuthor.includes(normalizedActualAuthor) ||
                           normalizedActualAuthor === normalizedExpectedAuthor;
      
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
          actualAuthor,
          shouldRemove: false
        };
      }
    } catch (error) {
      continue;
    }
  }
  
  return { isValid: false, reason: 'All URL formats failed' };
}

async function validateLibraryFile(filename, progress) {
  console.log(`\n📚 Validating ${filename}...`);
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return { valid: 0, invalid: 0, total: 0, removed: 0 };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books`);
  
  const validBooks = [];
  const invalidBooks = [];
  const removedBooks = [];
  
  const startIndex = progress.currentFile === filename ? progress.currentFileProgress : 0;
  
  for (let i = startIndex; i < books.length; i++) {
    const book = books[i];
    console.log(`  [${i + 1}/${books.length}] Checking: ${book.title} by ${book.author}`);
    
    const result = await validateBook(book);
    
    if (result.shouldRemove) {
      removedBooks.push({ book, reason: result.reason });
      console.log(`    🗑️  Should remove: ${result.reason}`);
    } else if (result.isValid) {
      validBooks.push(book);
      console.log(`    ✅ Valid`);
    } else {
      invalidBooks.push({ book, reason: result.reason });
      console.log(`    ❌ Invalid: ${result.reason}`);
    }
    
    // Update progress
    progress.currentFile = filename;
    progress.currentFileProgress = i + 1;
    saveProgress(progress);
    
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Results for ${filename}:`);
  console.log(`  ✅ Valid: ${validBooks.length}`);
  console.log(`  ❌ Invalid: ${invalidBooks.length}`);
  console.log(`  🗑️  Should remove: ${removedBooks.length}`);
  console.log(`  📈 Success rate: ${Math.round((validBooks.length / books.length) * 100)}%`);
  
  // Show some examples of invalid books
  if (invalidBooks.length > 0) {
    console.log(`\n  🔍 Examples of invalid books:`);
    invalidBooks.slice(0, 3).forEach(({ book, reason }) => {
      console.log(`    - "${book.title}" by ${book.author}: ${reason}`);
    });
  }
  
  // Show some examples of books to remove
  if (removedBooks.length > 0) {
    console.log(`\n  🗑️  Books to remove:`);
    removedBooks.slice(0, 3).forEach(({ book, reason }) => {
      console.log(`    - "${book.title}" by ${book.author}: ${reason}`);
    });
  }
  
  return { 
    valid: validBooks.length, 
    invalid: invalidBooks.length, 
    total: books.length,
    removed: removedBooks.length,
    validBooks,
    invalidBooks,
    removedBooks
  };
}

async function main() {
  console.log('🔍 Comprehensive Library Validation with Progress Tracking');
  console.log('This will check if books actually match their titles and authors...\n');
  
  const progress = loadProgress();
  
  // Calculate elapsed time
  const elapsed = Math.round((Date.now() - progress.startTime) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  if (progress.completedFiles.length > 0) {
    console.log(`⏱️  Resuming from previous session (${hours}h ${minutes}m ${seconds}s elapsed)`);
    console.log(`📁 Completed files: ${progress.completedFiles.join(', ')}`);
    if (progress.currentFile) {
      console.log(`📖 Current file: ${progress.currentFile} (${progress.currentFileProgress} books processed)`);
    }
  }
  
  let totalValid = progress.totalValid;
  let totalInvalid = progress.totalInvalid;
  let totalBooks = progress.totalBooks;
  let totalRemoved = 0;
  
  for (const filename of LIBRARY_FILES) {
    if (progress.completedFiles.includes(filename)) {
      console.log(`\n⏭️  Skipping ${filename} (already completed)`);
      continue;
    }
    
    const result = await validateLibraryFile(filename, progress);
    totalValid += result.valid;
    totalInvalid += result.invalid;
    totalBooks += result.total;
    totalRemoved += result.removed;
    
    // Mark file as completed
    progress.completedFiles.push(filename);
    progress.currentFile = null;
    progress.currentFileProgress = 0;
    progress.totalValid = totalValid;
    progress.totalInvalid = totalInvalid;
    progress.totalBooks = totalBooks;
    saveProgress(progress);
    
    console.log(`\n✅ Completed ${filename}`);
  }
  
  console.log('\n📊 OVERALL RESULTS:');
  console.log(`  📚 Total books checked: ${totalBooks}`);
  console.log(`  ✅ Valid books: ${totalValid}`);
  console.log(`  ❌ Invalid books: ${totalInvalid}`);
  console.log(`  🗑️  Books to remove: ${totalRemoved}`);
  console.log(`  📈 Overall success rate: ${Math.round((totalValid / totalBooks) * 100)}%`);
  
  if (totalInvalid > 0 || totalRemoved > 0) {
    console.log('\n⚠️  WARNING: Many books have incorrect metadata or should be removed!');
    console.log('Consider running a cleanup script to remove invalid entries.');
  } else {
    console.log('\n🎉 All books are valid!');
  }
  
  // Clean up progress file
  cleanupProgress();
  console.log('\n✨ Validation complete!');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏸️  Validation paused. Progress saved. Run again to resume.');
  process.exit(0);
});

main().catch(console.error);