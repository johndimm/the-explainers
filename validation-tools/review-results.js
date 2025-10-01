const fs = require('fs');

function reviewResults() {
  console.log('📄 Reviewing Validation Results\n');
  
  if (!fs.existsSync('validation-results.json')) {
    console.log('❌ No validation-results.json file found. Run careful-validation.js first.');
    return;
  }
  
  const results = JSON.parse(fs.readFileSync('validation-results.json', 'utf8'));
  
  console.log(`📅 Validation completed: ${results.timestamp}`);
  console.log(`⚙️  Config: Stop on first error: ${results.config.stopOnFirstError}, Max books: ${results.config.maxBooksToCheck || 'ALL'}\n`);
  
  let totalValid = 0;
  let totalInvalid = 0;
  let totalBooks = 0;
  
  for (const [filename, fileResults] of Object.entries(results.files)) {
    console.log(`📚 ${filename}:`);
    console.log(`  ✅ Valid: ${fileResults.valid}`);
    console.log(`  ❌ Invalid: ${fileResults.invalid}`);
    console.log(`  📊 Total: ${fileResults.total}`);
    
    if (fileResults.invalid > 0) {
      console.log(`  🔍 Invalid books:`);
      fileResults.books
        .filter(book => !book.isValid)
        .forEach(book => {
          console.log(`    - "${book.title}" by ${book.author}`);
          console.log(`      Expected: "${book.title}" by "${book.author}"`);
          console.log(`      Found: "${book.actualTitle}" by "${book.actualAuthor}"`);
          console.log(`      Reason: ${book.reason}`);
          console.log(`      URL: ${book.workingUrl}`);
          console.log('');
        });
    }
    
    totalValid += fileResults.valid;
    totalInvalid += fileResults.invalid;
    totalBooks += fileResults.total;
    console.log('');
  }
  
  console.log('📊 SUMMARY:');
  console.log(`  📚 Total books checked: ${totalBooks}`);
  console.log(`  ✅ Valid books: ${totalValid}`);
  console.log(`  ❌ Invalid books: ${totalInvalid}`);
  console.log(`  📈 Success rate: ${totalBooks > 0 ? Math.round((totalValid / totalBooks) * 100) : 0}%`);
  
  if (totalInvalid > 0) {
    console.log('\n⚠️  Invalid books found. Review the details above before making changes.');
  } else {
    console.log('\n🎉 All checked books are valid!');
  }
}

reviewResults();
