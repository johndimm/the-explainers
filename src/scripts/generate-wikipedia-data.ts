import { checkWikipediaPage, getPersonWikipediaSearchTerm, getBookWikipediaSearchTerm } from '../utils/wikipedia'
import { readFileSync } from 'fs'
import { join } from 'path'

// Define style categories directly to avoid importing React components
const STYLE_CATEGORIES = {
  'Literary Critics': [
    { name: 'Harold Bloom', value: 'harold-bloom' },
    { name: 'T.S. Eliot', value: 't-s-eliot' },
    { name: 'John Ruskin', value: 'john-ruskin' },
    { name: 'Samuel Johnson', value: 'samuel-johnson' },
    { name: 'Virginia Woolf', value: 'virginia-woolf' },
    { name: 'Northrop Frye', value: 'northrop-frye' },
    { name: 'Roland Barthes', value: 'roland-barthes' },
    { name: 'Jacques Derrida', value: 'jacques-derrida' },
    { name: 'Michel Foucault', value: 'michel-foucault' },
    { name: 'Edward Said', value: 'edward-said' }
  ],
  'Philosophers': [
    { name: 'Plato', value: 'plato' },
    { name: 'Aristotle', value: 'aristotle' },
    { name: 'Immanuel Kant', value: 'immanuel-kant' },
    { name: 'Friedrich Nietzsche', value: 'friedrich-nietzsche' },
    { name: 'Jean-Paul Sartre', value: 'jean-paul-sartre' },
    { name: 'Simone de Beauvoir', value: 'simone-de-beauvoir' },
    { name: 'Michel Foucault', value: 'michel-foucault' },
    { name: 'Jacques Derrida', value: 'jacques-derrida' },
    { name: 'Judith Butler', value: 'judith-butler' },
    { name: 'Slavoj Žižek', value: 'slavoj-zizek' }
  ],
  'Writers': [
    { name: 'William Shakespeare', value: 'william-shakespeare' },
    { name: 'Jane Austen', value: 'jane-austen' },
    { name: 'Charles Dickens', value: 'charles-dickens' },
    { name: 'Mark Twain', value: 'mark-twain' },
    { name: 'Virginia Woolf', value: 'virginia-woolf' },
    { name: 'James Joyce', value: 'james-joyce' },
    { name: 'Ernest Hemingway', value: 'ernest-hemingway' },
    { name: 'Toni Morrison', value: 'toni-morrison' },
    { name: 'Gabriel García Márquez', value: 'gabriel-garcia-marquez' },
    { name: 'Maya Angelou', value: 'maya-angelou' }
  ],
  'Comedians': [
    { name: 'George Carlin', value: 'george-carlin' },
    { name: 'Richard Pryor', value: 'richard-pryor' },
    { name: 'Eddie Murphy', value: 'eddie-murphy' },
    { name: 'Chris Rock', value: 'chris-rock' },
    { name: 'Dave Chappelle', value: 'dave-chappelle' },
    { name: 'Louis C.K.', value: 'louis-ck' },
    { name: 'Jerry Seinfeld', value: 'jerry-seinfeld' },
    { name: 'Tina Fey', value: 'tina-fey' },
    { name: 'Amy Poehler', value: 'amy-poehler' },
    { name: 'John Mulaney', value: 'john-mulaney' }
  ],
  'Neutral': [
    { name: 'Neutral', value: 'neutral' }
  ]
}

// Library files to process
const LIBRARY_FILES = [
  'shakespeare.json',
  'english-literature.json', 
  'philosophers.json',
  'poetry.json',
  'french-literature.json',
  'german-literature.json',
  'italian-literature.json',
  'spanish-literature.json',
  'historical.json',
  'gutenberg-top.json'
]

interface Book {
  id: string | number
  title: string
  author?: string
  directUrl?: string
  localPath?: string
}

function loadLibraryBooks(): { books: Book[], filename: string }[] {
  const allBooks: { books: Book[], filename: string }[] = []
  
  for (const filename of LIBRARY_FILES) {
    try {
      const filePath = join(process.cwd(), 'src', 'data', 'library', filename)
      const fileContent = readFileSync(filePath, 'utf8')
      const books: Book[] = JSON.parse(fileContent)
      
      // Limit English Literature to 100 top entries to avoid too many API calls
      const limitedBooks = filename === 'english-literature.json' ? books.slice(0, 100) : books
      allBooks.push({ books: limitedBooks, filename })
      
      console.log(`📚 Loaded ${limitedBooks.length} books from ${filename}`)
    } catch (error) {
      console.error(`❌ Error loading ${filename}:`, error)
    }
  }
  
  return allBooks
}

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

  // Check all library books
  console.log('📚 Checking library books...')
  const allBookCollections = loadLibraryBooks()
  
  for (const { books, filename } of allBookCollections) {
    for (const book of books) {
      // For Shakespeare books without authors, use William Shakespeare
      const author = book.author || (filename === 'shakespeare.json' ? 'William Shakespeare' : 'Unknown')
      const searchTerm = getBookWikipediaSearchTerm(book.title, author)
      const key = `${book.title} by ${author}`
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
