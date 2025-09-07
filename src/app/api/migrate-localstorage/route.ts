import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createOrUpdateUserProfile, createOrUpdateUserSettings, createOrUpdateUserCurrentBook, createOrUpdateUserBookmark } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profileData, settingsData, currentBookData, bookmarksData } = body

    const results = {
      profile: null as any,
      settings: null as any,
      currentBook: null as any,
      bookmarks: [] as any[]
    }

    // Migrate profile data
    if (profileData) {
      try {
        const migratedProfile = await createOrUpdateUserProfile({
          email: session.user.email,
          age: profileData.age,
          language: profileData.language,
          education_level: profileData.educationLevel,
          first_login: profileData.firstLogin ? new Date(profileData.firstLogin) : null,
          total_explanations: profileData.totalExplanations || 0,
          today_explanations: profileData.todayExplanations || 0,
          available_credits: profileData.availableCredits || 5,
          book_explanations: profileData.bookExplanations || {},
          purchased_books: profileData.purchasedBooks || [],
          purchased_book_details: profileData.purchasedBookDetails || {},
          has_unlimited_access: profileData.hasUnlimitedAccess || false,
          unlimited_access_expiry: profileData.unlimitedAccessExpiry ? new Date(profileData.unlimitedAccessExpiry) : null
        })
        results.profile = migratedProfile
      } catch (error) {
        console.error('Error migrating profile:', error)
      }
    }

    // Migrate settings data
    if (settingsData) {
      try {
        const migratedSettings = await createOrUpdateUserSettings({
          email: session.user.email,
          llm_provider: settingsData.llmProvider,
          response_length: settingsData.responseLength,
          text_font: settingsData.textFont,
          chat_font: settingsData.chatFont,
          reading_mode: settingsData.readingMode,
          explanation_style: settingsData.explanationStyle,
          custom_api_key: settingsData.customApiKey,
          custom_api_url: settingsData.customApiUrl,
          custom_model_name: settingsData.customModelName
        })
        results.settings = migratedSettings
      } catch (error) {
        console.error('Error migrating settings:', error)
      }
    }

    // Migrate current book data
    if (currentBookData) {
      try {
        const migratedCurrentBook = await createOrUpdateUserCurrentBook({
          email: session.user.email,
          title: currentBookData.title,
          author: currentBookData.author,
          url: currentBookData.url
        })
        results.currentBook = migratedCurrentBook
      } catch (error) {
        console.error('Error migrating current book:', error)
      }
    }

    // Migrate bookmarks data
    if (bookmarksData && Array.isArray(bookmarksData)) {
      for (const bookmark of bookmarksData) {
        try {
          const migratedBookmark = await createOrUpdateUserBookmark({
            email: session.user.email,
            book_title: bookmark.bookTitle,
            book_author: bookmark.bookAuthor,
            scroll_position: bookmark.scrollPosition
          })
          results.bookmarks.push(migratedBookmark)
        } catch (error) {
          console.error('Error migrating bookmark:', error)
        }
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      results
    })
  } catch (error) {
    console.error('Error during migration:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}











