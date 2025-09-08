import { checkWikipediaPage, getPersonWikipediaSearchTerm, getBookWikipediaSearchTerm } from '../utils/wikipedia'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Load the extracted categories
const categoriesPath = join(process.cwd(), 'src', 'data', 'style-categories.json')
const categories = JSON.parse(readFileSync(categoriesPath, 'utf8'))

// Load existing Wikipedia data
const existingDataPath = join(process.cwd(), 'src', 'data', 'wikipedia-data.json')
const existingData = JSON.parse(readFileSync(existingDataPath, 'utf8'))

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

async function generateIncrementalWikipediaData(): Promise<WikipediaData> {
  console.log('🔍 Generating incremental Wikipedia data (keeping existing data)...')
  
  // Start with existing data
  const data: WikipediaData = {
    people: { ...existingData.people },
    books: { ...existingData.books },
    generatedAt: new Date().toISOString()
  }

  // Find missing people
  console.log('👥 Checking for missing people...')
  let missingPeople = 0
  let checkedPeople = 0
  
  for (const [categoryName, styles] of Object.entries(categories)) {
    console.log(`  📂 Category: ${categoryName} (${(styles as any[]).length} people)`)
    
    for (const style of styles as any[]) {
      const person = style.name
      
      // Skip if already exists
      if (data.people[person]) {
        console.log(`    ⏭️  Skipping: ${person} (already exists)`)
        continue
      }
      
      // Check missing person
      const searchTerm = getPersonWikipediaSearchTerm(person)
      console.log(`    Checking: ${person} (${searchTerm})`)
      
      try {
        const result = await checkWikipediaPage(searchTerm)
        data.people[person] = result
        console.log(`      ${result.exists ? '✅' : '❌'} ${result.exists ? 'Found' : 'Not found'}`)
        missingPeople++
      } catch (error) {
        console.error(`      ❌ Error checking ${person}:`, error)
        data.people[person] = { exists: false }
        missingPeople++
      }
      
      checkedPeople++
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // Find missing books
  console.log('📚 Checking for missing books...')
  let missingBooks = 0
  
  for (const book of TEST_BOOKS) {
    const key = `${book.title} by ${book.author}`
    
    // Skip if already exists
    if (data.books[key]) {
      console.log(`  ⏭️  Skipping: ${key} (already exists)`)
      continue
    }
    
    // Check missing book
    const searchTerm = getBookWikipediaSearchTerm(book.title, book.author)
    console.log(`  Checking: ${key} (${searchTerm})`)
    
    try {
      const result = await checkWikipediaPage(searchTerm)
      data.books[key] = result
      console.log(`    ${result.exists ? '✅' : '❌'} ${result.exists ? 'Found' : 'Not found'}`)
      missingBooks++
    } catch (error) {
      console.error(`    ❌ Error checking ${key}:`, error)
      data.books[key] = { exists: false }
      missingBooks++
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return data
}

async function main() {
  try {
    const data = await generateIncrementalWikipediaData()
    
    // Save to file
    const outputPath = join(process.cwd(), 'src', 'data', 'wikipedia-data.json')
    writeFileSync(outputPath, JSON.stringify(data, null, 2))
    
    console.log('\n✅ Incremental Wikipedia data generated successfully!')
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
