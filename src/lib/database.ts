// Simplified database layer - returns mock data for all users
// No actual database operations needed since we removed authentication

export interface UserProfile {
  user_agent: string
  age: number | null
  language: string
  education_level: string
  first_login: Date | null
  total_explanations: number
  today_explanations: number
  available_credits: number
  book_explanations: { [bookKey: string]: number }
  purchased_books: string[]
  purchased_book_details: { [bookKey: string]: { title: string; author: string; url?: string } }
  has_unlimited_access: boolean
  unlimited_access_expiry: Date | null
  created_at: Date
  updated_at: Date
}

export interface UserSettings {
  user_agent: string
  llm_provider: string
  response_length: string
  text_font: string
  chat_font: string
  text_font_size: number
  chat_font_size: number
  reading_mode: string
  explanation_style: string
  custom_api_key?: string
  custom_api_url?: string
  custom_model_name?: string
  created_at: Date
  updated_at: Date
}

export interface UserCurrentBook {
  user_agent: string
  title: string
  author: string
  url: string
  updated_at?: Date
}

export interface UserBookmark {
  user_agent: string
  book_title: string
  book_author: string
  scroll_position: number
  updated_at?: Date
}

// Mock data for all users
const MOCK_PROFILE: UserProfile = {
  user_agent: '',
  age: null,
  language: 'english',
  education_level: 'high-school',
  first_login: new Date(),
  total_explanations: 0,
  today_explanations: 0,
  available_credits: 100,
  book_explanations: {},
  purchased_books: [],
  purchased_book_details: {},
  has_unlimited_access: true,
  unlimited_access_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  created_at: new Date(),
  updated_at: new Date()
}

const MOCK_SETTINGS: UserSettings = {
  user_agent: '',
  llm_provider: 'gemini',
  response_length: 'brief',
  text_font: 'serif',
  chat_font: 'sans-serif',
  text_font_size: 18,
  chat_font_size: 16,
  reading_mode: 'scroll',
  explanation_style: 'neutral',
  custom_api_key: '',
  custom_api_url: '',
  custom_model_name: '',
  created_at: new Date(),
  updated_at: new Date()
}

// Profile operations
export async function getUserProfile(user_agent: string): Promise<UserProfile | null> {
  return { ...MOCK_PROFILE, user_agent }
}

export async function createOrUpdateUserProfile(profile: Partial<UserProfile> & { user_agent: string }): Promise<UserProfile> {
  return { ...MOCK_PROFILE, ...profile, user_agent: profile.user_agent }
}

export async function updateUserProfileFields(user_agent: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  return { ...MOCK_PROFILE, ...updates, user_agent }
}

// Settings operations
export async function getUserSettings(user_agent: string): Promise<UserSettings | null> {
  return { ...MOCK_SETTINGS, user_agent }
}

export async function createOrUpdateUserSettings(settings: Partial<UserSettings> & { user_agent: string }): Promise<UserSettings> {
  return { ...MOCK_SETTINGS, ...settings, user_agent: settings.user_agent }
}

// Current book operations
export async function getUserCurrentBook(user_agent: string): Promise<UserCurrentBook | null> {
  return {
    user_agent,
    title: '',
    author: '',
    url: '',
    updated_at: new Date()
  }
}

export async function createOrUpdateUserCurrentBook(book: Partial<UserCurrentBook> & { user_agent: string }): Promise<UserCurrentBook> {
  return {
    user_agent: book.user_agent,
    title: book.title || '',
    author: book.author || '',
    url: book.url || '',
    updated_at: new Date()
  }
}

// Bookmark operations
export async function getUserBookmark(user_agent: string, bookTitle: string, bookAuthor: string): Promise<UserBookmark | null> {
  return {
    user_agent,
    book_title: bookTitle,
    book_author: bookAuthor,
    scroll_position: 0,
    updated_at: new Date()
  }
}

export async function createOrUpdateUserBookmark(bookmark: Partial<UserBookmark> & { user_agent: string }): Promise<UserBookmark> {
  return {
    user_agent: bookmark.user_agent,
    book_title: bookmark.book_title || '',
    book_author: bookmark.book_author || '',
    scroll_position: bookmark.scroll_position || 0,
    updated_at: new Date()
  }
}

export async function getAllUserBookmarks(user_agent: string): Promise<UserBookmark[]> {
  return []
}

// Utility function to clear all data for a user (for testing)
export async function clearUserData(user_agent: string): Promise<void> {
  // No-op in simplified mode
}

// Database initialization (no-op in simplified mode)
export async function initializeDatabase(): Promise<void> {
  // No-op in simplified mode
}