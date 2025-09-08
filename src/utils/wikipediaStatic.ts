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
  const key = `${title} by ${author || 'Unknown'}`
  const result = data.books[key]
  
  if (result) {
    return result
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
