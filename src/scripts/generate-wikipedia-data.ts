import { checkWikipediaPage, getPersonWikipediaSearchTerm, getBookWikipediaSearchTerm } from '../utils/wikipedia'
import { STYLE_CATEGORIES } from '../components/ExplainerStylesPage'

// Sample book data for testing (you can expand this)
const SAMPLE_BOOKS = [
  { title: "Hamlet", author: "William Shakespeare" },
  { title: "Pride and Prejudice", author: "Jane Austen" },
  { title: "Ulysses", author: "James Joyce" },
  { title: "1984", author: "George Orwell" },
  { title: "To Kill a Mockingbird", author: "Harper Lee" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  { title: "Moby Dick", author: "Herman Melville" },
  { title: "War and Peace", author: "Leo Tolstoy" },
  { title: "The Odyssey", author: "Homer" },
  { title: "Don Quixote", author: "Miguel de Cervantes" }
]

interface WikipediaData {
  people: { [name: string]: { exists: boolean; url?: string; title?: string } }
  books: { [key: string]: { exists: boolean; url?: string; title?: string } }
  generatedAt: string
}

async function generateWikipediaData(): Promise<WikipediaData> {
  console.log('🔍 Generating Wikipedia data...')
  
  const data: WikipediaData = {
    people: {},
    books: {},
    generatedAt: new Date().toISOString()
  }

  // Check all explainer styles (people)
  console.log('📝 Checking explainer styles...')
  const allStyles = Object.values(STYLE_CATEGORIES).flat()
  
  for (const style of allStyles) {
    const searchTerm = getPersonWikipediaSearchTerm(style.name)
    console.log(`  Checking: ${style.name} (${searchTerm})`)
    
    try {
      const result = await checkWikipediaPage(searchTerm)
      data.people[style.name] = result
      console.log(`    ${result.exists ? '✅' : '❌'} ${result.exists ? 'Found' : 'Not found'}`)
    } catch (error) {
      console.error(`    ❌ Error checking ${style.name}:`, error)
      data.people[style.name] = { exists: false }
    }
    
    // Add a small delay to be respectful to Wikipedia's servers
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Check sample books
  console.log('📚 Checking sample books...')
  for (const book of SAMPLE_BOOKS) {
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
    
    // Add a small delay to be respectful to Wikipedia's servers
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return data
}

async function main() {
  try {
    const data = await generateWikipediaData()
    
    // Save to file
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const outputPath = path.join(process.cwd(), 'src', 'data', 'wikipedia-data.json')
    
    // Ensure directory exists
    const dir = path.dirname(outputPath)
    await fs.mkdir(dir, { recursive: true })
    
    // Write the data
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2))
    
    console.log(`\n✅ Wikipedia data generated successfully!`)
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

// Run if called directly
if (require.main === module) {
  main()
}

export { generateWikipediaData }
