const fs = require('fs');
const path = require('path');

// List of Wikipedia categories to search for public domain books
const SEARCH_CATEGORIES = [
  'Category:19th-century_books',
  'Category:18th-century_books', 
  'Category:17th-century_books',
  'Category:16th-century_books',
  'Category:15th-century_books',
  'Category:14th-century_books',
  'Category:13th-century_books',
  'Category:12th-century_books',
  'Category:11th-century_books',
  'Category:1st-millennium_books',
  'Category:1st-millennium_BC_books',
  'Category:2nd-millennium_BC_books',
  'Category:3rd-millennium_BC_books',
  'Category:Medieval_books',
  'Category:Classical_literature',
  'Category:Ancient_literature',
  'Category:Public_domain_books'
];

// Function to search Wikipedia for books in a category
async function searchWikipediaCategory(category) {
  console.log(`🔍 Searching Wikipedia category: ${category}`);
  
  const books = [];
  let continueToken = null;
  let pageCount = 0;
  
  do {
    try {
      // Search for pages in the category
      let searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=categorymembers&cmtitle=${encodeURIComponent(category)}&cmlimit=500`;
      
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
          
          // Check if it looks like a book
          if (isBookPage(title)) {
            books.push({
              title: title,
              pageId: page.pageid,
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
              category: category
            });
            pageCount++;
          }
        }
        
        continueToken = data.continue?.cmcontinue || null;
        console.log(`  Found ${pageCount} book pages so far...`);
      }
    } catch (error) {
      console.log(`  ⚠️  Error searching category ${category}: ${error.message}`);
      break;
    }
  } while (continueToken && pageCount < 1000); // Limit to prevent infinite loops
  
  console.log(`📚 Found ${books.length} books in ${category}`);
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
    '1963', '1959', 'character', 'cast', 'crew', 'soundtrack', 'album',
    'category:', 'portal:', 'template:', 'user:', 'talk:', 'file:',
    'help:', 'special:', 'wikipedia:', 'mediawiki:'
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
    // For now, we'll return a placeholder since PG search requires web scraping
    // In a real implementation, you'd scrape the PG search results
    return {
      found: false, // Would need to implement actual search
      gutenbergId: null,
      searchUrl: `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(bookTitle + ' ' + authorName)}&submit_search=Go%21`
    };
  } catch (error) {
    console.log(`  ⚠️  Error searching PG for "${bookTitle}": ${error.message}`);
    return { found: false, gutenbergId: null, searchUrl: null };
  }
}

// Main function
async function main() {
  console.log('🔍 Comprehensive Public Domain Books Search');
  console.log('Searching multiple Wikipedia categories for public domain books\n');
  
  const allBooks = [];
  let totalProcessed = 0;
  
  // Search each category
  for (const category of SEARCH_CATEGORIES) {
    console.log(`\n📚 Searching category: ${category}`);
    const books = await searchWikipediaCategory(category);
    allBooks.push(...books);
    
    console.log(`  Total books found so far: ${allBooks.length}`);
    
    // Add delay to be respectful to Wikipedia API
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Remove duplicates based on title
  const uniqueBooks = [];
  const seenTitles = new Set();
  
  for (const book of allBooks) {
    const normalizedTitle = book.title.toLowerCase().trim();
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniqueBooks.push(book);
    }
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`  📚 Total books found: ${allBooks.length}`);
  console.log(`  🔄 After deduplication: ${uniqueBooks.length}`);
  
  // Save the raw list
  fs.writeFileSync('comprehensive-book-list.json', JSON.stringify(uniqueBooks, null, 2));
  
  console.log(`\n📄 Raw book list saved to: comprehensive-book-list.json`);
  console.log(`\nNext step: Process these books to find authors and check Project Gutenberg availability`);
}

main().catch(console.error);

