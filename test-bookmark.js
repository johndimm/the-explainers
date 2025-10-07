// Unit test for bookmark saving
const fetch = require('node-fetch');

async function testBookmarkSaving() {
  console.log('🧪 Testing bookmark saving...');
  
  const baseUrl = 'https://romeo-and-juliet-explained.vercel.app';
  const testUserAgent = 'Mozilla/5.0 (Test Agent) TestBookmark/1.0';
  
  // Test data
  const bookmarkData = {
    bookTitle: 'Romeo and Juliet',
    bookAuthor: 'William Shakespeare',
    scrollPosition: 12345
  };
  
  try {
    // 1. First, check if bookmark exists
    console.log('📖 Checking existing bookmark...');
    const getResponse = await fetch(`${baseUrl}/api/user/bookmark?bookTitle=${encodeURIComponent(bookmarkData.bookTitle)}&bookAuthor=${encodeURIComponent(bookmarkData.bookAuthor)}`, {
      headers: {
        'User-Agent': testUserAgent
      }
    });
    
    if (getResponse.ok) {
      const existingBookmark = await getResponse.json();
      console.log('📖 Existing bookmark:', existingBookmark);
    } else {
      console.log('📖 No existing bookmark found');
    }
    
    // 2. Save a new bookmark
    console.log('💾 Saving new bookmark...');
    const postResponse = await fetch(`${baseUrl}/api/user/bookmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': testUserAgent
      },
      body: JSON.stringify(bookmarkData)
    });
    
    console.log('📊 Response status:', postResponse.status);
    console.log('📊 Response headers:', Object.fromEntries(postResponse.headers.entries()));
    
    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log('✅ Bookmark saved successfully:', result);
    } else {
      const errorText = await postResponse.text();
      console.log('❌ Failed to save bookmark:', errorText);
    }
    
    // 3. Verify the bookmark was saved
    console.log('🔍 Verifying bookmark was saved...');
    const verifyResponse = await fetch(`${baseUrl}/api/user/bookmark?bookTitle=${encodeURIComponent(bookmarkData.bookTitle)}&bookAuthor=${encodeURIComponent(bookmarkData.bookAuthor)}`, {
      headers: {
        'User-Agent': testUserAgent
      }
    });
    
    if (verifyResponse.ok) {
      const savedBookmark = await verifyResponse.json();
      console.log('✅ Verified bookmark:', savedBookmark);
      
      if (savedBookmark.scroll_position === bookmarkData.scrollPosition) {
        console.log('🎉 SUCCESS: Bookmark position matches!');
      } else {
        console.log('❌ FAIL: Bookmark position does not match');
      }
    } else {
      console.log('❌ Failed to verify bookmark');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testBookmarkSaving();