// Test special case handling for books with non-numeric IDs or local files

async function validateBook(book) {
  if (!book.id || !book.title || !book.author) {
    return { 
      isValid: false, 
      reason: 'Missing required fields (id, title, or author)',
      actualTitle: '',
      actualAuthor: '',
      workingUrl: ''
    };
  }

  console.log(`\n🔍 Checking: "${book.title}" by ${book.author} (ID: ${book.id})`);

  // Check if this is a special case (non-numeric ID or local file)
  if (book.localPath || book.directUrl || isNaN(book.id)) {
    console.log(`    ℹ️  Special case detected - skipping Project Gutenberg validation`);
    return {
      isValid: true,
      reason: 'Special case (local file or non-PG source)',
      actualTitle: book.title,
      actualAuthor: book.author,
      workingUrl: book.directUrl || book.localPath || 'N/A'
    };
  }

  // For numeric IDs, would try Project Gutenberg URLs
  console.log(`    Would try Project Gutenberg URLs for numeric ID: ${book.id}`);
  return {
    isValid: false,
    reason: 'Would validate against Project Gutenberg',
    actualTitle: '',
    actualAuthor: '',
    workingUrl: ''
  };
}

// Test cases
const testBooks = [
  {
    id: "1524",
    title: "Hamlet",
    author: "William Shakespeare"
  },
  {
    id: "finnegans-wake",
    title: "Finnegans Wake",
    author: "James Joyce",
    localPath: "public-domain-texts/finnegans-wake.txt"
  },
  {
    id: "4300",
    title: "Ulysses",
    author: "James Joyce",
    directUrl: "https://www.gutenberg.org/files/4300/4300-0.txt"
  }
];

async function testSpecialCases() {
  console.log('🧪 Testing Special Case Handling\n');
  
  for (const book of testBooks) {
    const result = await validateBook(book);
    
    console.log(`📊 Result: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`Reason: ${result.reason}`);
    console.log(`Working URL: ${result.workingUrl}`);
    console.log('='.repeat(50));
  }
}

testSpecialCases().catch(console.error);
