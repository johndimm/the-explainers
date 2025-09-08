import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface Book {
  id: string | number
  title: string
  author?: string
  directUrl?: string
  localPath?: string
  wikipediaUrl?: string
  wikipediaTitle?: string
}

interface ValidationResult {
  file: string
  totalBooks: number
  validBooks: number
  invalidBooks: number
  errors: Array<{
    book: Book
    reason: string
  }>
}

// Library files to validate
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

function validateBook(book: Book): { isValid: boolean; reason?: string } {
  // Check if book has required fields
  if (!book.id || !book.title) {
    return { isValid: false, reason: 'Missing required fields (id or title)' }
  }

  // Check if book has author
  if (!book.author || book.author.trim() === '') {
    return { isValid: false, reason: 'Missing or empty author field' }
  }

  // Check if author is just a last name (common patterns)
  const author = book.author.trim()
  const commonLastNames = [
    'Joyce', 'Austen', 'Carroll', 'Dickens', 'Twain', 'Melville', 
    'Fitzgerald', 'Hemingway', 'Woolf', 'Orwell', 'Lee', 'Tolstoy',
    'Dostoyevsky', 'Kafka', 'Wilde', 'Steinbeck', 'Faulkner', 'Poe',
    'Hawthorne', 'Thoreau', 'Emerson', 'Whitman', 'Dickinson', 'Frost',
    'Eliot', 'Barrie', 'Milton', 'Hardy', 'Wells', 'Stevenson', 'Brontë',
    'Shelley', 'Stoker', 'Gilman', 'Ibsen', 'Machiavelli', 'Swift',
    'Baum', 'London', 'Goethe', 'Dante', 'Cervantes', 'Voltaire',
    'Maupassant', 'Baudelaire', 'Apollinaire', 'Diderot', 'Huysmans',
    'Rachilde', 'Rimbaud', 'Verlaine', 'Montesquieu', 'Rilke', 'Heine',
    'Hoffmann', 'Büchner', 'Fontane', 'Schiller', 'Kleist', 'Storm',
    'Keller', 'Lessing', 'Mann', 'Hesse', 'Schnitzler', 'Hofmannsthal',
    'Musil', 'Zweig', 'Trakl', 'Kellermann', 'Novalis', 'Raabe',
    'Ariosto', 'Capuana', 'De Amicis', 'Serao', 'Pirandello', 'Collodi',
    'Neera', 'D\'Annunzio', 'Salgari', 'De Roberto', 'Vivanti', 'Deledda',
    'Aleramo', 'Carducci', 'Leopardi', 'Rojas', 'Cervantes Saavedra',
    'Jiménez', 'Pérez Galdós', 'Baroja', 'Blasco Ibáñez', 'Hernández',
    'Pardo Bazán', 'Unamuno', 'Valle-Inclán', 'Manrique', 'Machado',
    'García Lorca', 'Benavente', 'Azorín'
  ]

  // Check if author is just a last name
  if (commonLastNames.includes(author)) {
    return { isValid: false, reason: `Author is just a last name: "${author}"` }
  }

  // Check if author has at least first and last name (basic check)
  const nameParts = author.split(' ')
  if (nameParts.length < 2) {
    return { isValid: false, reason: `Author appears to be incomplete: "${author}"` }
  }

  // Check if book has Wikipedia link
  if (!book.wikipediaUrl || book.wikipediaUrl.trim() === '') {
    return { isValid: false, reason: 'Missing Wikipedia URL' }
  }

  // Check if Wikipedia URL is valid
  if (!book.wikipediaUrl.startsWith('https://en.wikipedia.org/wiki/')) {
    return { isValid: false, reason: `Invalid Wikipedia URL: "${book.wikipediaUrl}"` }
  }

  return { isValid: true }
}

function validateFile(filename: string): ValidationResult {
  console.log(`\n📚 Validating ${filename}...`)
  
  const filePath = join(process.cwd(), 'src', 'data', 'library', filename)
  const fileContent = readFileSync(filePath, 'utf8')
  const books: Book[] = JSON.parse(fileContent)
  
  const result: ValidationResult = {
    file: filename,
    totalBooks: books.length,
    validBooks: 0,
    invalidBooks: 0,
    errors: []
  }
  
  books.forEach(book => {
    const validation = validateBook(book)
    if (validation.isValid) {
      result.validBooks++
    } else {
      result.invalidBooks++
      result.errors.push({
        book,
        reason: validation.reason || 'Unknown validation error'
      })
    }
  })
  
  console.log(`  ✅ Valid books: ${result.validBooks}`)
  console.log(`  ❌ Invalid books: ${result.invalidBooks}`)
  
  return result
}

function main() {
  console.log('🔍 Validating all library JSON files...')
  
  const allResults: ValidationResult[] = []
  const allErrors: Array<{
    file: string
    book: Book
    reason: string
  }> = []
  
  // Validate all files
  for (const filename of LIBRARY_FILES) {
    try {
      const result = validateFile(filename)
      allResults.push(result)
      allErrors.push(...result.errors.map(error => ({
        file: filename,
        book: error.book,
        reason: error.reason
      })))
    } catch (error) {
      console.error(`❌ Error validating ${filename}:`, error)
    }
  }
  
  // Write error file
  if (allErrors.length > 0) {
    const errorFilePath = join(process.cwd(), 'src', 'data', 'library-errors.json')
    writeFileSync(errorFilePath, JSON.stringify(allErrors, null, 2))
    console.log(`\n📝 Wrote ${allErrors.length} errors to library-errors.json`)
  }
  
  // Summary
  const totalBooks = allResults.reduce((sum, result) => sum + result.totalBooks, 0)
  const totalValid = allResults.reduce((sum, result) => sum + result.validBooks, 0)
  const totalInvalid = allResults.reduce((sum, result) => sum + result.invalidBooks, 0)
  
  console.log('\n📊 Validation Summary:')
  console.log(`   Total books: ${totalBooks}`)
  console.log(`   Valid books: ${totalValid}`)
  console.log(`   Invalid books: ${totalInvalid}`)
  console.log(`   Files processed: ${LIBRARY_FILES.length}`)
  
  if (totalInvalid > 0) {
    console.log(`\n❌ Found ${totalInvalid} books with issues. Check library-errors.json for details.`)
  } else {
    console.log('\n✅ All books are valid!')
  }
}

main()
