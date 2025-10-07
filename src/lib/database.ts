import { Pool } from 'pg'
import { log } from '../utils/log'

// Create a connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Database schema types
export interface UserProfile {
  user_id: string
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
  user_id: string
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
  user_id: string
  title: string
  author: string
  url: string
  updated_at?: Date
}

export interface UserBookmark {
  user_id: string
  book_title: string
  book_author: string
  scroll_position: number
  updated_at?: Date
}

// Initialize database tables
export async function initializeDatabase() {
  const client = await pool.connect()
  
  try {
    // Drop existing tables if they exist (to handle schema changes)
    await client.query('DROP TABLE IF EXISTS user_bookmarks CASCADE')
    await client.query('DROP TABLE IF EXISTS user_current_books CASCADE')
    await client.query('DROP TABLE IF EXISTS user_settings CASCADE')
    await client.query('DROP TABLE IF EXISTS user_profiles CASCADE')
    
    // Create user_profiles table
    await client.query(`
      CREATE TABLE user_profiles (
        user_id VARCHAR(255) PRIMARY KEY,
        age INTEGER,
        language VARCHAR(50) DEFAULT 'english',
        education_level VARCHAR(50) DEFAULT 'high-school',
        first_login TIMESTAMP,
        total_explanations INTEGER DEFAULT 0,
        today_explanations INTEGER DEFAULT 0,
        available_credits INTEGER DEFAULT 0,
        book_explanations JSONB DEFAULT '{}',
        purchased_books TEXT[] DEFAULT '{}',
        purchased_book_details JSONB DEFAULT '{}',
        has_unlimited_access BOOLEAN DEFAULT false,
        unlimited_access_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create user_settings table
    await client.query(`
      CREATE TABLE user_settings (
        user_id VARCHAR(255) PRIMARY KEY,
        llm_provider VARCHAR(50) DEFAULT 'gemini',
        response_length VARCHAR(20) DEFAULT 'brief',
        text_font VARCHAR(20) DEFAULT 'serif',
        chat_font VARCHAR(20) DEFAULT 'sans-serif',
        text_font_size INTEGER DEFAULT 18,
        chat_font_size INTEGER DEFAULT 16,
        reading_mode VARCHAR(20) DEFAULT 'scroll',
        explanation_style VARCHAR(50) DEFAULT 'neutral',
        custom_api_key TEXT,
        custom_api_url TEXT,
        custom_model_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create user_current_books table
    await client.query(`
      CREATE TABLE user_current_books (
        user_id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        url TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create user_bookmarks table
    await client.query(`
      CREATE TABLE user_bookmarks (
        user_id VARCHAR(255),
        book_title TEXT NOT NULL,
        book_author TEXT NOT NULL,
        scroll_position INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, book_title, book_author)
      )
    `)

    // Add font size columns to existing user_settings table if they don't exist
    await client.query(`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS text_font_size INTEGER DEFAULT 18
    `)
    await client.query(`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS chat_font_size INTEGER DEFAULT 16
    `)

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_current_books_user_id ON user_current_books(user_id)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id)
    `)

log('api','Database tables initialized successfully')
  } catch (error) {
    log('ui','Error initializing database:', error)
    throw error
  } finally {
    client.release()
  }
}

// Profile operations
export async function getUserProfile(user_id: string): Promise<UserProfile | null> {
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [user_id]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      user_id: row.user_id,
      age: row.age,
      language: row.language,
      education_level: row.education_level,
      first_login: row.first_login,
      total_explanations: row.total_explanations,
      today_explanations: row.today_explanations,
      available_credits: row.available_credits,
      book_explanations: row.book_explanations || {},
      purchased_books: row.purchased_books || [],
      purchased_book_details: row.purchased_book_details || {},
      has_unlimited_access: row.has_unlimited_access,
      unlimited_access_expiry: row.unlimited_access_expiry,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    log('ui','Error getting user profile:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function createOrUpdateUserProfile(profile: Partial<UserProfile> & { user_id: string }): Promise<UserProfile> {
  const client = await pool.connect()
  
  try {
    const now = new Date()
    const result = await client.query(`
      INSERT INTO user_profiles (
        user_id, age, language, education_level, first_login, total_explanations,
        today_explanations, available_credits, book_explanations, purchased_books,
        purchased_book_details, has_unlimited_access, unlimited_access_expiry,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      ON CONFLICT (user_id) DO UPDATE SET
        age = EXCLUDED.age,
        language = EXCLUDED.language,
        education_level = EXCLUDED.education_level,
        first_login = EXCLUDED.first_login,
        total_explanations = EXCLUDED.total_explanations,
        today_explanations = EXCLUDED.today_explanations,
        available_credits = EXCLUDED.available_credits,
        book_explanations = EXCLUDED.book_explanations,
        purchased_books = EXCLUDED.purchased_books,
        purchased_book_details = EXCLUDED.purchased_book_details,
        has_unlimited_access = EXCLUDED.has_unlimited_access,
        unlimited_access_expiry = EXCLUDED.unlimited_access_expiry,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `, [
      profile.user_id,
      profile.age || null,
      profile.language || 'english',
      profile.education_level || 'high-school',
      profile.first_login || null,
      profile.total_explanations || 0,
      profile.today_explanations || 0,
      profile.available_credits || 0,
      JSON.stringify(profile.book_explanations || {}),
      profile.purchased_books || [],
      JSON.stringify(profile.purchased_book_details || {}),
      profile.has_unlimited_access || false,
      profile.unlimited_access_expiry || null,
      now,
      now
    ])
    
    const row = result.rows[0]
    return {
      user_id: row.user_id,
      age: row.age,
      language: row.language,
      education_level: row.education_level,
      first_login: row.first_login,
      total_explanations: row.total_explanations,
      today_explanations: row.today_explanations,
      available_credits: row.available_credits,
      book_explanations: row.book_explanations || {},
      purchased_books: row.purchased_books || [],
      purchased_book_details: row.purchased_book_details || {},
      has_unlimited_access: row.has_unlimited_access,
      unlimited_access_expiry: row.unlimited_access_expiry,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    log('ui','Error creating/updating user profile:', error)
    throw error
  } finally {
    client.release()
  }
}

// Partial update function for specific fields only
export async function updateUserProfileFields(user_id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const client = await pool.connect()
  
  try {
    const now = new Date()
    const fields: string[] = []
    const values: any[] = []
    let paramCount = 1
    
    // Build dynamic SET clause based on provided fields
    if (updates.age !== undefined) {
      fields.push(`age = $${paramCount}`)
      values.push(updates.age)
      paramCount++
    }
    if (updates.language !== undefined) {
      fields.push(`language = $${paramCount}`)
      values.push(updates.language)
      paramCount++
    }
    if (updates.education_level !== undefined) {
      fields.push(`education_level = $${paramCount}`)
      values.push(updates.education_level)
      paramCount++
    }
    if (updates.first_login !== undefined) {
      fields.push(`first_login = $${paramCount}`)
      values.push(updates.first_login)
      paramCount++
    }
    if (updates.total_explanations !== undefined) {
      fields.push(`total_explanations = $${paramCount}`)
      values.push(updates.total_explanations)
      paramCount++
    }
    if (updates.today_explanations !== undefined) {
      fields.push(`today_explanations = $${paramCount}`)
      values.push(updates.today_explanations)
      paramCount++
    }
    if (updates.available_credits !== undefined) {
      fields.push(`available_credits = $${paramCount}`)
      values.push(updates.available_credits)
      paramCount++
    }
    if (updates.book_explanations !== undefined) {
      fields.push(`book_explanations = $${paramCount}`)
      values.push(JSON.stringify(updates.book_explanations))
      paramCount++
    }
    if (updates.purchased_books !== undefined) {
      fields.push(`purchased_books = $${paramCount}`)
      values.push(updates.purchased_books)
      paramCount++
    }
    if (updates.purchased_book_details !== undefined) {
      fields.push(`purchased_book_details = $${paramCount}`)
      values.push(JSON.stringify(updates.purchased_book_details))
      paramCount++
    }
    if (updates.has_unlimited_access !== undefined) {
      fields.push(`has_unlimited_access = $${paramCount}`)
      values.push(updates.has_unlimited_access)
      paramCount++
    }
    if (updates.unlimited_access_expiry !== undefined) {
      fields.push(`unlimited_access_expiry = $${paramCount}`)
      values.push(updates.unlimited_access_expiry)
      paramCount++
    }
    
    // Always update the updated_at timestamp
    fields.push(`updated_at = $${paramCount}`)
    values.push(now)
    paramCount++
    
    // Add user_id as the last parameter
    values.push(user_id)
    
    if (fields.length === 1) {
      // Only updated_at was set, no actual fields to update
      throw new Error('No fields to update')
    }
    
    const query = `
      UPDATE user_profiles 
      SET ${fields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `
    
log('api','Partial update query:', query)
log('api','Values:', values)
    
    const result = await client.query(query, values)
    
    if (result.rows.length === 0) {
      throw new Error('User profile not found')
    }
    
    const row = result.rows[0]
    return {
      user_id: row.user_id,
      age: row.age,
      language: row.language,
      education_level: row.education_level,
      first_login: row.first_login,
      total_explanations: row.total_explanations,
      today_explanations: row.today_explanations,
      available_credits: row.available_credits,
      book_explanations: row.book_explanations || {},
      purchased_books: row.purchased_books || [],
      purchased_book_details: row.purchased_book_details || {},
      has_unlimited_access: row.has_unlimited_access,
      unlimited_access_expiry: row.unlimited_access_expiry,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    log('ui','Error partially updating user profile:', error)
    throw error
  } finally {
    client.release()
  }
}

// Settings operations
export async function getUserSettings(user_id: string): Promise<UserSettings | null> {
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [user_id]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      user_id: row.user_id,
      llm_provider: row.llm_provider,
      response_length: row.response_length,
      text_font: row.text_font,
      chat_font: row.chat_font,
      text_font_size: row.text_font_size || 18,
      chat_font_size: row.chat_font_size || 16,
      reading_mode: row.reading_mode,
      explanation_style: row.explanation_style,
      custom_api_key: row.custom_api_key,
      custom_api_url: row.custom_api_url,
      custom_model_name: row.custom_model_name,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    log('ui','Error getting user settings:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function createOrUpdateUserSettings(settings: Partial<UserSettings> & { user_id: string }): Promise<UserSettings> {
  const client = await pool.connect()
  
  try {
    const now = new Date()
    const result = await client.query(`
      INSERT INTO user_settings (
        user_id, llm_provider, response_length, text_font, chat_font,
        text_font_size, chat_font_size, reading_mode, explanation_style, 
        custom_api_key, custom_api_url, custom_model_name, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      ON CONFLICT (user_id) DO UPDATE SET
        llm_provider = EXCLUDED.llm_provider,
        response_length = EXCLUDED.response_length,
        text_font = EXCLUDED.text_font,
        chat_font = EXCLUDED.chat_font,
        text_font_size = EXCLUDED.text_font_size,
        chat_font_size = EXCLUDED.chat_font_size,
        reading_mode = EXCLUDED.reading_mode,
        explanation_style = EXCLUDED.explanation_style,
        custom_api_key = EXCLUDED.custom_api_key,
        custom_api_url = EXCLUDED.custom_api_url,
        custom_model_name = EXCLUDED.custom_model_name,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `, [
      settings.user_id,
      settings.llm_provider || 'gemini',
      settings.response_length || 'brief',
      settings.text_font || 'serif',
      settings.chat_font || 'sans-serif',
      settings.text_font_size || 18,
      settings.chat_font_size || 16,
      settings.reading_mode || 'scroll',
      settings.explanation_style || 'neutral',
      settings.custom_api_key || null,
      settings.custom_api_url || null,
      settings.custom_model_name || null,
      now,
      now
    ])
    
    const row = result.rows[0]
    return {
      user_id: row.user_id,
      llm_provider: row.llm_provider,
      response_length: row.response_length,
      text_font: row.text_font,
      chat_font: row.chat_font,
      text_font_size: row.text_font_size || 18,
      chat_font_size: row.chat_font_size || 16,
      reading_mode: row.reading_mode,
      explanation_style: row.explanation_style,
      custom_api_key: row.custom_api_key,
      custom_api_url: row.custom_api_url,
      custom_model_name: row.custom_model_name,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    log('ui','Error creating/updating user settings:', error)
    throw error
  } finally {
    client.release()
  }
}

// Current book operations
export async function getUserCurrentBook(user_id: string): Promise<UserCurrentBook | null> {
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      'SELECT * FROM user_current_books WHERE user_id = $1',
      [user_id]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      user_id: row.user_id,
      title: row.title,
      author: row.author,
      url: row.url,
      updated_at: row.updated_at
    }
  } catch (error) {
    log('ui','Error getting user current book:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function createOrUpdateUserCurrentBook(book: UserCurrentBook): Promise<UserCurrentBook> {
  const client = await pool.connect()
  
  try {
    const now = new Date()
    const result = await client.query(`
      INSERT INTO user_current_books (user_id, title, author, url, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        title = EXCLUDED.title,
        author = EXCLUDED.author,
        url = EXCLUDED.url,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `, [book.user_id, book.title, book.author, book.url, now])
    
    const row = result.rows[0]
    return {
      user_id: row.user_id,
      title: row.title,
      author: row.author,
      url: row.url,
      updated_at: row.updated_at
    }
  } catch (error) {
    log('ui','Error creating/updating user current book:', error)
    throw error
  } finally {
    client.release()
  }
}

// Bookmark operations
export async function getUserBookmark(user_id: string, bookTitle: string, bookAuthor: string): Promise<UserBookmark | null> {
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      'SELECT * FROM user_bookmarks WHERE user_id = $1 AND book_title = $2 AND book_author = $3',
      [user_id, bookTitle, bookAuthor]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      user_id: row.user_id,
      book_title: row.book_title,
      book_author: row.book_author,
      scroll_position: row.scroll_position,
      updated_at: row.updated_at
    }
  } catch (error) {
    log('ui','Error getting user bookmark:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function createOrUpdateUserBookmark(bookmark: UserBookmark): Promise<UserBookmark> {
  const client = await pool.connect()
  
  try {
    const now = new Date()
    const query = `
      INSERT INTO user_bookmarks (user_id, book_title, book_author, scroll_position, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, book_title, book_author) DO UPDATE SET
        scroll_position = EXCLUDED.scroll_position,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `
    const params = [bookmark.user_id, bookmark.book_title, bookmark.book_author, bookmark.scroll_position, now]
    
    const result = await client.query(query, params)
    
    if (result.rows.length === 0) {
      throw new Error('No rows returned from INSERT query')
    }
    
    const row = result.rows[0]
    return {
      user_id: row.user_id,
      book_title: row.book_title,
      book_author: row.book_author,
      scroll_position: row.scroll_position,
      updated_at: row.updated_at
    }
  } catch (error) {
    log('ui','Error creating/updating user bookmark:', error)
    throw error
  } finally {
    client.release()
  }
}

export async function getAllUserBookmarks(user_id: string): Promise<UserBookmark[]> {
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      'SELECT * FROM user_bookmarks WHERE user_id = $1 ORDER BY updated_at DESC',
      [user_id]
    )
    
    return result.rows.map(row => ({
      user_id: row.user_id,
      book_title: row.book_title,
      book_author: row.book_author,
      scroll_position: row.scroll_position,
      updated_at: row.updated_at
    }))
  } catch (error) {
    log('ui','Error getting all user bookmarks:', error)
    throw error
  } finally {
    client.release()
  }
}

// Utility function to clear all data for a user (for testing)
export async function clearUserData(user_id: string): Promise<void> {
  const client = await pool.connect()
  
  try {
    await client.query('DELETE FROM user_profiles WHERE user_id = $1', [user_id])
    await client.query('DELETE FROM user_settings WHERE user_id = $1', [user_id])
    await client.query('DELETE FROM user_current_books WHERE user_id = $1', [user_id])
    await client.query('DELETE FROM user_bookmarks WHERE user_id = $1', [user_id])
log('api',`Cleared all data for user: ${user_id}`)
  } catch (error) {
    log('ui','Error clearing user data:', error)
    throw error
  } finally {
    client.release()
  }
}

// Close the pool when the application shuts down
export async function closeDatabase() {
  await pool.end()
}
