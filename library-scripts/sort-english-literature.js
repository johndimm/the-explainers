#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to normalize author name for sorting
function normalizeAuthorName(author) {
  // Remove dates and translator info for cleaner sorting
  let normalized = author
    .replace(/\d{4}[\?\-]?\d{4}?[\?\-]?/g, '') // Remove birth/death dates like "1816-1855"
    .replace(/\[\w+\]/g, '') // Remove [Editor], [Translator], etc.
    .replace(/,\s*\d{4}[\?\-]?\d{4}?[\?\-]?/g, '') // Remove dates after commas
    .replace(/\s+--\s+.*$/g, '') // Remove everything after "--"
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
  console.log('🔄 Sorting english-literature.json by author name...\n');
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', 'english-literature.json');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: english-literature.json`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books\n`);
  
  // Sort books by normalized author name, then by title
  books.sort((a, b) => {
    const authorA = normalizeAuthorName(a.author);
    const authorB = normalizeAuthorName(b.author);
    
    const authorCompare = authorA.localeCompare(authorB);
    if (authorCompare !== 0) return authorCompare;
    
    // If authors are the same, sort by title
    return a.title.localeCompare(b.title);
  });
  
  // Write the sorted file
  fs.writeFileSync(filePath, JSON.stringify(books, null, 2));
  
  console.log(`📊 SORTING COMPLETE:`);
  console.log(`  📚 Total books: ${books.length}`);
  console.log(`  📄 Sorted by author name, then by title`);
  
  // Show some examples of the sorting
  console.log(`\n📋 Sample of sorted books:`);
  books.slice(0, 20).forEach((book, index) => {
    const normalizedAuthor = normalizeAuthorName(book.author);
    console.log(`  ${index + 1}. "${book.title}" by ${normalizedAuthor}`);
  });
  
  if (books.length > 20) {
    console.log(`  ... and ${books.length - 20} more books`);
  }
  
  // Show author distribution
  const authorCounts = {};
  books.forEach(book => {
    const normalizedAuthor = normalizeAuthorName(book.author);
    authorCounts[normalizedAuthor] = (authorCounts[normalizedAuthor] || 0) + 1;
  });
  
  const sortedAuthors = Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log(`\n📊 Top 10 authors by book count:`);
  sortedAuthors.forEach(([author, count], index) => {
    console.log(`  ${index + 1}. ${author}: ${count} books`);
  });
}

main().catch(console.error);
