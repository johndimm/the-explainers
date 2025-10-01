#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Updating plato.json with all Plato works...\n');
  
  const platoPath = path.join(process.cwd(), 'src', 'data', 'library', 'plato.json');
  const allBooksPath = path.join(process.cwd(), 'src', 'data', 'library', 'all-books.json');
  
  if (!fs.existsSync(platoPath)) {
    console.log(`❌ File not found: plato.json`);
    return;
  }
  
  if (!fs.existsSync(allBooksPath)) {
    console.log(`❌ File not found: all-books.json`);
    return;
  }
  
  const platoContent = fs.readFileSync(platoPath, 'utf8');
  const currentPlato = JSON.parse(platoContent);
  
  const allBooksContent = fs.readFileSync(allBooksPath, 'utf8');
  const allBooks = JSON.parse(allBooksContent);
  
  console.log(`🏛️ Current plato.json: ${currentPlato.length} works`);
  console.log(`📚 All books source: ${allBooks.length} books\n`);
  
  // Find all Plato works from all-books.json
  const allPlatoWorks = allBooks.filter(book => 
    book.author && (
      book.author.toLowerCase().includes('plato') ||
      book.author.toLowerCase().includes('platon')
    )
  );
  
  console.log(`🏛️ Found ${allPlatoWorks.length} Plato works in all-books.json`);
  
  // Sort by title
  allPlatoWorks.sort((a, b) => a.title.localeCompare(b.title));
  
  // Write the updated file
  fs.writeFileSync(platoPath, JSON.stringify(allPlatoWorks, null, 2));
  
  const added = allPlatoWorks.length - currentPlato.length;
  
  console.log(`\n📊 UPDATE COMPLETE:`);
  console.log(`  🏛️ Original plato.json: ${currentPlato.length} works`);
  console.log(`  ✅ Updated plato.json: ${allPlatoWorks.length} works`);
  console.log(`  ➕ Added: ${added} works`);
  
  console.log(`\n📄 Updated plato.json with ${allPlatoWorks.length} works`);
  
  // Show all Plato works
  console.log(`\n🏛️ All Plato works now in plato.json:`);
  allPlatoWorks.forEach((book, index) => {
    console.log(`  ${index + 1}. ${book.title}`);
  });
}

main().catch(console.error);
