#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Analyzing and improving poetry collection...\n');
  
  const poetryPath = path.join(process.cwd(), 'src', 'data', 'library', 'poetry.json');
  
  if (!fs.existsSync(poetryPath)) {
    console.log(`❌ File not found: poetry.json`);
    return;
  }
  
  const poetryContent = fs.readFileSync(poetryPath, 'utf8');
  const poetryBooks = JSON.parse(poetryContent);
  
  console.log(`📚 Current poetry collection: ${poetryBooks.length} works\n`);
  
  // Analyze current collection
  console.log('📋 Current poetry works:');
  poetryBooks.forEach((book, index) => {
    console.log(`  ${index + 1}. "${book.title}" by ${book.author}`);
  });
  
  // Check for problematic entries
  const problematicEntries = poetryBooks.filter(book => {
    // Check for weird entries
    return (
      book.title.length < 3 || // Very short titles
      book.author.includes('Latin --') || // Latin entries
      book.author.includes('Epistolary poetry') || // Weird author fields
      !book.author || // Missing author
      book.title === book.author || // Title same as author
      book.title.includes('Q. Horatii') // Latin titles
    );
  });
  
  console.log(`\n🚨 Found ${problematicEntries.length} problematic entries:`);
  problematicEntries.forEach((book, index) => {
    console.log(`  ${index + 1}. "${book.title}" - ${book.author}`);
  });
  
  // Clean up the collection
  const cleanedPoetry = poetryBooks.filter(book => {
    return !(
      book.title.length < 3 ||
      book.author.includes('Latin --') ||
      book.author.includes('Epistolary poetry') ||
      !book.author ||
      book.title === book.author ||
      book.title.includes('Q. Horatii')
    );
  });
  
  console.log(`\n📊 CLEANUP RESULTS:`);
  console.log(`  📚 Original works: ${poetryBooks.length}`);
  console.log(`  ✅ Cleaned works: ${cleanedPoetry.length}`);
  console.log(`  🗑️ Removed problematic: ${poetryBooks.length - cleanedPoetry.length}`);
  
  if (cleanedPoetry.length < 5) {
    console.log(`\n❌ Poetry collection is too small (${cleanedPoetry.length} works) and lacks major poets.`);
    console.log(`   Recommendation: Remove poetry category entirely.`);
    
    // Ask user what to do
    console.log(`\n🔧 Options:`);
    console.log(`   1. Remove poetry.json entirely`);
    console.log(`   2. Keep the cleaned version (${cleanedPoetry.length} works)`);
    console.log(`   3. Cancel and keep current version`);
    
    // For now, let's remove the problematic entries and see what we have
    if (cleanedPoetry.length > 0) {
      fs.writeFileSync(poetryPath, JSON.stringify(cleanedPoetry, null, 2));
      console.log(`\n✅ Cleaned poetry.json with ${cleanedPoetry.length} works`);
    } else {
      console.log(`\n🗑️ No valid poetry works remaining. Consider removing the file.`);
    }
  } else {
    // Clean up and save
    fs.writeFileSync(poetryPath, JSON.stringify(cleanedPoetry, null, 2));
    console.log(`\n✅ Cleaned poetry.json with ${cleanedPoetry.length} works`);
  }
  
  console.log(`\n📋 Cleaned poetry works:`);
  cleanedPoetry.forEach((book, index) => {
    console.log(`  ${index + 1}. "${book.title}" by ${book.author}`);
  });
  
  console.log(`\n💡 Note: This collection lacks major English poets like Milton, Keats, Shelley, Wordsworth, Byron, etc.`);
  console.log(`   Consider whether this category adds value to the library.`);
}

main().catch(console.error);
