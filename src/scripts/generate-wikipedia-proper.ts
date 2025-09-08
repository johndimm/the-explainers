import { checkWikipediaPage, getPersonWikipediaSearchTerm, getBookWikipediaSearchTerm } from '../utils/wikipedia'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Load the extracted categories
const categoriesPath = join(process.cwd(), 'src', 'data', 'style-categories.json')
const categories = JSON.parse(readFileSync(categoriesPath, 'utf8'))

// Test with a small subset of books (just a few from each category)
const TEST_BOOKS = [
  // Shakespeare (no author in library)
  { title: "Hamlet", author: "William Shakespeare" },
  { title: "A Midsummer Night's Dream", author: "William Shakespeare" },
  { title: "Macbeth", author: "William Shakespeare" },
  { title: "Romeo and Juliet", author: "William Shakespeare" },
  
  // English Literature (with authors)
  { title: "Ulysses", author: "James Joyce" },
  { title: "Pride and Prejudice", author: "Jane Austen" },
  { title: "1984", author: "George Orwell" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  
  // A few more classics
  { title: "Moby Dick", author: "Herman Melville" },
  { title: "War and Peace", author: "Leo Tolstoy" }
]

interface WikipediaData {
  people: { [name: string]: { exists: boolean; url?: string; title?: string } }
  books: { [key: string]: { exists: boolean; url?: string; title?: string } }
  generatedAt: string
}

async function generateProperWikipediaData(): Promise<WikipediaData> {
  console.log('🔍 Generating proper Wikipedia data...')
  
  const data: WikipediaData = {
    people: {},
    books: {},
    generatedAt: new Date().toISOString()
  }

  // Check ALL people from categories
  console.log('👥 Checking all people from categories...')
  let totalPeople = 0
  for (const [categoryName, styles] of Object.entries(categories)) {
    console.log(`  📂 Category: ${categoryName} (${(styles as any[]).length} people)`)
    
    for (const style of styles as any[]) {
      const person = style.name
      const searchTerm = getPersonWikipediaSearchTerm(person)
      console.log(`    Checking: ${person} (${searchTerm})`)
      
      try {
        const result = await checkWikipediaPage(searchTerm)
        data.people[person] = result
        console.log(`      ${result.exists ? '✅' : '❌'} ${result.exists ? 'Found' : 'Not found'}`)
        totalPeople++
      } catch (error) {
        console.error(`      ❌ Error checking ${person}:`, error)
        data.people[person] = { exists: false }
        totalPeople++
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100))
    }
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
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return data
}

async function main() {
  try {
    const data = await generateProperWikipediaData()
    
    // Save to file
    const outputPath = join(process.cwd(), 'src', 'data', 'wikipedia-data.json')
    writeFileSync(outputPath, JSON.stringify(data, null, 2))
    
    console.log('\n✅ Wikipedia data generated successfully!')
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
