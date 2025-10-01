#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Library files to process
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

const MAX_BOOKS_PER_AUTHOR = 10;

// Function to normalize author name for grouping
function normalizeAuthorName(author) {
  // Remove dates and translator info
  let normalized = author
    .replace(/\d{4}[\?\-]?\d{4}?[\?\-]?/g, '') // Remove birth/death dates like "1816-1855"
    .replace(/\[\w+\]/g, '') // Remove [Editor], [Translator], etc.
    .replace(/,\s*\d{4}[\?\-]?\d{4}?[\?\-]?/g, '') // Remove dates after commas
    .replace(/\s+by\s+/gi, '') // Remove "by" phrases
    .replace(/\s+\([^)]*\)\s*/g, '') // Remove parenthetical info
    .replace(/\s+--\s+.*$/g, '') // Remove everything after "--"
    .replace(/\s+Category:.*$/g, '') // Remove category info
    .trim();
  
  // Extract the main author name (usually the first part before any complex punctuation)
  const parts = normalized.split(/[,;]/);
  const mainAuthor = parts[0].trim();
  
  // Clean up common patterns
  return mainAuthor
    .replace(/^(Author|Editor|Translator):\s*/i, '')
    .replace(/\s+\([^)]*\)$/, '')
    .trim();
}

// Function to process a library file
function processLibraryFile(filename) {
  console.log(`\n📚 Processing ${filename}...`);
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return { original: 0, cleaned: 0, removed: 0, authors: {} };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books`);
  
  // Group books by normalized author name
  const booksByAuthor = {};
  
  for (const book of books) {
    const normalizedAuthor = normalizeAuthorName(book.author);
    
    if (!booksByAuthor[normalizedAuthor]) {
      booksByAuthor[normalizedAuthor] = [];
    }
    
    booksByAuthor[normalizedAuthor].push({
      ...book,
      normalizedAuthor
    });
  }
  
  console.log(`👥 Found ${Object.keys(booksByAuthor).length} unique authors`);
  
  // Keep only the top books per author (limit to MAX_BOOKS_PER_AUTHOR)
  const cleanedBooks = [];
  const authorStats = {};
  
  for (const [author, authorBooks] of Object.entries(booksByAuthor)) {
    // Sort books by title for consistency (could also sort by popularity if we had that data)
    const sortedBooks = authorBooks.sort((a, b) => a.title.localeCompare(b.title));
    
    // Take only the first MAX_BOOKS_PER_AUTHOR books
    const keptBooks = sortedBooks.slice(0, MAX_BOOKS_PER_AUTHOR);
    
    cleanedBooks.push(...keptBooks);
    
    authorStats[author] = {
      total: authorBooks.length,
      kept: keptBooks.length,
      removed: authorBooks.length - keptBooks.length
    };
    
    if (authorBooks.length > MAX_BOOKS_PER_AUTHOR) {
      console.log(`  📝 ${author}: kept ${keptBooks.length}/${authorBooks.length} books`);
    }
  }
  
  // Sort cleaned books by author name, then by title
  cleanedBooks.sort((a, b) => {
    const authorCompare = a.normalizedAuthor.localeCompare(b.normalizedAuthor);
    if (authorCompare !== 0) return authorCompare;
    return a.title.localeCompare(b.title);
  });
  
  // Remove the normalizedAuthor field we added
  const finalBooks = cleanedBooks.map(({ normalizedAuthor, ...book }) => book);
  
  // Write the cleaned file
  fs.writeFileSync(filePath, JSON.stringify(finalBooks, null, 2));
  
  const removed = books.length - finalBooks.length;
  
  console.log(`📊 Results:`);
  console.log(`  Original books: ${books.length}`);
  console.log(`  Cleaned books: ${finalBooks.length}`);
  console.log(`  Removed: ${removed}`);
  
  return {
    original: books.length,
    cleaned: finalBooks.length,
    removed: removed,
    authors: authorStats
  };
}

// Main function
async function main() {
  console.log('🧹 Library Cleanup Script');
  console.log(`Keeping only ${MAX_BOOKS_PER_AUTHOR} books per author\n`);
  
  const allResults = {
    timestamp: new Date().toISOString(),
    config: {
      maxBooksPerAuthor: MAX_BOOKS_PER_AUTHOR
    },
    files: {},
    summary: {
      totalOriginal: 0,
      totalCleaned: 0,
      totalRemoved: 0,
      totalAuthors: 0
    }
  };
  
  for (const filename of LIBRARY_FILES) {
    const result = await processLibraryFile(filename);
    
    allResults.files[filename] = result;
    allResults.summary.totalOriginal += result.original;
    allResults.summary.totalCleaned += result.cleaned;
    allResults.summary.totalRemoved += result.removed;
    allResults.summary.totalAuthors += Object.keys(result.authors).length;
  }
  
  // Write summary
  fs.writeFileSync('library-cleanup-results.json', JSON.stringify(allResults, null, 2));
  
  console.log('\n📊 OVERALL SUMMARY:');
  console.log(`  📚 Total original books: ${allResults.summary.totalOriginal}`);
  console.log(`  📚 Total cleaned books: ${allResults.summary.totalCleaned}`);
  console.log(`  🗑️  Total removed: ${allResults.summary.totalRemoved}`);
  console.log(`  👥 Total unique authors: ${allResults.summary.totalAuthors}`);
  console.log(`  📈 Reduction: ${Math.round((allResults.summary.totalRemoved / allResults.summary.totalOriginal) * 100)}%`);
  
  console.log('\n📄 Detailed results written to: library-cleanup-results.json');
  
  // Show some examples of authors with many books
  console.log('\n📋 Authors with most books (showing how many were kept):');
  const allAuthors = {};
  for (const fileResult of Object.values(allResults.files)) {
    for (const [author, stats] of Object.entries(fileResult.authors)) {
      if (!allAuthors[author]) {
        allAuthors[author] = { total: 0, kept: 0 };
      }
      allAuthors[author].total += stats.total;
      allAuthors[author].kept += stats.kept;
    }
  }
  
  const sortedAuthors = Object.entries(allAuthors)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);
  
  for (const [author, stats] of sortedAuthors) {
    console.log(`  ${author}: ${stats.kept}/${stats.total} books`);
  }
}

main().catch(console.error);
