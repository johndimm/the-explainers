#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MAX_AUTHORS = 100;

// Function to normalize author name for grouping
function normalizeAuthorName(author) {
  let normalized = author
    .replace(/\d{4}[\?\-]?\d{4}?[\?\-]?/g, '') // Remove birth/death dates
    .replace(/\[\w+\]/g, '') // Remove [Editor], [Translator], etc.
    .replace(/,\s*\d{4}[\?\-]?\d{4}?[\?\-]?/g, '') // Remove dates after commas
    .replace(/\s+--\s+.*$/g, '') // Remove everything after "--"
    .trim();
  
  const parts = normalized.split(/[,;]/);
  const mainAuthor = parts[0].trim();
  
  return mainAuthor
    .replace(/^(Author|Editor|Translator):\s*/i, '')
    .replace(/\s+\([^)]*\)$/, '')
    .trim();
}

// Function to extract birth year from author string
function getBirthYear(author) {
  const match = author.match(/\b(\d{4})[\?\-]?\d{4}?[\?\-]?\b/);
  return match ? parseInt(match[1]) : null;
}

// Function to calculate difficulty score for an author
function calculateDifficultyScore(author, books) {
  let score = 0;
  
  // Extract birth year to determine era
  const birthYear = getBirthYear(author);
  
  // Older authors = more difficult (pre-1800 gets highest scores)
  if (birthYear) {
    if (birthYear < 1500) score += 100;      // Medieval/ancient
    else if (birthYear < 1600) score += 80;  // Renaissance
    else if (birthYear < 1700) score += 60;  // Early modern
    else if (birthYear < 1800) score += 40;  // 18th century
    else if (birthYear < 1900) score += 20;  // 19th century
    else score += 5;                         // 20th century+
  }
  
  // Check for philosophical/philosophical authors
  const philosophicalKeywords = [
    'philosophy', 'philosophical', 'ethics', 'metaphysics', 'epistemology',
    'stoic', 'epicurean', 'platonic', 'aristotelian', 'kantian', 'hegelian'
  ];
  
  const philosophicalTitles = books.some(book => 
    philosophicalKeywords.some(keyword => 
      book.title.toLowerCase().includes(keyword)
    )
  );
  
  if (philosophicalTitles) score += 30;
  
  // Check for classical/religious authors
  const classicalKeywords = [
    'treatise', 'meditations', 'confessions', 'summa', 'institutes',
    'bible', 'scripture', 'theology', 'divine', 'sacred'
  ];
  
  const classicalTitles = books.some(book => 
    classicalKeywords.some(keyword => 
      book.title.toLowerCase().includes(keyword)
    )
  );
  
  if (classicalTitles) score += 25;
  
  // Check for complex literary works
  const complexKeywords = [
    'metamorphosis', 'allegory', 'satire', 'tragedy', 'comedy',
    'epic', 'ode', 'sonnet', 'verse', 'poetry'
  ];
  
  const complexTitles = books.some(book => 
    complexKeywords.some(keyword => 
      book.title.toLowerCase().includes(keyword)
    )
  );
  
  if (complexTitles) score += 15;
  
  // Check for foreign/translated works
  const foreignIndicators = [
    'translator', 'translated', 'french', 'german', 'latin', 'greek',
    'italian', 'spanish', 'russian'
  ];
  
  const hasTranslator = author.toLowerCase().includes('translator') ||
                       books.some(book => 
                         foreignIndicators.some(indicator => 
                           author.toLowerCase().includes(indicator)
                         )
                       );
  
  if (hasTranslator) score += 20;
  
  // Known difficult authors get bonus points
  const difficultAuthors = [
    'shakespeare', 'plato', 'aristotle', 'homer', 'virgil', 'dante',
    'cervantes', 'milton', 'swift', 'voltaire', 'rousseau', 'kant',
    'hegel', 'nietzsche', 'schopenhauer', 'kierkegaard', 'proust',
    'joyce', 'beckett', 'kafka', 'borges', 'calvino', 'nabokov'
  ];
  
  const normalizedAuthorName = normalizeAuthorName(author).toLowerCase();
  if (difficultAuthors.some(difficult => normalizedAuthorName.includes(difficult))) {
    score += 50;
  }
  
  return score;
}

// Main function
async function main() {
  console.log('🔄 Keeping only the most difficult 100 authors in English Literature...\n');
  
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
      booksByAuthor[normalizedAuthor] = {
        author: book.author, // Keep original author string for analysis
        books: []
      };
    }
    
    booksByAuthor[normalizedAuthor].books.push(book);
  }
  
  console.log(`👥 Found ${Object.keys(booksByAuthor).length} unique authors\n`);
  
  // Calculate difficulty scores for each author
  const authorScores = [];
  
  for (const [normalizedAuthor, data] of Object.entries(booksByAuthor)) {
    const score = calculateDifficultyScore(data.author, data.books);
    authorScores.push({
      normalizedAuthor,
      originalAuthor: data.author,
      books: data.books,
      score
    });
  }
  
  // Sort by difficulty score (highest first)
  authorScores.sort((a, b) => b.score - a.score);
  
  // Take only the top MAX_AUTHORS most difficult authors
  const topDifficultAuthors = authorScores.slice(0, MAX_AUTHORS);
  
  console.log(`📚 Selected top ${MAX_AUTHORS} most difficult authors:\n`);
  
  const selectedBooks = [];
  
  topDifficultAuthors.forEach((authorData, index) => {
    console.log(`${index + 1}. ${authorData.normalizedAuthor} (score: ${authorData.score}) - ${authorData.books.length} books`);
    selectedBooks.push(...authorData.books);
  });
  
  // Sort selected books by author name, then by title
  selectedBooks.sort((a, b) => {
    const authorA = normalizeAuthorName(a.author);
    const authorB = normalizeAuthorName(b.author);
    
    const authorCompare = authorA.localeCompare(authorB);
    if (authorCompare !== 0) return authorCompare;
    
    return a.title.localeCompare(b.title);
  });
  
  // Write the filtered file
  fs.writeFileSync(filePath, JSON.stringify(selectedBooks, null, 2));
  
  // Write removed authors to a separate file for reference
  const removedAuthors = authorScores.slice(MAX_AUTHORS);
  const removedBooks = removedAuthors.flatMap(author => author.books);
  
  fs.writeFileSync('removed-easy-authors-english-lit.json', JSON.stringify(removedBooks, null, 2));
  
  const removed = books.length - selectedBooks.length;
  
  console.log(`\n📊 FILTERING COMPLETE:`);
  console.log(`  📚 Original books: ${books.length}`);
  console.log(`  ✅ Kept books: ${selectedBooks.length}`);
  console.log(`  🗑️  Removed books: ${removed}`);
  console.log(`  👥 Kept authors: ${MAX_AUTHORS}`);
  console.log(`  👥 Removed authors: ${authorScores.length - MAX_AUTHORS}`);
  console.log(`  📈 Reduction: ${Math.round((removed / books.length) * 100)}%`);
  
  console.log(`\n📄 Updated english-literature.json with ${selectedBooks.length} books`);
  console.log(`📄 Removed books saved to: removed-easy-authors-english-lit.json`);
  
  // Show some examples of the most difficult authors
  console.log(`\n📋 Top 10 most difficult authors:`);
  topDifficultAuthors.slice(0, 10).forEach((author, index) => {
    const birthYear = getBirthYear(author.originalAuthor);
    console.log(`  ${index + 1}. ${author.normalizedAuthor} (${birthYear || 'unknown'} - score: ${author.score})`);
  });
}

main().catch(console.error);
