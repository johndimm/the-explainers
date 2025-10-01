const fs = require('fs');
const path = require('path');

// Function to parse GUTINDEX.ALL file
function parseGutenbergCatalog(filePath) {
  console.log('📚 Parsing Project Gutenberg catalog...');
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const books = [];
  let currentBook = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and headers
    if (!line || line.startsWith('=') || line.startsWith('[') || line.startsWith('This is the file') || line.startsWith('Updated to') || line.startsWith('INTRODUCTION') || line.startsWith('YEARLY CATALOGS')) {
      continue;
    }
    
    // Look for book entries (title, by author, followed by ID)
    // Format: "Title, by Author                                           ID"
    const bookMatch = line.match(/^(.+),\s+by\s+(.+?)\s+(\d+)$/);
    if (bookMatch) {
      // Save previous book if exists
      if (currentBook) {
        books.push(currentBook);
      }
      
      // Start new book
      currentBook = {
        title: bookMatch[1].trim(),
        author: bookMatch[2].trim(),
        gutenbergId: parseInt(bookMatch[3]),
        subtitle: null,
        language: null
      };
    }
    // Look for subtitle lines
    else if (currentBook && line.startsWith('[Subtitle:')) {
      currentBook.subtitle = line.replace('[Subtitle:', '').replace(']', '').trim();
    }
    // Look for language lines
    else if (currentBook && line.startsWith('[Language:')) {
      currentBook.language = line.replace('[Language:', '').replace(']', '').trim();
    }
    // Look for continuation lines (if title is too long)
    else if (currentBook && line && !line.startsWith('[') && !line.match(/^\d+$/)) {
      // This might be a continuation of the title
      currentBook.title += ' ' + line;
    }
  }
  
  // Add the last book
  if (currentBook) {
    books.push(currentBook);
  }
  
  console.log(`📖 Found ${books.length} books in Project Gutenberg catalog`);
  return books;
}

// Function to normalize text for comparison
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
    .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
    .trim();
}

// Function to check if two titles match
function titlesMatch(title1, title2) {
  const norm1 = normalizeText(title1);
  const norm2 = normalizeText(title2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Word-by-word comparison (80% threshold)
  const words1 = norm1.split(' ').filter(w => w.length > 0);
  const words2 = norm2.split(' ').filter(w => w.length > 0);
  
  const foundWords = words1.filter(word1 => 
    words2.some(word2 => 
      word1 === word2 || 
      word1.startsWith(word2) || 
      word2.startsWith(word1)
    )
  );
  
  const matchRatio = foundWords.length / Math.max(words1.length, words2.length);
  return matchRatio >= 0.8;
}

// Function to check if two authors match
function authorsMatch(author1, author2) {
  const norm1 = normalizeText(author1);
  const norm2 = normalizeText(author2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Handle common name variations
  const normalizeForComparison = (name) => {
    return name
      .replace(/\b([a-z])\.\s*/g, '$1 ') // Convert "J.M." to "J M"
      .replace(/\b([a-z])\s+([a-z])\s+/g, '$1 $2 ') // Ensure single spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .trim();
  };
  
  const flex1 = normalizeForComparison(norm1);
  const flex2 = normalizeForComparison(norm2);
  
  if (flex1 === flex2) return true;
  
  // Word-by-word comparison
  const words1 = flex1.split(' ').filter(w => w.length > 0);
  const words2 = flex2.split(' ').filter(w => w.length > 0);
  
  const allWords1Found = words1.every(word1 => 
    words2.some(word2 => 
      word1 === word2 || 
      word1.startsWith(word2) || 
      word2.startsWith(word1)
    )
  );
  
  const allWords2Found = words2.every(word2 => 
    words1.some(word1 => 
      word1 === word2 || 
      word1.startsWith(word2) || 
      word2.startsWith(word1)
    )
  );
  
  return allWords1Found && allWords2Found;
}

// Function to find matches between Wikipedia books and Gutenberg catalog
function findMatches(wikipediaBooks, gutenbergBooks) {
  console.log('🔍 Finding matches between Wikipedia books and Project Gutenberg catalog...');
  
  const matches = [];
  const unmatchedWikipedia = [];
  
  for (const wikiBook of wikipediaBooks) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const gutenbergBook of gutenbergBooks) {
      const titleMatch = titlesMatch(wikiBook.title, gutenbergBook.title);
      const authorMatch = authorsMatch(wikiBook.author || 'Unknown', gutenbergBook.author);
      
      // Calculate match score
      let score = 0;
      if (titleMatch) score += 50;
      if (authorMatch) score += 50;
      
      // Bonus for exact matches
      if (normalizeText(wikiBook.title) === normalizeText(gutenbergBook.title)) score += 20;
      if (normalizeText(wikiBook.author || 'Unknown') === normalizeText(gutenbergBook.author)) score += 20;
      
      if (score > bestScore && score >= 50) { // At least title OR author must match
        bestMatch = gutenbergBook;
        bestScore = score;
      }
    }
    
    if (bestMatch) {
      matches.push({
        wikipedia: wikiBook,
        gutenberg: bestMatch,
        matchScore: bestScore,
        titleMatch: titlesMatch(wikiBook.title, bestMatch.title),
        authorMatch: authorsMatch(wikiBook.author || 'Unknown', bestMatch.author)
      });
    } else {
      unmatchedWikipedia.push(wikiBook);
    }
  }
  
  console.log(`✅ Found ${matches.length} matches`);
  console.log(`❌ ${unmatchedWikipedia.length} Wikipedia books not found in Project Gutenberg`);
  
  return { matches, unmatchedWikipedia };
}

// Main function
async function main() {
  console.log('🔍 Project Gutenberg Catalog Matcher');
  console.log('Cross-referencing Wikipedia books with Project Gutenberg catalog\n');
  
  // Load Wikipedia books
  console.log('📚 Loading Wikipedia book list...');
  const wikipediaBooks = JSON.parse(fs.readFileSync('comprehensive-book-list.json', 'utf8'));
  console.log(`Found ${wikipediaBooks.length} Wikipedia books`);
  
  // Parse Gutenberg catalog
  const gutenbergBooks = parseGutenbergCatalog('GUTINDEX.ALL');
  
  // Find matches
  const { matches, unmatchedWikipedia } = findMatches(wikipediaBooks, gutenbergBooks);
  
  // Save results
  fs.writeFileSync('gutenberg-matches.json', JSON.stringify(matches, null, 2));
  fs.writeFileSync('unmatched-wikipedia-books.json', JSON.stringify(unmatchedWikipedia, null, 2));
  
  // Create a summary
  const summary = {
    totalWikipediaBooks: wikipediaBooks.length,
    totalGutenbergBooks: gutenbergBooks.length,
    matchesFound: matches.length,
    unmatchedWikipedia: unmatchedWikipedia.length,
    matchRate: ((matches.length / wikipediaBooks.length) * 100).toFixed(1) + '%'
  };
  
  fs.writeFileSync('matching-summary.json', JSON.stringify(summary, null, 2));
  
  console.log('\n📊 RESULTS SUMMARY:');
  console.log(`  📚 Wikipedia books: ${summary.totalWikipediaBooks}`);
  console.log(`  📖 Project Gutenberg books: ${summary.totalGutenbergBooks}`);
  console.log(`  ✅ Matches found: ${summary.matchesFound}`);
  console.log(`  ❌ Unmatched Wikipedia books: ${summary.unmatchedWikipedia}`);
  console.log(`  📈 Match rate: ${summary.matchRate}`);
  
  console.log('\n📄 Files created:');
  console.log('  - gutenberg-matches.json (books found in both)');
  console.log('  - unmatched-wikipedia-books.json (Wikipedia books not in PG)');
  console.log('  - matching-summary.json (summary statistics)');
  
  // Show some example matches
  console.log('\n🔍 Example matches:');
  matches.slice(0, 10).forEach((match, i) => {
    console.log(`  ${i + 1}. "${match.wikipedia.title}" by ${match.wikipedia.author || 'Unknown'}`);
    console.log(`     → "${match.gutenberg.title}" by ${match.gutenberg.author} (ID: ${match.gutenberg.gutenbergId})`);
    console.log(`     Score: ${match.matchScore} (Title: ${match.titleMatch ? '✅' : '❌'}, Author: ${match.authorMatch ? '✅' : '❌'})`);
    console.log('');
  });
}

main().catch(console.error);

