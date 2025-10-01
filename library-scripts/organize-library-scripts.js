#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Main function
async function main() {
  console.log('🔄 Organizing library scripts and files...\n');
  
  const rootPath = process.cwd();
  const scriptsDir = path.join(rootPath, 'library-scripts');
  
  // Create the scripts directory if it doesn't exist
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir);
    console.log(`📁 Created directory: library-scripts/`);
  }
  
  // Define files to move (library-related scripts and results)
  const filesToMove = [
    // Analysis scripts
    'analyze-french-literature.js',
    'analyze-german-literature.js',
    'analyze-gutenberg-top.js',
    'analyze-italian-literature.js',
    'analyze-spanish-literature.js',
    
    // Update/restore scripts
    'add-wikipedia-links-gutenberg-top.js',
    'restore-all-plato.js',
    'restore-all-shakespeare.js',
    'update-plato-file.js',
    'update-shakespeare-file.js',
    
    // Cleanup scripts
    'cleanup-library-files.js',
    'cleanup-library.js',
    'improve-poetry-collection.js',
    'remove-poetry-category.js',
    
    // Filtering scripts
    'filter-english-only-authors.js',
    'filter-shakespeare-authentic-only.js',
    'keep-difficult-authors-english-lit.js',
    
    // Library management scripts
    'check-downloads.js',
    'check-philosophy-downloads.js',
    'limit-english-literature-authors.js',
    'sort-english-literature.js',
    'update-english-literature-library.js',
    'update-philosophy-library.js',
    
    // Result files
    'download-check-results.json',
    'failed-downloads.json',
    'library-cleanup-results.json',
    'philosophy-download-results.json',
    'removed-easy-authors-english-lit.json',
    'removed-english-literature-excess.json',
    'removed-english-literature-failed.json',
    'removed-english-literature-skipped.json',
    'removed-non-english-authors.json',
    'removed-philosophy-books.json',
    'removed-shakespeare-spurious.json',
    'valid-books.json',
    'invalid-books.json',
    'validation-results.json'
  ];
  
  // Check which files actually exist
  const existingFiles = filesToMove.filter(file => fs.existsSync(path.join(rootPath, file)));
  const nonExistentFiles = filesToMove.filter(file => !fs.existsSync(path.join(rootPath, file)));
  
  console.log(`📦 Files to move: ${existingFiles.length}`);
  existingFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  
  if (nonExistentFiles.length > 0) {
    console.log(`\n⚠️  Files not found: ${nonExistentFiles.length}`);
    nonExistentFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
  }
  
  // Move the files
  console.log(`\n📦 Moving ${existingFiles.length} files to library-scripts/...`);
  
  let movedCount = 0;
  let errorCount = 0;
  
  existingFiles.forEach(file => {
    try {
      const sourcePath = path.join(rootPath, file);
      const destPath = path.join(scriptsDir, file);
      
      fs.renameSync(sourcePath, destPath);
      console.log(`  ✅ Moved: ${file}`);
      movedCount++;
    } catch (error) {
      console.log(`  ❌ Error moving ${file}: ${error.message}`);
      errorCount++;
    }
  });
  
  console.log(`\n📊 ORGANIZATION COMPLETE:`);
  console.log(`  📦 Files moved: ${movedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📁 All library scripts now in: library-scripts/`);
  
  // Show what remains in root
  const remainingFiles = fs.readdirSync(rootPath).filter(file => {
    const filePath = path.join(rootPath, file);
    return fs.statSync(filePath).isFile() && 
           !file.startsWith('.') && 
           file !== 'organize-library-scripts.js';
  });
  
  console.log(`\n📁 Remaining files in root: ${remainingFiles.length}`);
  remainingFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  
  // Create a README in the scripts directory
  const readmeContent = `# Library Scripts

This directory contains scripts and result files used during the library cleanup and organization process.

## Script Categories

### Analysis Scripts
- \`analyze-*-literature.js\` - Scripts to analyze Wikipedia link coverage
- \`add-wikipedia-links-gutenberg-top.js\` - Add missing Wikipedia links

### Update/Restore Scripts  
- \`restore-all-*.js\` - Restore complete collections for major authors
- \`update-*-file.js\` - Update specific library files

### Cleanup Scripts
- \`cleanup-library-files.js\` - Remove unneeded files from library directory
- \`remove-poetry-category.js\` - Remove the poetry category
- \`filter-*-only-*.js\` - Filter collections by various criteria

### Library Management
- \`check-*-downloads.js\` - Verify book downloads work
- \`limit-*-authors.js\` - Limit books per author
- \`sort-*.js\` - Sort collections
- \`update-*-library.js\` - Update library files with working books only

## Result Files
- \`*-results.json\` - Analysis results
- \`removed-*.json\` - Books that were removed during cleanup
- \`valid-books.json\` / \`invalid-books.json\` - Validation results

## Usage
These scripts were used to:
1. Clean up library collections by removing books without Wikipedia links
2. Restore complete collections for major authors (Shakespeare, Plato)
3. Filter out non-English authors from English Literature
4. Remove problematic categories (poetry)
5. Organize and validate the final library structure

The scripts are kept for reference and potential future use.
`;

  fs.writeFileSync(path.join(scriptsDir, 'README.md'), readmeContent);
  console.log(`\n📄 Created README.md in library-scripts/ directory`);
  
  console.log(`\n💡 Repository root is now clean and organized!`);
}

main().catch(console.error);
