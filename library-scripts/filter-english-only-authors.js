#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of known non-English authors that should be removed
const NON_ENGLISH_AUTHORS = [
  // Russian
  'dostoyevsky', 'dostoevsky', 'gogol', 'tolstoy', 'chekhov', 'turgenev',
  'pushkin', 'lermontov', 'gorky', 'andreyev', 'bulgakov',
  
  // German
  'kafka', 'goethe', 'schiller', 'heine', 'mann', 'hesse', 'brecht',
  'grimm', 'grimms', 'kant', 'nietzsche', 'schopenhauer', 'hegel',
  
  // French
  'proust', 'balzac', 'hugo', 'flaubert', 'zola', 'maupassant', 'dumas',
  'stendhal', 'verne', 'camus', 'sartre', 'voltaire', 'rousseau',
  'molière', 'molieres', 'la fayette', 'duras', 'prévost', 'prevost',
  
  // Italian
  'dante', 'machiavelli', 'boccaccio', 'petrarch', 'ariosto', 'tasso',
  'manzoni', 'leopardi', 'pirandello', 'calvino', 'moravia',
  
  // Spanish
  'cervantes', 'saavedra', 'lope', 'calderon', 'garcia lorca', 'unamuno',
  'gongora', 'quevedo', 'becquer',
  
  // Other European
  'ibsen', 'strindberg', 'lagerlöf', 'lagerlof', 'hamsun', 'andersen',
  'kierkegaard', 'borges', 'neruda', 'paz',
  
  // Classical/Ancient (Greek, Roman, etc.)
  'homer', 'plato', 'aristotle', 'socrates', 'epicurus', 'marcus aurelius',
  'seneca', 'cicero', 'ovid', 'virgil', 'horace', 'juvenal', 'tacitus',
  'josephus', 'apollonius', 'longinus', 'pliny',
  
  // Middle Eastern/Asian
  'omar khayyam', 'khayyam', 'rumi', 'confucius', 'lao tzu', 'sun tzu',
  
  // Other non-English
  'campanella', 'cats', 'halbertsma', 'gripenberg', 'loti', 'leblanc',
  'balagtas', 'benoît', 'benoit', 'huret', 'keim', 'kotzebue', 'loria',
  'grimaldi', 'henning', 'dexter', 'bulfinch', 'mackenzie', 'gally',
  'ingram', 'lucas', 'penn', 'cobbett', 'foote', 'ferrier', 'gregory',
  'grote', 'evelyn', 'cowley', 'farquhar', 'inchbald', 'malthus'
];

// Function to normalize author name for comparison
function normalizeAuthorName(author) {
  return author
    .toLowerCase()
    .replace(/\d{4}[\?\-]?\d{4}?[\?\-]?/g, '') // Remove birth/death dates
    .replace(/\[\w+\]/g, '') // Remove [Editor], [Translator], etc.
    .replace(/,\s*\d{4}[\?\-]?\d{4}?[\?\-]?/g, '') // Remove dates after commas
    .replace(/\s+--\s+.*$/g, '') // Remove everything after "--"
    .trim();
}

// Function to check if an author is non-English
function isNonEnglishAuthor(author) {
  const normalized = normalizeAuthorName(author);
  
  // Check against our list of non-English authors
  return NON_ENGLISH_AUTHORS.some(nonEnglish => 
    normalized.includes(nonEnglish) || nonEnglish.includes(normalized)
  );
}

// Function to extract main author name
function getMainAuthorName(author) {
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

// Main function
async function main() {
  console.log('🔄 Filtering English Literature to keep only English authors...\n');
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', 'english-literature.json');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: english-literature.json`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books\n`);
  
  const englishBooks = [];
  const nonEnglishBooks = [];
  
  for (const book of books) {
    const mainAuthor = getMainAuthorName(book.author);
    
    if (isNonEnglishAuthor(book.author) || isNonEnglishAuthor(mainAuthor)) {
      nonEnglishBooks.push({
        ...book,
        mainAuthor
      });
    } else {
      englishBooks.push(book);
    }
  }
  
  // Sort English books by author name, then by title
  englishBooks.sort((a, b) => {
    const authorA = getMainAuthorName(a.author);
    const authorB = getMainAuthorName(b.author);
    
    const authorCompare = authorA.localeCompare(authorB);
    if (authorCompare !== 0) return authorCompare;
    
    return a.title.localeCompare(b.title);
  });
  
  // Write the filtered file
  fs.writeFileSync(filePath, JSON.stringify(englishBooks, null, 2));
  
  // Write removed books to a separate file for reference
  fs.writeFileSync('removed-non-english-authors.json', JSON.stringify(nonEnglishBooks, null, 2));
  
  const removed = books.length - englishBooks.length;
  
  console.log(`📊 FILTERING COMPLETE:`);
  console.log(`  📚 Original books: ${books.length}`);
  console.log(`  ✅ English books kept: ${englishBooks.length}`);
  console.log(`  🗑️  Non-English books removed: ${removed}`);
  console.log(`  📈 Reduction: ${Math.round((removed / books.length) * 100)}%`);
  
  console.log(`\n📄 Updated english-literature.json with ${englishBooks.length} books`);
  console.log(`📄 Removed books saved to: removed-non-english-authors.json`);
  
  // Show some examples of removed non-English authors
  const removedAuthors = [...new Set(nonEnglishBooks.map(book => book.mainAuthor))];
  console.log(`\n🗑️  Examples of removed non-English authors:`);
  removedAuthors.slice(0, 20).forEach((author, index) => {
    console.log(`  ${index + 1}. ${author}`);
  });
  
  if (removedAuthors.length > 20) {
    console.log(`  ... and ${removedAuthors.length - 20} more`);
  }
  
  // Show some examples of kept English authors
  const keptAuthors = [...new Set(englishBooks.map(book => getMainAuthorName(book.author)))];
  console.log(`\n✅ Examples of kept English authors:`);
  keptAuthors.slice(0, 20).forEach((author, index) => {
    console.log(`  ${index + 1}. ${author}`);
  });
  
  if (keptAuthors.length > 20) {
    console.log(`  ... and ${keptAuthors.length - 20} more`);
  }
}

main().catch(console.error);
