#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Removing poetry category from library...\n');
  
  const poetryPath = path.join(process.cwd(), 'src', 'data', 'library', 'poetry.json');
  
  if (!fs.existsSync(poetryPath)) {
    console.log(`❌ File not found: poetry.json`);
    return;
  }
  
  // Read current poetry file to show what we're removing
  const poetryContent = fs.readFileSync(poetryPath, 'utf8');
  const poetryBooks = JSON.parse(poetryContent);
  
  console.log(`📚 Poetry collection to be removed: ${poetryBooks.length} works`);
  console.log(`\n📋 Works being removed:`);
  poetryBooks.forEach((book, index) => {
    console.log(`  ${index + 1}. "${book.title}" by ${book.author}`);
  });
  
  // Remove the poetry.json file
  fs.unlinkSync(poetryPath);
  
  console.log(`\n✅ REMOVAL COMPLETE:`);
  console.log(`  🗑️ Removed poetry.json file`);
  console.log(`  📚 Poetry category will no longer appear in the library`);
  
  console.log(`\n💡 Reason for removal:`);
  console.log(`   - Only 7 works (too small for a meaningful category)`);
  console.log(`   - Missing major English poets (Milton, Keats, Shelley, Wordsworth, Byron, etc.)`);
  console.log(`   - Collection lacks canonical poetry works`);
  console.log(`   - Better to focus on comprehensive categories like Shakespeare and Plato`);
  
  console.log(`\n📝 Note: The poetry category has been removed from the library.`);
  console.log(`   Users can still find poetry works in other categories if they exist.`);
}

main().catch(console.error);
