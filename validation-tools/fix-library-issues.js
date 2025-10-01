const fs = require('fs');
const path = require('path');

// Known problematic entries to fix
const FIXES = {
  'english-literature.json': [
    {
      id: "33513",
      title: "The Frightened Planet",
      author: "Jane Austen",
      action: "remove",
      reason: "Sidney Austen is not a classic author - this should be removed"
    },
    {
      id: "23366",
      title: "A Philanthropist",
      author: "Bacon",
      action: "fix_author",
      newAuthor: "Francis Bacon",
      reason: "Should be Francis Bacon, not just Bacon"
    },
    {
      id: "42692",
      title: "An Idyll of All Fools' Day",
      author: "Bacon",
      action: "fix_author",
      newAuthor: "Francis Bacon",
      reason: "Should be Francis Bacon, not just Bacon"
    },
    {
      id: "22310",
      title: "In the Border Country",
      author: "Bacon",
      action: "fix_author",
      newAuthor: "Francis Bacon",
      reason: "Should be Francis Bacon, not just Bacon"
    },
    {
      id: "23365",
      title: "In The Valley Of The Shadow",
      author: "Bacon",
      action: "fix_author",
      newAuthor: "Francis Bacon",
      reason: "Should be Francis Bacon, not just Bacon"
    },
    {
      id: "59163",
      title: "Index of the Project Gutenberg Works of Francis Bacon",
      author: "Bacon",
      action: "fix_author",
      newAuthor: "Francis Bacon",
      reason: "Should be Francis Bacon, not just Bacon"
    },
    {
      id: "23367",
      title: "Julia The Apostate",
      author: "Bacon",
      action: "fix_author",
      newAuthor: "Francis Bacon",
      reason: "Should be Francis Bacon, not just Bacon"
    },
    {
      id: "71888",
      title: "Lives of the apostles of Jesus Christ",
      author: "Bacon",
      action: "fix_author",
      newAuthor: "Francis Bacon",
      reason: "Should be Francis Bacon, not just Bacon"
    },
    {
      id: "26277",
      title: "Margarita's Soul: The Romantic Recollections of a Man of Fifty",
      author: "Bacon",
      action: "fix_author",
      newAuthor: "Francis Bacon",
      reason: "Should be Francis Bacon, not just Bacon"
    },
    {
      id: "23369",
      title: "Mrs. Dud's Sister",
      author: "Bacon",
      action: "fix_author",
      newAuthor: "Francis Bacon",
      reason: "Should be Francis Bacon, not just Bacon"
    },
    {
      id: "2434",
      title: "New Atlantis",
      author: "Bacon",
      action: "fix_author",
      newAuthor: "Francis Bacon",
      reason: "Should be Francis Bacon, not just Bacon"
    }
  ]
};

function fixLibraryFile(filename, fixes) {
  console.log(`\n🔧 Fixing ${filename}...`);
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return { fixed: 0, removed: 0, errors: 0 };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books`);
  
  let fixed = 0;
  let removed = 0;
  let errors = 0;
  
  // Create a map of fixes by ID for quick lookup
  const fixesMap = {};
  fixes.forEach(fix => {
    fixesMap[fix.id] = fix;
  });
  
  // Process each book
  const updatedBooks = books.filter(book => {
    const fix = fixesMap[book.id];
    
    if (!fix) {
      return true; // Keep the book as is
    }
    
    console.log(`  🔍 Processing: "${book.title}" by ${book.author}`);
    
    try {
      if (fix.action === 'remove') {
        console.log(`    🗑️  Removing: ${fix.reason}`);
        removed++;
        return false; // Remove this book
      } else if (fix.action === 'fix_author') {
        console.log(`    ✏️  Fixing author: ${book.author} → ${fix.newAuthor}`);
        book.author = fix.newAuthor;
        fixed++;
        return true; // Keep the book with updated author
      } else {
        console.log(`    ⚠️  Unknown action: ${fix.action}`);
        errors++;
        return true; // Keep the book as is
      }
    } catch (error) {
      console.log(`    ❌ Error processing book: ${error.message}`);
      errors++;
      return true; // Keep the book as is
    }
  });
  
  // Write the updated file
  try {
    fs.writeFileSync(filePath, JSON.stringify(updatedBooks, null, 2));
    console.log(`  💾 Updated file saved`);
  } catch (error) {
    console.log(`  ❌ Error saving file: ${error.message}`);
    errors++;
  }
  
  console.log(`\n📊 Results for ${filename}:`);
  console.log(`  ✏️  Fixed: ${fixed}`);
  console.log(`  🗑️  Removed: ${removed}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log(`  📚 Final count: ${updatedBooks.length} books`);
  
  return { fixed, removed, errors };
}

function main() {
  console.log('🔧 Library Issues Fix Script');
  console.log('This will fix specific author attribution issues...\n');
  
  let totalFixed = 0;
  let totalRemoved = 0;
  let totalErrors = 0;
  
  for (const [filename, fixes] of Object.entries(FIXES)) {
    const result = fixLibraryFile(filename, fixes);
    totalFixed += result.fixed;
    totalRemoved += result.removed;
    totalErrors += result.errors;
  }
  
  console.log('\n📊 OVERALL RESULTS:');
  console.log(`  ✏️  Total fixed: ${totalFixed}`);
  console.log(`  🗑️  Total removed: ${totalRemoved}`);
  console.log(`  ❌ Total errors: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('\n🎉 All fixes applied successfully!');
  } else {
    console.log('\n⚠️  Some errors occurred during the fix process.');
  }
}

main().catch(console.error);
