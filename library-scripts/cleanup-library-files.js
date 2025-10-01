#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Cleaning up unneeded files from data/library...\n');
  
  const libraryPath = path.join(process.cwd(), 'src', 'data', 'library');
  
  if (!fs.existsSync(libraryPath)) {
    console.log(`❌ Directory not found: ${libraryPath}`);
    return;
  }
  
  const files = fs.readdirSync(libraryPath);
  
  console.log(`📁 Found ${files.length} files in library directory\n`);
  
  // Define files to remove
  const filesToRemove = [
    // Backup files
    'english-literature.json.backup',
    'english-literature.json.backup-before-wiki-replacement', 
    'english-literature.json.old',
    'french-literature.json.backup',
    'german-literature.json.backup',
    'gutenberg-top.json.backup',
    'italian-literature.json.backup',
    'philosophers.json.backup',
    'poetry.json.backup',
    'shakespeare.json.backup',
    'spanish-literature.json.backup',
    
    // Large source files no longer needed
    'all-books.json', // This was used as a source, no longer needed
    
    // Other unneeded files
    'library-screenshot.png', // Screenshot file
    'README-NEW-LIBRARIES.md', // Documentation file
    
    // Files that might be duplicates or experimental
    'classical-literature.json', // Might be covered by other categories
    'discovered-works.json', // Experimental file
    'enhanced-wikipedia-gutenberg.json', // Experimental file
    'russian-literature.json' // We removed non-English authors from English lit
  ];
  
  // Check which files actually exist
  const existingFilesToRemove = filesToRemove.filter(file => files.includes(file));
  const nonExistentFiles = filesToRemove.filter(file => !files.includes(file));
  
  console.log(`🗑️  Files to remove: ${existingFilesToRemove.length}`);
  existingFilesToRemove.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  
  if (nonExistentFiles.length > 0) {
    console.log(`\n⚠️  Files not found (already removed): ${nonExistentFiles.length}`);
    nonExistentFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
  }
  
  // Show files that will remain
  const filesToKeep = files.filter(file => !filesToRemove.includes(file));
  console.log(`\n📚 Files to keep: ${filesToKeep.length}`);
  filesToKeep.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  
  // Remove the files
  console.log(`\n🗑️  Removing ${existingFilesToRemove.length} files...`);
  
  let removedCount = 0;
  let errorCount = 0;
  
  existingFilesToRemove.forEach(file => {
    try {
      const filePath = path.join(libraryPath, file);
      fs.unlinkSync(filePath);
      console.log(`  ✅ Removed: ${file}`);
      removedCount++;
    } catch (error) {
      console.log(`  ❌ Error removing ${file}: ${error.message}`);
      errorCount++;
    }
  });
  
  console.log(`\n📊 CLEANUP COMPLETE:`);
  console.log(`  🗑️  Files removed: ${removedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📚 Files remaining: ${filesToKeep.length}`);
  
  // Show final directory contents
  const finalFiles = fs.readdirSync(libraryPath);
  console.log(`\n📁 Final library directory contents:`);
  finalFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  
  console.log(`\n💡 The library directory is now clean with only essential files!`);
}

main().catch(console.error);
