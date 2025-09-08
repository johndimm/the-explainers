import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Map of last names to full names (we'll build this as we go)
const authorMapping: { [key: string]: string } = {
  // Already known mappings
  'Austen': 'Jane Austen',
  'Joyce': 'James Joyce', 
  'Carroll': 'Lewis Carroll',
  'Dickens': 'Charles Dickens',
  'Twain': 'Mark Twain',
  'Melville': 'Herman Melville',
  'Fitzgerald': 'F. Scott Fitzgerald',
  'Hemingway': 'Ernest Hemingway',
  'Woolf': 'Virginia Woolf',
  'Orwell': 'George Orwell',
  'Lee': 'Harper Lee',
  'Tolstoy': 'Leo Tolstoy',
  'Dostoyevsky': 'Fyodor Dostoyevsky',
  'Kafka': 'Franz Kafka',
  'Wilde': 'Oscar Wilde',
  'Steinbeck': 'John Steinbeck',
  'Faulkner': 'William Faulkner',
  'Poe': 'Edgar Allan Poe',
  'Hawthorne': 'Nathaniel Hawthorne',
  'Thoreau': 'Henry David Thoreau',
  'Emerson': 'Ralph Waldo Emerson',
  'Whitman': 'Walt Whitman',
  'Dickinson': 'Emily Dickinson',
  'Frost': 'Robert Frost',
  'Eliot': 'T.S. Eliot',
  'Barrie': 'J.M. Barrie',
  'Milton': 'John Milton',
  'Hardy': 'Thomas Hardy',
  'Wells': 'H.G. Wells',
  'Stevenson': 'Robert Louis Stevenson',
  'Brontë': 'Charlotte Brontë',
  'Shelley': 'Mary Shelley',
  'Stoker': 'Bram Stoker',
  'Gilman': 'Charlotte Perkins Gilman',
  'Ibsen': 'Henrik Ibsen',
  'Machiavelli': 'Niccolò Machiavelli',
  'Swift': 'Jonathan Swift',
  'Baum': 'L. Frank Baum',
  'London': 'Jack London'
}

interface Book {
  id: string | number
  title: string
  author?: string
  directUrl?: string
  localPath?: string
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

function updateAuthorNames(filename: string): { updated: number, total: number } {
  console.log(`\n📚 Processing ${filename}...`)
  
  const filePath = join(process.cwd(), 'src', 'data', 'library', filename)
  const fileContent = readFileSync(filePath, 'utf8')
  const books: Book[] = JSON.parse(fileContent)
  
  let updated = 0
  let total = books.length
  
  // Update books with full author names
  const updatedBooks = books.map(book => {
    if (book.author && authorMapping[book.author]) {
      const fullAuthor = authorMapping[book.author]
      console.log(`  ✅ ${book.title} by ${book.author} → ${fullAuthor}`)
      updated++
      return { ...book, author: fullAuthor }
    } else if (book.author && !authorMapping[book.author]) {
      console.log(`  ❓ ${book.title} by ${book.author} (unknown author)`)
      return book
    } else {
      // No author field (like Shakespeare books)
      return book
    }
  })
  
  // Write back to file
  writeFileSync(filePath, JSON.stringify(updatedBooks, null, 2))
  
  return { updated, total }
}

function main() {
  console.log('🔧 Fixing author names in library JSON files...')
  
  let totalUpdated = 0
  let totalBooks = 0
  
  for (const filename of LIBRARY_FILES) {
    try {
      const { updated, total } = updateAuthorNames(filename)
      totalUpdated += updated
      totalBooks += total
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error)
    }
  }
  
  console.log('\n✅ Author name fixing completed!')
  console.log(`📊 Summary:`)
  console.log(`   Updated ${totalUpdated} books with full author names`)
  console.log(`   Total books processed: ${totalBooks}`)
  console.log(`   Files processed: ${LIBRARY_FILES.length}`)
  
  if (totalUpdated > 0) {
    console.log('\n📝 Note: You may need to regenerate Wikipedia data after this change.')
  }
}

main()
