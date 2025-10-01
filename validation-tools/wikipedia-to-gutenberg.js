const fs = require('fs');
const path = require('path');

// Function to search Wikipedia for book pages
async function searchWikipediaBooks(category = 'Literature') {
  console.log(`🔍 Searching Wikipedia for books in category: ${category}`);
  
  const books = [];
  let continueToken = null;
  let pageCount = 0;
  
  do {
    try {
      // Search for pages in literature category
      let searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:${encodeURIComponent(category)}&cmlimit=500`;
      
      if (continueToken) {
        searchUrl += `&cmcontinue=${encodeURIComponent(continueToken)}`;
      }
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.query && data.query.categorymembers) {
        for (const page of data.query.categorymembers) {
          const title = page.title;
          
          // Skip if it's a category or subcategory
          if (title.startsWith('Category:')) continue;
          
          // Skip if it's clearly not a book (films, adaptations, etc.)
          if (isBookPage(title)) {
            books.push({
              title: title,
              pageId: page.pageid,
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
            });
            pageCount++;
          }
        }
        
        continueToken = data.continue?.cmcontinue || null;
        console.log(`  Found ${pageCount} book pages so far...`);
      }
    } catch (error) {
      console.log(`  ⚠️  Error searching Wikipedia: ${error.message}`);
      break;
    }
  } while (continueToken && pageCount < 1000); // Limit to prevent infinite loops
  
  console.log(`📚 Found ${books.length} potential book pages`);
  return books;
}

// Function to check if a page title looks like a book
function isBookPage(title) {
  const lowerTitle = title.toLowerCase();
  
  // Exclude non-book content
  const exclusions = [
    'film', 'movie', 'adaptation', 'television', 'tv', 'series', 'episode',
    'musical', 'opera', 'ballet', 'play', 'theatre', 'theater',
    'bibliography', 'works', 'list of', 'complete works', 'collected works',
    'spacecraft', 'cabalga', 'curse of', '2016', '1993', '1968', '1962',
    '1963', '1959', 'character', 'cast', 'crew', 'soundtrack', 'album'
  ];
  
  return !exclusions.some(exclusion => lowerTitle.includes(exclusion));
}

// Function to get author information from Wikipedia page
async function getAuthorInfo(pageId) {
  try {
    // Get page content
    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&pageids=${pageId}`;
    const response = await fetch(pageUrl);
    const data = await response.json();
    
    if (data.query && data.query.pages) {
      const pageId = Object.keys(data.query.pages)[0];
      const pageContent = data.query.pages[pageId].extract || '';
      
      // Look for author information in the content
      const authorMatch = pageContent.match(/by\s+([^.\n]+)/i) || 
                        pageContent.match(/author[:\s]+([^.\n]+)/i) ||
                        pageContent.match(/written\s+by\s+([^.\n]+)/i);
      
      if (authorMatch) {
        const authorName = authorMatch[1].trim();
        
        // Search for author's Wikipedia page
        const authorInfo = await searchAuthorWikipedia(authorName);
        return {
          name: authorName,
          ...authorInfo
        };
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Error getting author info for page ${pageId}: ${error.message}`);
  }
  
  return null;
}

// Function to search for author's Wikipedia page and get death date
async function searchAuthorWikipedia(authorName) {
  try {
    // Search for author
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(authorName)}&srlimit=5`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.query && data.query.search) {
      for (const result of data.query.search) {
        const title = result.title;
        
        // Check if this looks like an author page (not a book page)
        if (isAuthorPage(title, authorName)) {
          // Get author's biographical info
          const authorPageId = await getPageId(title);
          if (authorPageId) {
            const deathDate = await getDeathDate(authorPageId);
            return {
              wikipediaTitle: title,
              deathDate: deathDate,
              isPublicDomain: deathDate ? isPublicDomain(deathDate) : false
            };
          }
        }
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Error searching for author "${authorName}": ${error.message}`);
  }
  
  return {
    wikipediaTitle: null,
    deathDate: null,
    isPublicDomain: false
  };
}

// Function to check if a page looks like an author page
function isAuthorPage(title, authorName) {
  const lowerTitle = title.toLowerCase();
  const lowerAuthor = authorName.toLowerCase();
  
  // Should contain the author's name
  if (!lowerTitle.includes(lowerAuthor)) return false;
  
  // Should not be a book title
  const bookIndicators = ['book', 'novel', 'poem', 'play', 'work', 'collection'];
  if (bookIndicators.some(indicator => lowerTitle.includes(indicator))) return false;
  
  // Should not be a film/adaptation
  const nonAuthorIndicators = ['film', 'movie', 'adaptation', 'character', 'cast'];
  if (nonAuthorIndicators.some(indicator => lowerTitle.includes(indicator))) return false;
  
  return true;
}

// Function to get Wikipedia page ID from title
async function getPageId(title) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.query && data.query.pages) {
      const pageIds = Object.keys(data.query.pages);
      return pageIds[0] !== '-1' ? pageIds[0] : null;
    }
  } catch (error) {
    console.log(`  ⚠️  Error getting page ID for "${title}": ${error.message}`);
  }
  
  return null;
}

// Function to extract death date from Wikipedia page
async function getDeathDate(pageId) {
  try {
    // Get page content
    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&pageids=${pageId}`;
    const response = await fetch(pageUrl);
    const data = await response.json();
    
    if (data.query && data.query.pages) {
      const pageId = Object.keys(data.query.pages)[0];
      const pageContent = data.query.pages[pageId].extract || '';
      
      // Look for death date patterns
      const deathPatterns = [
        /died\s+(\d{1,2}\s+\w+\s+\d{4})/i,
        /died\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
        /died\s+(\d{4})/i,
        /death[:\s]+(\d{1,2}\s+\w+\s+\d{4})/i,
        /death[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
        /death[:\s]+(\d{4})/i
      ];
      
      for (const pattern of deathPatterns) {
        const match = pageContent.match(pattern);
        if (match) {
          return parseDeathDate(match[1]);
        }
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Error getting death date for page ${pageId}: ${error.message}`);
  }
  
  return null;
}

// Function to parse death date string
function parseDeathDate(dateStr) {
  try {
    // Try to parse various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.getFullYear();
    }
    
    // Try to extract year from string
    const yearMatch = dateStr.match(/(\d{4})/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
  } catch (error) {
    console.log(`  ⚠️  Error parsing date "${dateStr}": ${error.message}`);
  }
  
  return null;
}

// Function to check if author is in public domain (dead 70+ years)
function isPublicDomain(deathYear) {
  const currentYear = new Date().getFullYear();
  return deathYear && (currentYear - deathYear) >= 70;
}

// Function to search Project Gutenberg for a book
async function searchProjectGutenberg(bookTitle, authorName) {
  try {
    // Search PG catalog
    const searchUrl = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(bookTitle + ' ' + authorName)}&submit_search=Go%21`;
    
    // Note: This would require web scraping since PG doesn't have a simple API
    // For now, we'll return a placeholder
    return {
      found: false, // Would need to implement actual search
      gutenbergId: null,
      url: searchUrl
    };
  } catch (error) {
    console.log(`  ⚠️  Error searching PG for "${bookTitle}": ${error.message}`);
    return { found: false, gutenbergId: null, url: null };
  }
}

// Main function
async function main() {
  console.log('🔍 Wikipedia to Project Gutenberg Pipeline');
  console.log('Finding books with Wikipedia pages by authors in public domain\n');
  
  // Step 1: Search Wikipedia for book pages
  const bookPages = await searchWikipediaBooks('Literature');
  
  console.log(`\n📚 Processing ${bookPages.length} book pages...\n`);
  
  const results = [];
  let processed = 0;
  
  for (const book of bookPages.slice(0, 50)) { // Limit to first 50 for testing
    console.log(`[${processed + 1}/50] Processing: "${book.title}"`);
    
    // Step 2: Get author information
    const authorInfo = await getAuthorInfo(book.pageId);
    
    if (authorInfo && authorInfo.isPublicDomain) {
      console.log(`  ✅ Author "${authorInfo.name}" died in ${authorInfo.deathDate} (public domain)`);
      
      // Step 3: Search Project Gutenberg
      const pgResult = await searchProjectGutenberg(book.title, authorInfo.name);
      
      results.push({
        book: {
          title: book.title,
          wikipediaUrl: book.url,
          pageId: book.pageId
        },
        author: {
          name: authorInfo.name,
          deathDate: authorInfo.deathDate,
          wikipediaTitle: authorInfo.wikipediaTitle,
          isPublicDomain: authorInfo.isPublicDomain
        },
        gutenberg: pgResult
      });
      
      if (pgResult.found) {
        console.log(`  📖 Found in Project Gutenberg: ID ${pgResult.gutenbergId}`);
      } else {
        console.log(`  ❌ Not found in Project Gutenberg`);
      }
    } else if (authorInfo) {
      console.log(`  ❌ Author "${authorInfo.name}" died in ${authorInfo.deathDate} (not public domain)`);
    } else {
      console.log(`  ❌ Could not find author information`);
    }
    
    processed++;
    console.log(''); // Empty line for readability
    
    // Add delay to be respectful to Wikipedia API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save results
  fs.writeFileSync('wikipedia-to-gutenberg-results.json', JSON.stringify(results, null, 2));
  
  console.log(`\n📊 FINAL RESULTS:`);
  console.log(`  📚 Books processed: ${processed}`);
  console.log(`  ✅ Public domain books: ${results.length}`);
  console.log(`  📖 Found in PG: ${results.filter(r => r.gutenberg.found).length}`);
  
  console.log(`\n📄 Results saved to: wikipedia-to-gutenberg-results.json`);
}

main().catch(console.error);
