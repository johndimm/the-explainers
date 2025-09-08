import { checkWikipediaPage, getPersonWikipediaSearchTerm, getBookWikipediaSearchTerm } from '../utils/wikipedia'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Load the extracted categories
const categoriesPath = join(process.cwd(), 'src', 'data', 'style-categories.json')
const categories = JSON.parse(readFileSync(categoriesPath, 'utf8'))

// Test with a small subset of people (just a few from each category)
const TEST_PEOPLE = [
  'Barack Obama', // politics
  'Harold Bloom', // critics  
  'William Shakespeare', // writers
  'Jerry Seinfeld', // comedians
  'Oprah Winfrey', // talkShowHosts
  'Carl Sagan' // other
]

// Test with a small subset of books
const TEST_BOOKS = [
  { title: "Hamlet", author: "William Shakespeare" },
  { title: "Ulysses", author: "James Joyce" },
  { title: "Pride and Prejudice", author: "Jane Austen" },
  { title: "1984", author: "George Orwell" },
  { title: "A Midsummer Night's Dream", author: "William Shakespeare" }
]

interface WikipediaData {
  people: { [name: string]: { exists: boolean; url?: string; title?: string } }
  books: { [key: string]: { exists: boolean; url?: string; title?: string } }
  generatedAt: string
}

async function generateSmallWikipediaData(): Promise<WikipediaData> {
  console.log('🔍 Generating small Wikipedia data for testing...')
  
  const data: WikipediaData = {
    people: {},
    books: {},
    generatedAt: new Date().toISOString()
  }

  // Check test people
  console.log('👥 Checking test people...')
  for (const person of TEST_PEOPLE) {
    const searchTerm = getPersonWikipediaSearchTerm(person)
    console.log(`  Checking: ${person} (${searchTerm})`)
    
    try {
      const result = await checkWikipediaPage(searchTerm)
      data.people[person] = result
      console.log(`    ${result.exists ? '✅' : '❌'} ${result.exists ? 'Found' : 'Not found'}`)
    } catch (error) {
      console.error(`    ❌ Error checking ${person}:`, error)
      data.people[person] = { exists: false }
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Check test books
  console.log('📚 Checking test books...')
  for (const book of TEST_BOOKS) {
    const searchTerm = getBookWikipediaSearchTerm(book.title, book.author)
    const key = `${book.title} by ${book.author}`
    console.log(`  Checking: ${key} (${searchTerm})`)
    
    try {
      const result = await checkWikipediaPage(searchTerm)
      data.books[key] = result
      console.log(`    ${result.exists ? '✅' : '❌'} ${result.exists ? 'Found' : 'Not found'}`)
    } catch (error) {
      console.error(`    ❌ Error checking ${key}:`, error)
      data.books[key] = { exists: false }
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return data
}

async function main() {
  try {
    const data = await generateSmallWikipediaData()
    
    // Save to file
    const outputPath = join(process.cwd(), 'src', 'data', 'wikipedia-data-small.json')
    writeFileSync(outputPath, JSON.stringify(data, null, 2))
    
    console.log('\n✅ Small Wikipedia data generated successfully!')
    console.log(`📁 Saved to: ${outputPath}`)
    console.log(`📊 Summary:`)
    console.log(`   People: ${Object.values(data.people).filter(p => p.exists).length}/${Object.keys(data.people).length} have Wikipedia pages`)
    console.log(`   Books: ${Object.values(data.books).filter(b => b.exists).length}/${Object.keys(data.books).length} have Wikipedia pages`)
    console.log(`🕒 Generated at: ${data.generatedAt}`)
    
  } catch (error) {
    console.error('❌ Error generating Wikipedia data:', error)
    process.exit(1)
  }
}

main()
