// Utility functions for handling book identifiers
// This handles the migration from fragile text-based keys to stable IDs

export interface BookMetadata {
  id: string
  title: string
  author: string
  gutenbergId?: string
  localPath?: string
}

// Mapping from old text-based keys to stable IDs
const LEGACY_KEY_MAPPING: { [key: string]: string } = {
  'finnegans-wake-joyce': 'custom-finnegans-wake',
  'finnegans-wake-james-joyce': 'custom-finnegans-wake',
  'ulysses-joyce': 'pg-4300',
  'ulysses-james-joyce': 'pg-4300',
  'dubliners-joyce': 'pg-2814',
  'dubliners-james-joyce': 'pg-2814',
  'a-portrait-of-the-artist-as-a-young-man-joyce': 'pg-4217',
  'a-portrait-of-the-artist-as-a-young-man-james-joyce': 'pg-4217',
  'exiles-a-play-in-three-acts-joyce': 'pg-55945',
  'exiles-a-play-in-three-acts-james-joyce': 'pg-55945',
  'alices-adventures-in-wonderland-carroll': 'pg-1',
  'alices-adventures-in-wonderland-lewis-carroll': 'pg-1',
  'pride-and-prejudice-austen': 'pg-4',
  'pride-and-prejudice-jane-austen': 'pg-4',
  'through-the-looking-glass-carroll': 'pg-12',
  'through-the-looking-glass-lewis-carroll': 'pg-12',
  'the-hunting-of-the-snark-an-agony-in-eight-fits-carroll': 'pg-13',
  'the-hunting-of-the-snark-an-agony-in-eight-fits-lewis-carroll': 'pg-13',
  'peter-pan-barrie': 'pg-16',
  'peter-pan-jm-barrie': 'pg-16',
}

/**
 * Generate a stable book ID from title and author
 * This is the new, robust way to identify books
 */
export function generateStableBookId(title: string, author: string): string {
  // For now, use a simple approach - in the future this could be more sophisticated
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
  const normalizedAuthor = author.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
  return `${normalizedTitle}-${normalizedAuthor}`
}

/**
 * Generate the old-style book key for backward compatibility
 * @deprecated Use stable IDs instead
 */
export function generateLegacyBookKey(title: string, author: string): string {
  return `${title}-${author}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

/**
 * Convert a legacy book key to a stable ID
 */
export function legacyKeyToStableId(legacyKey: string): string {
  return LEGACY_KEY_MAPPING[legacyKey] || legacyKey
}

/**
 * Get book metadata by stable ID
 * This would typically look up from the library data
 */
export function getBookMetadata(stableId: string, libraryData: BookMetadata[]): BookMetadata | undefined {
  return libraryData.find(book => book.id === stableId)
}

/**
 * Find book by title and author, returning stable ID
 */
export function findBookByTitleAndAuthor(title: string, author: string, libraryData: BookMetadata[]): string | undefined {
  const book = libraryData.find(b => 
    b.title.toLowerCase() === title.toLowerCase() && 
    b.author.toLowerCase() === author.toLowerCase()
  )
  return book?.id
}
