// Static Wikipedia data utility - uses pre-generated data instead of runtime API calls

import wikipediaData from '@/data/wikipedia-data.json'

interface WikipediaResult {
  exists: boolean
  url?: string
  title?: string
}

interface WikipediaData {
  people: { [name: string]: { exists: boolean; url?: string; title?: string } }
  books: { [key: string]: { exists: boolean; url?: string; title?: string } }
  generatedAt: string
}

/**
 * Check if a Wikipedia page exists for a person (explainer style) using pre-generated data
 * @param name - The person's name
 * @returns WikipediaResult
 */
export function checkPersonWikipediaPage(name: string): WikipediaResult {
  const data = wikipediaData as WikipediaData
  const result = data.people[name]
  
  if (result) {
    return result
  }
  
  // No Wikipedia page found
  return {
    exists: false
  }
}

/**
 * Check if a Wikipedia page exists for a book using pre-generated data
 * @param title - The book title
 * @param author - The book author
 * @returns WikipediaResult
 */
export function checkBookWikipediaPage(title: string, author?: string): WikipediaResult {
  const data = wikipediaData as WikipediaData
  
  // Map of shortened author names to full names
  const authorMapping: { [key: string]: string } = {
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
    'Apollinaire': 'Guillaume Apollinaire',
    'Baudelaire': 'Charles Baudelaire',
    'Diderot': 'Denis Diderot',
    'Rimbaud': 'Arthur Rimbaud',
    'Verlaine': 'Paul Verlaine',
    'Rilke': 'Rainer Maria Rilke',
    'Goethe': 'Johann Wolfgang von Goethe',
    'Dante': 'Dante Alighieri',
    'Cervantes': 'Miguel de Cervantes',
    'Voltaire': 'Voltaire',
    'Maupassant': 'Guy de Maupassant',
    'Mann': 'Thomas Mann',
    'Hesse': 'Hermann Hesse',
    'Schiller': 'Friedrich Schiller'
  }
  
  // First try with the provided author (or 'Unknown' if none)
  let key = `${title} by ${author || 'Unknown'}`
  let result = data.books[key]
  
  if (result) {
    return result
  }
  
  // If author is provided, try with full name mapping
  if (author && authorMapping[author]) {
    const fullAuthor = authorMapping[author]
    const fullKey = `${title} by ${fullAuthor}`
    result = data.books[fullKey]
    if (result) {
      return result
    }
  }
  
  // If no author provided, try common authors for well-known works
  if (!author) {
    // Try William Shakespeare for classic plays
    const shakespeareKey = `${title} by William Shakespeare`
    result = data.books[shakespeareKey]
    if (result) {
      return result
    }
    
    // Try other common authors for classic literature
    const commonAuthors = [
      'Jane Austen',
      'Charles Dickens', 
      'Mark Twain',
      'Herman Melville',
      'F. Scott Fitzgerald',
      'Ernest Hemingway',
      'Virginia Woolf',
      'James Joyce',
      'George Orwell',
      'Harper Lee'
    ]
    
    for (const commonAuthor of commonAuthors) {
      const commonKey = `${title} by ${commonAuthor}`
      result = data.books[commonKey]
      if (result) {
        return result
      }
    }
  }
  
  // No Wikipedia page found
  return {
    exists: false
  }
}

/**
 * Get all people (explainer styles) that have Wikipedia pages
 * @returns Array of person names that have Wikipedia pages
 */
export function getPeopleWithWikipediaPages(): string[] {
  const data = wikipediaData as WikipediaData
  return Object.entries(data.people)
    .filter(([_, result]) => result.exists)
    .map(([name, _]) => name)
}

/**
 * Get all books that have Wikipedia pages
 * @returns Array of book keys that have Wikipedia pages
 */
export function getBooksWithWikipediaPages(): string[] {
  const data = wikipediaData as WikipediaData
  return Object.entries(data.books)
    .filter(([_, result]) => result.exists)
    .map(([key, _]) => key)
}

/**
 * Get the generation timestamp of the Wikipedia data
 * @returns ISO string of when the data was generated
 */
export function getWikipediaDataTimestamp(): string {
  const data = wikipediaData as WikipediaData
  return data.generatedAt
}

/**
 * Check if the Wikipedia data is recent (less than 30 days old)
 * @returns boolean indicating if data is recent
 */
export function isWikipediaDataRecent(): boolean {
  const timestamp = getWikipediaDataTimestamp()
  const generatedDate = new Date(timestamp)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return generatedDate > thirtyDaysAgo
}
