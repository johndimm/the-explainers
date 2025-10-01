#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Updating shakespeare.json with all authentic works...\n');
  
  const shakespearePath = path.join(process.cwd(), 'src', 'data', 'library', 'shakespeare.json');
  const allBooksPath = path.join(process.cwd(), 'src', 'data', 'library', 'all-books.json');
  
  if (!fs.existsSync(shakespearePath)) {
    console.log(`❌ File not found: shakespeare.json`);
    return;
  }
  
  if (!fs.existsSync(allBooksPath)) {
    console.log(`❌ File not found: all-books.json`);
    return;
  }
  
  const shakespeareContent = fs.readFileSync(shakespearePath, 'utf8');
  const currentShakespeare = JSON.parse(shakespeareContent);
  
  const allBooksContent = fs.readFileSync(allBooksPath, 'utf8');
  const allBooks = JSON.parse(allBooksContent);
  
  console.log(`🎭 Current shakespeare.json: ${currentShakespeare.length} works`);
  console.log(`📚 All books source: ${allBooks.length} books\n`);
  
  // Find all authentic Shakespeare works from all-books.json
  const allShakespeareWorks = allBooks.filter(book => 
    book.author && book.author.includes('Shakespeare, William, 1564-1616')
  );
  
  console.log(`🎭 Found ${allShakespeareWorks.length} authentic Shakespeare works in all-books.json`);
  
  // Convert to the format expected by shakespeare.json (simplified author format)
  const formattedShakespeareWorks = allShakespeareWorks.map(book => ({
    id: book.id,
    title: book.title,
    author: "William Shakespeare",
    wikipediaUrl: book.wikipediaUrl,
    wikipediaTitle: book.wikipediaTitle
  }));
  
  // Sort by title
  formattedShakespeareWorks.sort((a, b) => a.title.localeCompare(b.title));
  
  // Write the updated file
  fs.writeFileSync(shakespearePath, JSON.stringify(formattedShakespeareWorks, null, 2));
  
  const added = formattedShakespeareWorks.length - currentShakespeare.length;
  
  console.log(`\n📊 UPDATE COMPLETE:`);
  console.log(`  🎭 Original shakespeare.json: ${currentShakespeare.length} works`);
  console.log(`  ✅ Updated shakespeare.json: ${formattedShakespeareWorks.length} works`);
  console.log(`  ➕ Added: ${added} works`);
  
  console.log(`\n📄 Updated shakespeare.json with ${formattedShakespeareWorks.length} works`);
  
  // Show all Shakespeare works
  console.log(`\n🎭 All Shakespeare works now in shakespeare.json:`);
  formattedShakespeareWorks.forEach((book, index) => {
    console.log(`  ${index + 1}. ${book.title}`);
  });
}

main().catch(console.error);
