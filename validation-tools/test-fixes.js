const fs = require('fs');
const path = require('path');

function testFixes() {
  console.log('🧪 Testing Library Fixes\n');
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', 'english-literature.json');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ English literature file not found');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📚 Total books in English literature: ${books.length}`);
  
  // Test 1: Check if Sidney Austen book was removed
  const sidneyAustenBook = books.find(book => 
    book.id === "33513" && book.title === "The Frightened Planet" && book.author === "Jane Austen"
  );
  
  if (sidneyAustenBook) {
    console.log('❌ Sidney Austen book still present (should be removed)');
  } else {
    console.log('✅ Sidney Austen book successfully removed');
  }
  
  // Test 2: Check if Bacon books were fixed to Francis Bacon
  const baconBooks = books.filter(book => book.author === "Bacon");
  const francisBaconBooks = books.filter(book => book.author === "Francis Bacon");
  
  console.log(`\n📊 Bacon author attribution test:`);
  console.log(`  Books with "Bacon": ${baconBooks.length}`);
  console.log(`  Books with "Francis Bacon": ${francisBaconBooks.length}`);
  
  if (baconBooks.length === 0) {
    console.log('✅ All Bacon books successfully updated to Francis Bacon');
  } else {
    console.log('❌ Some books still have "Bacon" instead of "Francis Bacon":');
    baconBooks.slice(0, 3).forEach(book => {
      console.log(`    - "${book.title}" (ID: ${book.id})`);
    });
  }
  
  // Test 3: Check specific books that should have been fixed
  const expectedFixes = [
    { id: "23366", title: "A Philanthropist", expectedAuthor: "Francis Bacon" },
    { id: "42692", title: "An Idyll of All Fools' Day", expectedAuthor: "Francis Bacon" },
    { id: "22310", title: "In the Border Country", expectedAuthor: "Francis Bacon" },
    { id: "2434", title: "New Atlantis", expectedAuthor: "Francis Bacon" }
  ];
  
  console.log(`\n🔍 Checking specific book fixes:`);
  let allFixed = true;
  
  expectedFixes.forEach(expected => {
    const book = books.find(b => b.id === expected.id);
    if (book) {
      if (book.author === expected.expectedAuthor) {
        console.log(`  ✅ "${book.title}" correctly attributed to ${book.author}`);
      } else {
        console.log(`  ❌ "${book.title}" has wrong author: ${book.author} (expected: ${expected.expectedAuthor})`);
        allFixed = false;
      }
    } else {
      console.log(`  ⚠️  Book with ID ${expected.id} not found`);
      allFixed = false;
    }
  });
  
  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`  Sidney Austen book removed: ${!sidneyAustenBook ? '✅' : '❌'}`);
  console.log(`  Bacon books fixed: ${baconBooks.length === 0 ? '✅' : '❌'}`);
  console.log(`  Specific fixes verified: ${allFixed ? '✅' : '❌'}`);
  
  if (!sidneyAustenBook && baconBooks.length === 0 && allFixed) {
    console.log('\n🎉 All fixes applied successfully!');
  } else {
    console.log('\n⚠️  Some fixes may not have been applied correctly.');
  }
}

testFixes();
