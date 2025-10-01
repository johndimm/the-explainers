#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing language categorization...\n');

// Load the wiki-only library
const wikiLibrary = JSON.parse(fs.readFileSync('wiki-only-library.json', 'utf8'));
console.log(`📚 Loaded ${wikiLibrary.length} books with Wikipedia links\n`);

// Define proper language categories with more specific criteria
const categories = {
  'shakespeare': {
    keywords: ['Shakespeare', 'William Shakespeare'],
    filename: 'shakespeare.json'
  },
  'plato': {
    keywords: ['Plato'],
    filename: 'plato.json'
  },
  'philosophers': {
    keywords: ['Plato', 'Aristotle', 'Hume', 'Berkeley', 'Kant', 'Nietzsche', 'Descartes', 'Spinoza', 'Locke', 'Rousseau', 'Voltaire', 'Montesquieu', 'Hobbes', 'Mill', 'Bentham'],
    filename: 'philosophers.json',
    exclude: ['Shakespeare'] // Don't include Shakespeare in philosophers
  },
  'poetry': {
    keywords: ['Poems', 'Poetry', 'Verse', 'Sonnets', 'Ballads'],
    filename: 'poetry.json'
  },
  'history': {
    keywords: ['History', 'Memoir', 'Autobiography', 'Biography', 'Chronicle'],
    filename: 'history.json'
  },
  'french-literature': {
    // Only include books by actual French authors or books originally written in French
    keywords: ['France', 'French', 'Paris', 'Zola', 'Hugo', 'Flaubert', 'Balzac', 'Stendhal', 'Proust', 'Camus', 'Sartre', 'Voltaire', 'Dumas', 'Verne', 'Maupassant', 'Rousseau', 'Montesquieu', 'La Fontaine', 'Molière', 'Racine', 'Corneille', 'Anatole France', 'Colette', 'Gide', 'Malraux'],
    filename: 'french-literature.json',
    exclude: ['English', 'British', 'American', 'German', 'Spanish', 'Italian', 'Russian']
  },
  'german-literature': {
    keywords: ['German', 'Germany', 'Goethe', 'Schiller', 'Grimm', 'Kafka', 'Mann', 'Brecht', 'Hesse', 'Grass', 'Nietzsche', 'Heine', 'Rilke', 'Hoffmann'],
    filename: 'german-literature.json',
    exclude: ['English', 'British', 'American', 'French', 'Spanish', 'Italian', 'Russian']
  },
  'spanish-literature': {
    keywords: ['Spanish', 'Spain', 'Cervantes', 'Don Quixote', 'García', 'Lorca', 'Unamuno', 'Machado', 'Galdós', 'Bécquer'],
    filename: 'spanish-literature.json',
    exclude: ['English', 'British', 'American', 'French', 'German', 'Italian', 'Russian']
  },
  'italian-literature': {
    keywords: ['Italian', 'Italy', 'Dante', 'Boccaccio', 'Petrarch', 'Machiavelli', 'Pirandello', 'Verga', 'Manzoni'],
    filename: 'italian-literature.json',
    exclude: ['English', 'British', 'American', 'French', 'German', 'Spanish', 'Russian']
  },
  'russian-literature': {
    keywords: ['Russian', 'Russia', 'Dostoyevsky', 'Tolstoy', 'Chekhov', 'Pushkin', 'Gogol', 'Turgenev', 'Gorky', 'Bulgakov', 'Nabokov'],
    filename: 'russian-literature.json',
    exclude: ['English', 'British', 'American', 'French', 'German', 'Spanish', 'Italian']
  },
  'classical-literature': {
    keywords: ['Homer', 'Virgil', 'Ovid', 'Greek', 'Latin', 'Classical', 'Aristotle', 'Plato', 'Sophocles', 'Euripides', 'Aeschylus', 'Herodotus', 'Thucydides', 'Cicero', 'Caesar'],
    filename: 'classical-literature.json'
  },
  'english-literature': {
    keywords: ['English', 'British', 'American', 'Australian', 'Canadian', 'Irish', 'Scottish', 'Welsh'],
    filename: 'english-literature.json',
    exclude: ['French', 'German', 'Spanish', 'Italian', 'Russian', 'Greek', 'Latin', 'Shakespeare', 'Plato']
  }
};

// Function to categorize a book with better logic
function categorizeBook(book) {
  const title = book.title.toLowerCase();
  const author = book.author.toLowerCase();
  const text = `${title} ${author}`;
  
  const matches = [];
  
  for (const [categoryName, category] of Object.entries(categories)) {
    let isMatch = false;
    
    // Check if any keyword matches
    for (const keyword of category.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        isMatch = true;
        break;
      }
    }
    
    // Check exclusions - if any exclusion matches, don't include in this category
    if (isMatch && category.exclude) {
      for (const exclude of category.exclude) {
        if (text.includes(exclude.toLowerCase())) {
          isMatch = false;
          break;
        }
      }
    }
    
    if (isMatch) {
      matches.push(categoryName);
    }
  }
  
  return matches;
}

// Categorize all books
const categorizedBooks = {};
for (const categoryName of Object.keys(categories)) {
  categorizedBooks[categoryName] = [];
}

// Process each book
for (const book of wikiLibrary) {
  const matches = categorizeBook(book);
  
  if (matches.length === 0) {
    // Default to english-literature if no category matches
    categorizedBooks['english-literature'].push(book);
  } else {
    // Add to all matching categories
    for (const categoryName of matches) {
      categorizedBooks[categoryName].push(book);
    }
  }
}

// Sort books by author, then by title
function sortBooks(books) {
  return books.sort((a, b) => {
    const authorA = a.author.toLowerCase();
    const authorB = b.author.toLowerCase();
    if (authorA !== authorB) {
      return authorA.localeCompare(authorB);
    }
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
  });
}

// Write each category file
const outputDir = '../src/data/library';
let totalBooks = 0;

console.log('📝 Writing corrected library files...\n');

for (const [categoryName, books] of Object.entries(categorizedBooks)) {
  const sortedBooks = sortBooks(books);
  const filename = categories[categoryName].filename;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(sortedBooks, null, 2));
  console.log(`✅ ${categoryName.toUpperCase()}: ${sortedBooks.length} books -> ${filename}`);
  
  // Show sample books for verification
  if (sortedBooks.length > 0) {
    console.log(`   Sample: "${sortedBooks[0].title}" by ${sortedBooks[0].author}`);
  }
  
  totalBooks += sortedBooks.length;
}

console.log(`\n🎉 Generated ${Object.keys(categories).length} library files with ${totalBooks} total books`);
console.log(`📊 All books have Wikipedia links: 100% coverage`);

// Show specific verification for French Literature
console.log(`\n🔍 FRENCH LITERATURE VERIFICATION:`);
const frenchBooks = categorizedBooks['french-literature'];
frenchBooks.slice(0, 5).forEach(book => {
  console.log(`   - "${book.title}" by ${book.author}`);
});

