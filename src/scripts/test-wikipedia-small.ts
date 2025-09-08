import { checkWikipediaPage, getPersonWikipediaSearchTerm, getBookWikipediaSearchTerm } from '../utils/wikipedia'

// Test with a small subset to validate the method
const TEST_PEOPLE = [
  'Barack Obama',
  'Harold Bloom', 
  'William Shakespeare',
  'T.S. Eliot'
]

const TEST_BOOKS = [
  { title: "Hamlet", author: "William Shakespeare" },
  { title: "Ulysses", author: "James Joyce" },
  { title: "Pride and Prejudice", author: "Jane Austen" },
  { title: "1984", author: "George Orwell" }
]

async function testWikipediaLookup() {
  console.log('🧪 Testing Wikipedia lookup with small subset...\n')
  
  console.log('👥 Testing People:')
  for (const person of TEST_PEOPLE) {
    const searchTerm = getPersonWikipediaSearchTerm(person)
    console.log(`  Testing: ${person} (${searchTerm})`)
    
    try {
      const result = await checkWikipediaPage(searchTerm)
      console.log(`    ${result.exists ? '✅' : '❌'} ${result.exists ? 'Found' : 'Not found'}`)
      if (result.exists) {
        console.log(`    URL: ${result.url}`)
        console.log(`    Title: ${result.title}`)
      }
    } catch (error) {
      console.error(`    ❌ Error:`, error)
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log('\n📚 Testing Books:')
  for (const book of TEST_BOOKS) {
    const searchTerm = getBookWikipediaSearchTerm(book.title, book.author)
    const key = `${book.title} by ${book.author}`
    console.log(`  Testing: ${key} (${searchTerm})`)
    
    try {
      const result = await checkWikipediaPage(searchTerm)
      console.log(`    ${result.exists ? '✅' : '❌'} ${result.exists ? 'Found' : 'Not found'}`)
      if (result.exists) {
        console.log(`    URL: ${result.url}`)
        console.log(`    Title: ${result.title}`)
      }
    } catch (error) {
      console.error(`    ❌ Error:`, error)
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log('\n✅ Test completed!')
}

// Run the test
testWikipediaLookup().catch(console.error)
