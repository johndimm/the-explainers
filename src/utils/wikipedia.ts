// Utility functions for Wikipedia integration
import { log } from './log'

export interface WikipediaResult {
  exists: boolean
  url?: string
  title?: string
}

// Cache for Wikipedia checks to avoid repeated API calls
const wikipediaCache = new Map<string, WikipediaResult>()

/**
 * Check if a Wikipedia page exists for a given search term
 * @param searchTerm - The term to search for on Wikipedia
 * @returns Promise<WikipediaResult>
 */
export async function checkWikipediaPage(searchTerm: string): Promise<WikipediaResult> {
  // Check cache first
  const cacheKey = searchTerm.toLowerCase().trim()
  if (wikipediaCache.has(cacheKey)) {
    return wikipediaCache.get(cacheKey)!
  }

  try {
    // Use Wikipedia API to search for the page
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      const result: WikipediaResult = {
        exists: true,
        url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`,
        title: data.title || searchTerm
      }
      
      // Cache the result
      wikipediaCache.set(cacheKey, result)
      return result
    } else {
      // Try alternative search if direct page doesn't exist
      const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchTerm)}&srlimit=1&origin=*`
      
      const searchResponse = await fetch(searchApiUrl)
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        
        if (searchData.query?.search?.length > 0) {
          const firstResult = searchData.query.search[0]
          const result: WikipediaResult = {
            exists: true,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(firstResult.title)}`,
            title: firstResult.title
          }
          
          // Cache the result
          wikipediaCache.set(cacheKey, result)
          return result
        }
      }
    }
  } catch (error) {
    log('ui','Error checking Wikipedia page:', error)
  }

  // No Wikipedia page found
  const result: WikipediaResult = {
    exists: false
  }
  
  // Cache the negative result
  wikipediaCache.set(cacheKey, result)
  return result
}

/**
 * Generate a Wikipedia URL for a given search term
 * @param searchTerm - The term to search for
 * @returns string - Wikipedia URL
 */
export function generateWikipediaUrl(searchTerm: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`
}

/**
 * Open Wikipedia page in a new tab
 * @param searchTerm - The term to search for
 */
export function openWikipediaPage(searchTerm: string): void {
  const url = generateWikipediaUrl(searchTerm)
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Get Wikipedia search term for a person (for explainer styles)
 * @param name - The person's name
 * @returns string - Optimized search term for Wikipedia
 */
export function getPersonWikipediaSearchTerm(name: string): string {
  // Handle special cases where the name might need adjustment
  const specialCases: { [key: string]: string } = {
    'T.S. Eliot': 'T. S. Eliot',
    'Louis C.K.': 'Louis C.K.',
    'Conan O\'Brien': 'Conan O\'Brien',
    'Neil deGrasse Tyson': 'Neil deGrasse Tyson',
    'Bernard-Henri Lévy': 'Bernard-Henri Lévy',
    'Michel Houellebecq': 'Michel Houellebecq',
    'Christopher Hitchens': 'Christopher Hitchens',
    'Christopher Marlowe': 'Christopher Marlowe',
    'Ben Jonson': 'Ben Jonson',
    'Francis Bacon': 'Francis Bacon (philosopher)',
    'Samuel Johnson': 'Samuel Johnson',
    'John Ruskin': 'John Ruskin',
    'Harold Bloom': 'Harold Bloom',
    'David Foster Wallace': 'David Foster Wallace',
    'Oscar Wilde': 'Oscar Wilde',
    'Maya Angelou': 'Maya Angelou',
    'Douglas Adams': 'Douglas Adams',
    'Terry Pratchett': 'Terry Pratchett',
    'Joan Didion': 'Joan Didion',
    'David Sedaris': 'David Sedaris',
    'Mark Twain': 'Mark Twain',
    'Rudyard Kipling': 'Rudyard Kipling',
    'Tom Wolfe': 'Tom Wolfe',
    'Flannery O\'Connor': 'Flannery O\'Connor',
    'Anthony Bourdain': 'Anthony Bourdain',
    'Bill Bryson': 'Bill Bryson',
    'Stephen Fry': 'Stephen Fry',
    'Charles Dickens': 'Charles Dickens',
    'Cormac McCarthy': 'Cormac McCarthy',
    'Stephen King': 'Stephen King',
    'William Shakespeare': 'William Shakespeare',
    'Dorothy Parker': 'Dorothy Parker',
    'Ernest Hemingway': 'Ernest Hemingway',
    'James Joyce': 'James Joyce',
    'Samuel Beckett': 'Samuel Beckett',
    'Kurt Vonnegut': 'Kurt Vonnegut',
    'Bernie Sanders': 'Bernie Sanders',
    'Martin Luther King': 'Martin Luther King Jr.',
    'John F. Kennedy': 'John F. Kennedy',
    'James Carville': 'James Carville',
    'Donald Trump': 'Donald Trump',
    'George W. Bush': 'George W. Bush',
    'Barack Obama': 'Barack Obama',
    'Jerry Seinfeld': 'Jerry Seinfeld',
    'Dave Chappelle': 'Dave Chappelle',
    'Tina Fey': 'Tina Fey',
    'Amy Poehler': 'Amy Poehler',
    'Ricky Gervais': 'Ricky Gervais',
    'Sarah Silverman': 'Sarah Silverman',
    'John Mulaney': 'John Mulaney',
    'Ali Wong': 'Ali Wong',
    'Bo Burnham': 'Bo Burnham',
    'Andrew Dice Clay': 'Andrew Dice Clay',
    'Anthony Jeselnik': 'Anthony Jeselnik',
    'Doug Stanhope': 'Doug Stanhope',
    'Jim Norton': 'Jim Norton',
    'Jim Jefferies': 'Jim Jefferies',
    'Daniel Tosh': 'Daniel Tosh',
    'Andy Andrist': 'Andy Andrist',
    'Bill Burr': 'Bill Burr',
    'Lewis Black': 'Lewis Black',
    'George Carlin': 'George Carlin',
    'Sam Kinison': 'Sam Kinison',
    'Paul Mooney': 'Paul Mooney',
    'Bill Hicks': 'Bill Hicks',
    'Bob Saget': 'Bob Saget',
    'Norm Macdonald': 'Norm Macdonald',
    'Oprah Winfrey': 'Oprah Winfrey',
    'David Letterman': 'David Letterman',
    'Stephen Colbert': 'Stephen Colbert',
    'Jimmy Fallon': 'Jimmy Fallon',
    'Ellen DeGeneres': 'Ellen DeGeneres',
    'Trevor Noah': 'Trevor Noah',
    'John Oliver': 'John Oliver',
    'Jon Stewart': 'Jon Stewart',
    'Howard Stern': 'Howard Stern',
    'Bill Maher': 'Bill Maher',
    'Carl Sagan': 'Carl Sagan',
    'Humphrey Bogart': 'Humphrey Bogart',
    'Marilyn Monroe': 'Marilyn Monroe',
    'Louis Theroux': 'Louis Theroux',
    'Robin Williams': 'Robin Williams',
    'Aaron Sorkin': 'Aaron Sorkin',
    'Woody Allen': 'Woody Allen'
  }

  return specialCases[name] || name
}

/**
 * Get Wikipedia search term for a book
 * @param title - The book title
 * @param author - The book author
 * @returns string - Optimized search term for Wikipedia
 */
export function getBookWikipediaSearchTerm(title: string, author?: string): string {
  // For books, we'll search for the title first, then potentially add author for disambiguation
  if (author && author !== 'Unknown') {
    return `${title} (${author})`
  }
  return title
}
