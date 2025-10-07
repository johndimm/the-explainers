import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/utils/log'
// No authentication needed
import { createOrUpdateUserProfile, createOrUpdateUserSettings, createOrUpdateUserCurrentBook, createOrUpdateUserBookmark } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileData, settingsData, currentBookData, bookmarksData, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

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
          user_id: userId,
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
        log('api','Error migrating profile:', error)
      }
    }

    // Migrate settings data
    if (settingsData) {
      try {
        const migratedSettings = await createOrUpdateUserSettings({
          user_id: userId,
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
        log('api','Error migrating settings:', error)
      }
    }

    // Migrate current book data
    if (currentBookData) {
      try {
        const migratedCurrentBook = await createOrUpdateUserCurrentBook({
          user_id: userId,
          title: currentBookData.title,
          author: currentBookData.author,
          url: currentBookData.url
        })
        results.currentBook = migratedCurrentBook
      } catch (error) {
        log('api','Error migrating current book:', error)
      }
    }

    // Migrate bookmarks data
    if (bookmarksData && Array.isArray(bookmarksData)) {
      for (const bookmark of bookmarksData) {
        try {
          const migratedBookmark = await createOrUpdateUserBookmark({
            user_id: userId,
            book_title: bookmark.bookTitle,
            book_author: bookmark.bookAuthor,
            scroll_position: bookmark.scrollPosition
          })
          results.bookmarks.push(migratedBookmark)
        } catch (error) {
          log('api','Error migrating bookmark:', error)
        }
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      results
    })
  } catch (error) {
    log('api','Error during migration:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}











