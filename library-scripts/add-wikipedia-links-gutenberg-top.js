#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Wikipedia links for the missing books
const wikipediaLinks = {
  "A Doll's House": {
    url: "https://en.wikipedia.org/wiki/A_Doll%27s_House",
    title: "A Doll's House"
  },
  "The Call of the Wild": {
    url: "https://en.wikipedia.org/wiki/The_Call_of_the_Wild",
    title: "The Call of the Wild"
  },
  "The Wonderful Wizard of Oz": {
    url: "https://en.wikipedia.org/wiki/The_Wonderful_Wizard_of_Oz",
    title: "The Wonderful Wizard of Oz"
  },
  "The Adventures of Tom Sawyer": {
    url: "https://en.wikipedia.org/wiki/The_Adventures_of_Tom_Sawyer",
    title: "The Adventures of Tom Sawyer"
  },
  "Frankenstein; Or, The Modern Prometheus": {
    url: "https://en.wikipedia.org/wiki/Frankenstein",
    title: "Frankenstein"
  },
  "The Scarlet Letter": {
    url: "https://en.wikipedia.org/wiki/The_Scarlet_Letter",
    title: "The Scarlet Letter"
  }
};

// Main function
async function main() {
  console.log('🔄 Adding Wikipedia links to Gutenberg Top collection...\n');
  
  const gutenbergPath = path.join(process.cwd(), 'src', 'data', 'library', 'gutenberg-top.json');
  
  if (!fs.existsSync(gutenbergPath)) {
    console.log(`❌ File not found: gutenberg-top.json`);
    return;
  }
  
  const gutenbergContent = fs.readFileSync(gutenbergPath, 'utf8');
  const gutenbergBooks = JSON.parse(gutenbergContent);
  
  console.log(`📚 Total Gutenberg Top books: ${gutenbergBooks.length}\n`);
  
  // Find books without Wikipedia links
  const booksWithoutWiki = gutenbergBooks.filter(book => !book.wikipediaUrl || book.wikipediaUrl.trim() === '');
  
  console.log(`📋 Books needing Wikipedia links: ${booksWithoutWiki.length}`);
  booksWithoutWiki.forEach((book, index) => {
    console.log(`  ${index + 1}. "${book.title}" by ${book.author}`);
  });
  
  // Add Wikipedia links
  let updatedCount = 0;
  const updatedBooks = gutenbergBooks.map(book => {
    if (!book.wikipediaUrl || book.wikipediaUrl.trim() === '') {
      const linkData = wikipediaLinks[book.title];
      if (linkData) {
        updatedCount++;
        console.log(`\n✅ Adding Wikipedia link for "${book.title}"`);
        console.log(`   URL: ${linkData.url}`);
        console.log(`   Title: ${linkData.title}`);
        
        return {
          ...book,
          wikipediaUrl: linkData.url,
          wikipediaTitle: linkData.title
        };
      }
    }
    return book;
  });
  
  // Write updated file
  fs.writeFileSync(gutenbergPath, JSON.stringify(updatedBooks, null, 2));
  
  console.log(`\n📊 UPDATE COMPLETE:`);
  console.log(`  📚 Total books: ${gutenbergBooks.length}`);
  console.log(`  ✅ Wikipedia links added: ${updatedCount}`);
  console.log(`  📄 Updated gutenberg-top.json`);
  
  // Verify all books now have Wikipedia links
  const finalBooksWithWiki = updatedBooks.filter(book => book.wikipediaUrl && book.wikipediaUrl.trim() !== '');
  const finalBooksWithoutWiki = updatedBooks.filter(book => !book.wikipediaUrl || book.wikipediaUrl.trim() === '');
  
  console.log(`\n📊 FINAL STATUS:`);
  console.log(`  ✅ Books with Wikipedia links: ${finalBooksWithWiki.length}`);
  console.log(`  ❌ Books without Wikipedia links: ${finalBooksWithoutWiki.length}`);
  console.log(`  📈 Percentage with links: ${Math.round((finalBooksWithWiki.length / updatedBooks.length) * 100)}%`);
  
  if (finalBooksWithoutWiki.length > 0) {
    console.log(`\n⚠️  Books still without Wikipedia links:`);
    finalBooksWithoutWiki.forEach((book, index) => {
      console.log(`  ${index + 1}. "${book.title}" by ${book.author}`);
    });
  } else {
    console.log(`\n🎉 All books now have Wikipedia links!`);
  }
}

main().catch(console.error);
