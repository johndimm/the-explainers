#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

// Main function
async function main() {
  console.log('🔄 Limiting English Literature to 10 books per author...\n');
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', 'english-literature.json');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: english-literature.json`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books\n`);
  
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
  
  console.log(`👥 Found ${Object.keys(booksByAuthor).length} unique authors\n`);
  
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
  
  // Write removed books to a separate file for reference
  const removedBooks = [];
  for (const [author, stats] of Object.entries(authorStats)) {
    if (stats.removed > 0) {
      const authorBooks = booksByAuthor[author];
      const removed = authorBooks.slice(MAX_BOOKS_PER_AUTHOR);
      removedBooks.push(...removed.map(({ normalizedAuthor, ...book }) => book));
    }
  }
  
  fs.writeFileSync('removed-english-literature-excess.json', JSON.stringify(removedBooks, null, 2));
  
  const removed = books.length - finalBooks.length;
  
  console.log(`\n📊 CLEANUP COMPLETE:`);
  console.log(`  📚 Original books: ${books.length}`);
  console.log(`  ✅ Kept books: ${finalBooks.length}`);
  console.log(`  🗑️  Removed books: ${removed}`);
  console.log(`  👥 Total unique authors: ${Object.keys(booksByAuthor).length}`);
  console.log(`  📈 Reduction: ${Math.round((removed / books.length) * 100)}%`);
  
  console.log(`\n📄 Updated english-literature.json with ${finalBooks.length} books`);
  console.log(`📄 Removed books saved to: removed-english-literature-excess.json`);
  
  // Show some examples of authors with many books
  console.log(`\n📋 Authors with most books removed:`);
  const authorsWithRemovals = Object.entries(authorStats)
    .filter(([author, stats]) => stats.removed > 0)
    .sort((a, b) => b[1].removed - a[1].removed)
    .slice(0, 10);
  
  for (const [author, stats] of authorsWithRemovals) {
    console.log(`  ${author}: removed ${stats.removed} books (kept ${stats.kept}/${stats.total})`);
  }
  
  // Show final author distribution
  console.log(`\n📊 Final author distribution (top 10):`);
  const finalAuthorCounts = {};
  finalBooks.forEach(book => {
    const normalizedAuthor = normalizeAuthorName(book.author);
    finalAuthorCounts[normalizedAuthor] = (finalAuthorCounts[normalizedAuthor] || 0) + 1;
  });
  
  const sortedFinalAuthors = Object.entries(finalAuthorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  sortedFinalAuthors.forEach(([author, count], index) => {
    console.log(`  ${index + 1}. ${author}: ${count} books`);
  });
}

main().catch(console.error);
