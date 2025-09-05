import { neon } from '@neondatabase/serverless'

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL!)

// Database schema interfaces
export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  created_at: Date
  updated_at: Date
}

export interface UserCredits {
  user_id: string
  available_credits: number
  total_purchased: number
  total_used: number
  has_unlimited_access: boolean
  unlimited_access_until: Date | null
  updated_at: Date
}

export interface BookPurchase {
  id: string
  user_id: string
  book_title: string
  book_author: string
  purchase_date: Date
}

export interface UsageLog {
  id: string
  user_id: string
  book_title: string
  book_author: string
  usage_type: 'explanation' | 'chat' | 'book_purchase' | 'credit_purchase'
  created_at: Date
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // User credits table
    await sql`
      CREATE TABLE IF NOT EXISTS user_credits (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        available_credits INTEGER DEFAULT 5,
        total_purchased INTEGER DEFAULT 0,
        total_used INTEGER DEFAULT 0,
        has_unlimited_access BOOLEAN DEFAULT FALSE,
        unlimited_access_until TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Book purchases table
    await sql`
      CREATE TABLE IF NOT EXISTS book_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_title TEXT NOT NULL,
        book_author TEXT NOT NULL,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_title, book_author)
      )
    `

    // Usage logs table
    await sql`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_title TEXT NOT NULL,
        book_author TEXT NOT NULL,
        usage_type TEXT NOT NULL CHECK (usage_type IN ('explanation', 'chat', 'book_purchase', 'credit_purchase')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log('Database tables initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

// User management functions
export async function createOrGetUser(email: string, name?: string, image?: string): Promise<User> {
  try {
    // Try to get existing user
    const existingUsers = await sql`
      SELECT * FROM users WHERE email = ${email}
    `
    
    if (existingUsers.length > 0) {
      return existingUsers[0] as User
    }

    // Create new user
    const userId = crypto.randomUUID()
    await sql`
      INSERT INTO users (id, email, name, image)
      VALUES (${userId}, ${email}, ${name || null}, ${image || null})
    `

    // Initialize user credits
    await sql`
      INSERT INTO user_credits (user_id)
      VALUES (${userId})
    `

    // Return the new user
    const newUsers = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `
    
    return newUsers[0] as User
  } catch (error) {
    console.error('Error creating/getting user:', error)
    throw error
  }
}

// Credit management functions
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  try {
    const result = await sql`
      SELECT * FROM user_credits WHERE user_id = ${userId}
    `
    return result.length > 0 ? result[0] as UserCredits : null
  } catch (error) {
    console.error('Error getting user credits:', error)
    throw error
  }
}

export async function addCredits(userId: string, amount: number): Promise<void> {
  try {
    await sql`
      UPDATE user_credits 
      SET 
        available_credits = available_credits + ${amount},
        total_purchased = total_purchased + ${amount},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `
  } catch (error) {
    console.error('Error adding credits:', error)
    throw error
  }
}

export async function purchaseCredits(userId: string, amount: number = 100): Promise<void> {
  try {
    // Add the credits
    await addCredits(userId, amount)
    
    // Log the purchase
    await logUsage(userId, 'credits', `${amount}`, 'credit_purchase')
  } catch (error) {
    console.error('Error purchasing credits:', error)
    throw error
  }
}

export async function useCredit(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE user_credits 
      SET 
        available_credits = available_credits - 1,
        total_used = total_used + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND available_credits > 0
      RETURNING available_credits
    `
    
    return result.length > 0
  } catch (error) {
    console.error('Error using credit:', error)
    throw error
  }
}

export async function grantUnlimitedAccess(userId: string, duration: 'day' | 'month' | 'year'): Promise<void> {
  try {
    const now = new Date()
    let expiryTime: Date
    
    switch (duration) {
      case 'day':
        expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'month':
        expiryTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        expiryTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        break
      default:
        expiryTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Default to month
    }

    await sql`
      UPDATE user_credits 
      SET 
        has_unlimited_access = TRUE,
        unlimited_access_until = ${expiryTime.toISOString()},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `
  } catch (error) {
    console.error('Error granting unlimited access:', error)
    throw error
  }
}

// Book purchase functions
export async function purchaseBook(userId: string, bookTitle: string, bookAuthor: string): Promise<void> {
  try {
    await sql`
      INSERT INTO book_purchases (user_id, book_title, book_author)
      VALUES (${userId}, ${bookTitle}, ${bookAuthor})
      ON CONFLICT (user_id, book_title, book_author) DO NOTHING
    `
  } catch (error) {
    console.error('Error purchasing book:', error)
    throw error
  }
}

export async function getUserBookPurchases(userId: string): Promise<BookPurchase[]> {
  try {
    const result = await sql`
      SELECT * FROM book_purchases WHERE user_id = ${userId}
      ORDER BY purchase_date DESC
    `
    return result as BookPurchase[]
  } catch (error) {
    console.error('Error getting user book purchases:', error)
    throw error
  }
}

export async function hasUserPurchasedBook(userId: string, bookTitle: string, bookAuthor: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM book_purchases 
      WHERE user_id = ${userId} AND book_title = ${bookTitle} AND book_author = ${bookAuthor}
    `
    return result.length > 0
  } catch (error) {
    console.error('Error checking book purchase:', error)
    throw error
  }
}

// Usage tracking functions
export async function logUsage(userId: string, bookTitle: string, bookAuthor: string, usageType: UsageLog['usage_type']): Promise<void> {
  try {
    await sql`
      INSERT INTO usage_logs (user_id, book_title, book_author, usage_type)
      VALUES (${userId}, ${bookTitle}, ${bookAuthor}, ${usageType})
    `
  } catch (error) {
    console.error('Error logging usage:', error)
    throw error
  }
}

export async function getUserBookUsage(userId: string, bookTitle: string, bookAuthor: string): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM usage_logs 
      WHERE user_id = ${userId} 
        AND book_title = ${bookTitle} 
        AND book_author = ${bookAuthor}
        AND usage_type = 'explanation'
    `
    return parseInt(result[0].count as string)
  } catch (error) {
    console.error('Error getting user book usage:', error)
    throw error
  }
}

export async function getAllUserBookUsage(userId: string): Promise<{ [key: string]: number }> {
  try {
    const result = await sql`
      SELECT book_title, book_author, COUNT(*) as usage_count
      FROM usage_logs 
      WHERE user_id = ${userId} AND usage_type = 'explanation'
      GROUP BY book_title, book_author
    `
    
    const bookExplanations: { [key: string]: number } = {}
    for (const row of result) {
      const bookKey = `${row.book_title}-${row.book_author}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      bookExplanations[bookKey] = parseInt(row.usage_count as string)
    }
    
    return bookExplanations
  } catch (error) {
    console.error('Error getting all user book usage:', error)
    return {}
  }
}

export async function getUserTotalUsage(userId: string): Promise<{ total: number; today: number }> {
  try {
    // Get total usage
    const totalResult = await sql`
      SELECT COUNT(*) as total_count
      FROM usage_logs 
      WHERE user_id = ${userId} AND usage_type = 'explanation'
    `
    
    // Get today's usage
    const today = new Date().toISOString().split('T')[0]
    const todayResult = await sql`
      SELECT COUNT(*) as today_count
      FROM usage_logs 
      WHERE user_id = ${userId} AND usage_type = 'explanation' AND DATE(created_at) = ${today}
    `
    
    return {
      total: parseInt(totalResult[0]?.total_count as string || '0'),
      today: parseInt(todayResult[0]?.today_count as string || '0')
    }
  } catch (error) {
    console.error('Error getting user total usage:', error)
    return { total: 0, today: 0 }
  }
}

// Access validation function
export async function canUserExplainText(userId: string, bookTitle: string, bookAuthor: string): Promise<{ canUse: boolean; reason: string }> {
  try {
    const credits = await getUserCredits(userId)
    if (!credits) {
      return { canUse: false, reason: 'User credits not found' }
    }

    // Check unlimited access
    if (credits.has_unlimited_access && credits.unlimited_access_until) {
      const now = new Date()
      const expiryDate = new Date(credits.unlimited_access_until)
      if (now < expiryDate) {
        return { canUse: true, reason: 'Unlimited access active' }
      }
    }

    // Check if book is purchased
    const hasPurchased = await hasUserPurchasedBook(userId, bookTitle, bookAuthor)
    if (hasPurchased) {
      return { canUse: true, reason: 'Book purchased' }
    }

    // Check free explanations (3 per book)
    const usageCount = await getUserBookUsage(userId, bookTitle, bookAuthor)
    if (usageCount < 3) {
      return { canUse: true, reason: 'Free explanation available' }
    }

    // Check available credits
    if (credits.available_credits > 0) {
      return { canUse: true, reason: 'Credits available' }
    }

    return { canUse: false, reason: 'No credits or access available' }
  } catch (error) {
    console.error('Error checking user access:', error)
    return { canUse: false, reason: 'Error checking access' }
  }
}
