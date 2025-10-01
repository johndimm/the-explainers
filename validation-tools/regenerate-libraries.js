#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Regenerating library files from wiki-only-library.json...\n');

// Load the wiki-only library
const wikiLibrary = JSON.parse(fs.readFileSync('wiki-only-library.json', 'utf8'));
console.log(`📚 Loaded ${wikiLibrary.length} books with Wikipedia links\n`);

// Define categories and their criteria
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
    keywords: ['Plato', 'Aristotle', 'Hume', 'Berkeley', 'Kant', 'Nietzsche', 'Descartes', 'Spinoza', 'Locke', 'Rousseau', 'Voltaire', 'Montesquieu'],
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
  'english-literature': {
    keywords: ['English', 'British', 'American', 'Australian', 'Canadian'],
    filename: 'english-literature.json',
    exclude: ['French', 'German', 'Spanish', 'Italian', 'Russian', 'Greek', 'Latin', 'Shakespeare', 'Plato']
  },
  'french-literature': {
    keywords: ['French', 'France'],
    filename: 'french-literature.json'
  },
  'german-literature': {
    keywords: ['German', 'Germany', 'Goethe', 'Schiller', 'Grimm'],
    filename: 'german-literature.json'
  },
  'spanish-literature': {
    keywords: ['Spanish', 'Spain', 'Cervantes', 'Don Quixote'],
    filename: 'spanish-literature.json'
  },
  'italian-literature': {
    keywords: ['Italian', 'Italy', 'Dante', 'Boccaccio'],
    filename: 'italian-literature.json'
  },
  'russian-literature': {
    keywords: ['Russian', 'Russia', 'Dostoyevsky', 'Tolstoy', 'Chekhov'],
    filename: 'russian-literature.json'
  },
  'classical-literature': {
    keywords: ['Homer', 'Virgil', 'Ovid', 'Greek', 'Latin', 'Classical'],
    filename: 'classical-literature.json'
  }
};

// Function to categorize a book
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
    
    // Check exclusions
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

for (const [categoryName, books] of Object.entries(categorizedBooks)) {
  const sortedBooks = sortBooks(books);
  const filename = categories[categoryName].filename;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(sortedBooks, null, 2));
  console.log(`✅ ${categoryName.toUpperCase()}: ${sortedBooks.length} books -> ${filename}`);
  totalBooks += sortedBooks.length;
}

console.log(`\n🎉 Generated ${Object.keys(categories).length} library files with ${totalBooks} total books`);
console.log(`📊 All books have Wikipedia links: 100% coverage`);
