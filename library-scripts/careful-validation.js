const fs = require('fs');
const path = require('path');

// Function to check if a book has a dedicated Wikipedia page
async function checkWikipediaPage(book) {
  const title = book.title;
  const author = book.author;
  const gutenbergId = book.id;
  
  // Create search queries for the book
  const queries = [
    `"${title}" "${author}"`,  // Exact title and author
    `"${title}" book`,         // Title with "book" keyword
    `"${title}" novel`,        // Title with "novel" keyword
    `"${title}" poem`,         // Title with "poem" keyword
    `"${title}" play`,         // Title with "play" keyword
  ];
  
  for (const query of queries) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.query && data.query.search) {
        for (const result of data.query.search) {
          const pageTitle = result.title.toLowerCase();
          const pageSnippet = result.snippet.toLowerCase();
          
          // Check if this looks like a book page (not just author page)
          const isBookPage = (
            pageTitle.includes(title.toLowerCase()) ||
            pageSnippet.includes(title.toLowerCase())
          ) && (
            // Exclude pages that are clearly about the author, not the book
            !pageTitle.includes('bibliography') &&
            !pageTitle.includes('works') &&
            !pageTitle.includes('list of') &&
            !pageTitle.includes('complete works') &&
            !pageTitle.includes('film') &&
            !pageTitle.includes('movie') &&
            !pageTitle.includes('adaptation') &&
            !pageTitle.includes('spacecraft') &&
            !pageTitle.includes('cabalga') &&
            !pageTitle.includes('curse of') &&
            !pageTitle.includes('2016') &&
            !pageTitle.includes('1993') &&
            !pageTitle.includes('1968') &&
            !pageTitle.includes('1962') &&
            !pageTitle.includes('1963') &&
            !pageTitle.includes('1959') &&
            !pageTitle.includes('musical') &&
            !pageTitle.includes('opera') &&
            !pageTitle.includes('ballet') &&
            !pageTitle.includes('play') &&
            !pageSnippet.includes('bibliography') &&
            !pageSnippet.includes('complete works') &&
            !pageSnippet.includes('film') &&
            !pageSnippet.includes('movie') &&
            !pageSnippet.includes('adaptation')
          );
          
          if (isBookPage) {
            // Now verify this is the same book by checking the page content
            const isSameBook = await verifyWikipediaPageContent(result.title, title, author, gutenbergId);
            if (isSameBook) {
              console.log(`    📖 Found Wikipedia page: "${result.title}" (verified as same book)`);
              return true;
            } else {
              console.log(`    ⚠️  Found Wikipedia page but different book: "${result.title}"`);
            }
          }
        }
      }
    } catch (error) {
      console.log(`    ⚠️  Wikipedia search error for "${query}": ${error.message}`);
    }
  }
  
  console.log(`    ❌ No dedicated Wikipedia page found for "${title}"`);
  return false;
}

// Function to verify that a Wikipedia page is about the same book
async function verifyWikipediaPageContent(pageTitle, expectedTitle, expectedAuthor, gutenbergId) {
  try {
    // Get the page content
    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(pageTitle)}`;
    
    const response = await fetch(pageUrl);
    const data = await response.json();
    
    if (data.query && data.query.pages) {
      const pageId = Object.keys(data.query.pages)[0];
      const pageContent = data.query.pages[pageId].extract || '';
      const content = pageContent.toLowerCase();
      
      // Check for author match (more flexible)
      const authorMatch = content.includes(expectedAuthor.toLowerCase()) ||
                         expectedAuthor.toLowerCase().split(' ').some(name => 
                           name.length > 2 && content.includes(name)
                         );
      
      // Check for Gutenberg reference
      const gutenbergMatch = content.includes('project gutenberg') ||
                            content.includes('gutenberg') ||
                            content.includes(`pg${gutenbergId}`) ||
                            content.includes(gutenbergId.toString());
      
      // Check for title variations
      const titleWords = expectedTitle.toLowerCase().split(' ').filter(w => w.length > 2);
      const titleMatch = titleWords.every(word => content.includes(word));
      
      // Must have author match AND (title match OR gutenberg reference)
      const isSameBook = authorMatch && (titleMatch || gutenbergMatch);
      
      if (isSameBook) {
        console.log(`      ✅ Verified: Author match: ${authorMatch}, Title match: ${titleMatch}, Gutenberg ref: ${gutenbergMatch}`);
      } else {
        console.log(`      ❌ Not same book: Author match: ${authorMatch}, Title match: ${titleMatch}, Gutenberg ref: ${gutenbergMatch}`);
      }
      
      return isSameBook;
    }
  } catch (error) {
    console.log(`    ⚠️  Error verifying Wikipedia page: ${error.message}`);
  }
  
  return false;
}

// Library files to validate
const LIBRARY_FILES = [
  'shakespeare.json',
  'plato.json',
  'english-literature.json', 
  'philosophers.json',
  'poetry.json',
  'french-literature.json',
  'german-literature.json',
  'italian-literature.json',
  'spanish-literature.json',
  'gutenberg-top.json'
];

// Output files for results
const OUTPUT_FILE = 'validation-results.json';
const VALID_BOOKS_FILE = 'valid-books.json';
const INVALID_BOOKS_FILE = 'invalid-books.json';

// Configuration
const STOP_ON_FIRST_ERROR = process.env.STOP_ON_FIRST_ERROR === 'true'; // Set to true to stop on first error
const BOOKS_PER_RUN = parseInt(process.env.BOOKS_PER_RUN) || 1000; // Process books per run (default 1000)

// Load existing valid books to avoid re-checking
function loadValidBooks() {
  try {
    if (fs.existsSync(VALID_BOOKS_FILE)) {
      const content = fs.readFileSync(VALID_BOOKS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.log(`⚠️  Could not load ${VALID_BOOKS_FILE}: ${error.message}`);
  }
  return [];
}

// Load existing invalid books to append to
function loadInvalidBooks() {
  try {
    if (fs.existsSync(INVALID_BOOKS_FILE)) {
      const content = fs.readFileSync(INVALID_BOOKS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.log(`⚠️  Could not load ${INVALID_BOOKS_FILE}: ${error.message}`);
  }
  return [];
}

// Save valid books
function saveValidBooks(validBooks) {
  fs.writeFileSync(VALID_BOOKS_FILE, JSON.stringify(validBooks, null, 2));
}

// Save invalid books
function saveInvalidBooks(invalidBooks) {
  fs.writeFileSync(INVALID_BOOKS_FILE, JSON.stringify(invalidBooks, null, 2));
}

// Create a unique key for a book
function getBookKey(book) {
  return `${book.id}-${book.title}-${book.author}`;
}

async function validateBook(book) {
  if (!book.id || !book.title || !book.author) {
    return { 
      isValid: false, 
      reason: 'Missing required fields (id, title, or author)',
      actualTitle: '',
      actualAuthor: '',
      workingUrl: ''
    };
  }

  console.log(`\n🔍 Checking: "${book.title}" by ${book.author} (ID: ${book.id})`);

  // Check if this is a special case (non-numeric ID or local file)
  if (book.localPath || book.directUrl || isNaN(book.id)) {
    console.log(`    ℹ️  Special case detected - skipping Project Gutenberg validation`);
    return {
      isValid: true,
      reason: 'Special case (local file or non-PG source)',
      actualTitle: book.title,
      actualAuthor: book.author,
      workingUrl: book.directUrl || book.localPath || 'N/A'
    };
  }

  // Try different URL formats
  const urls = [
    `https://www.gutenberg.org/files/${book.id}/${book.id}-0.txt`,
    `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`,
    `https://www.gutenberg.org/cache/epub/${book.id}/${book.id}-0.txt`
  ];
  
  let networkFailure = true;
  let extractionFailure = false;
  let lastNetworkError = '';
  let lastExtractionError = '';
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`  Trying URL ${i + 1}: ${url}`);
    
    try {
      const response = await fetch(url);
      console.log(`    Response status: ${response.status}`);
      
      if (!response.ok) {
        console.log(`    ❌ HTTP ${response.status}`);
        lastNetworkError = `HTTP ${response.status} at ${url}`;
        continue;
      }
      
      // If we get here, we have a successful network request
      networkFailure = false;
      
      const text = await response.text();
      
      // Check if we got HTML (404 page) instead of text
      if (text.includes('<html') || text.includes('<!DOCTYPE html')) {
        console.log(`    ❌ Got HTML instead of text`);
        lastNetworkError = `Got HTML instead of text at ${url}`;
        continue;
      }
      
      console.log(`    ✅ Got text content (${text.length} characters)`);
      
      // Extract title and author from the text
      const result = extractTitleAndAuthor(text, book);
      
      if (result.actualTitle && result.actualAuthor) {
        console.log(`    📖 Extracted title: "${result.actualTitle}"`);
        console.log(`    👤 Extracted author: "${result.actualAuthor}"`);
        
        // Check if they match
        const titleMatches = checkTitleMatch(book.title, result.actualTitle);
        const authorMatches = checkAuthorMatch(book.author, result.actualAuthor);
        
        console.log(`    Title match: ${titleMatches ? '✅' : '❌'}`);
        console.log(`    Author match: ${authorMatches ? '✅' : '❌'}`);
        
        // Check if book has a dedicated Wikipedia page
        console.log(`    🔍 Checking Wikipedia page...`);
        const hasWikipediaPage = await checkWikipediaPage(book);
        
        const basicValidation = titleMatches && authorMatches;
        // If it has a Wikipedia page, it's valid regardless of title/author matching
        const finalValidation = hasWikipediaPage || basicValidation;
        
        console.log(`    Wikipedia page: ${hasWikipediaPage ? '✅' : '❌'}`);
        console.log(`    Final validation: ${finalValidation ? '✅' : '❌'}`);
        
        let reason;
        if (hasWikipediaPage) {
          reason = basicValidation ? 'Valid' : 'Valid (has Wikipedia page despite title/author mismatch)';
        } else {
          reason = basicValidation ? 'Valid' : 'Title/author mismatch';
        }
        
        return {
          isValid: finalValidation,
          reason: reason,
          actualTitle: result.actualTitle,
          actualAuthor: result.actualAuthor,
          workingUrl: url,
          titleMatch: titleMatches,
          authorMatch: authorMatches,
          hasWikipediaPage: hasWikipediaPage
        };
      } else {
        console.log(`    ❌ Could not extract title/author from text`);
        extractionFailure = true;
        lastExtractionError = 'Could not extract title/author from text';
        continue;
      }
      
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      lastNetworkError = `${error.message} at ${url}`;
    }
  }
  
  // Determine the specific failure reason
  let reason;
  if (networkFailure) {
    reason = `Network failure: ${lastNetworkError}`;
  } else if (extractionFailure) {
    reason = `Extraction failure: ${lastExtractionError}`;
  } else {
    reason = 'Unknown failure';
  }
  
  return { 
    isValid: false, 
    reason: reason,
    actualTitle: '',
    actualAuthor: '',
    workingUrl: lastNetworkError.includes(' at ') ? lastNetworkError.split(' at ')[1] : ''
  };
}

function extractTitleAndAuthor(text, book) {
  let actualTitle = '';
  let actualAuthor = '';
  
  // First, try to find the expected title in the text
  const expectedTitle = book.title;
  const expectedAuthor = book.author;
  
  // Normalize function for comparison
  const normalize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
      .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
      .trim();
  };
  
  const normExpectedTitle = normalize(expectedTitle);
  const normExpectedAuthor = normalize(expectedAuthor);
  
  // Look in the first 100 lines for the expected title and author
  const lines = text.split('\n').slice(0, 100);
  
  // Search for the expected title
  for (const line of lines) {
    const trimmedLine = line.trim();
    const normLine = normalize(trimmedLine);
    
    // Check if this line contains the expected title
    if (normLine.includes(normExpectedTitle) && normExpectedTitle.length > 3) {
      actualTitle = expectedTitle; // Use the expected title as found
      console.log(`    Found expected title: "${actualTitle}"`);
      break;
    }
  }
  
  // Search for the expected author - prioritize this like we do for titles
  for (const line of lines) {
    const trimmedLine = line.trim();
    const normLine = normalize(trimmedLine);
    
    // Check if this line contains the expected author
    if (normLine.includes(normExpectedAuthor) && normExpectedAuthor.length > 3) {
      // Additional validation: make sure it's not part of a longer phrase
      // and that it's not in a context like "by the Kings Maiesties servants, with William Shakespeare"
      if (normLine === normExpectedAuthor || 
          normLine.startsWith(normExpectedAuthor + ' ') ||
          normLine.endsWith(' ' + normExpectedAuthor) ||
          normLine.includes(' by ' + normExpectedAuthor) ||
          normLine.includes('by ' + normExpectedAuthor + ' ')) {
        actualAuthor = expectedAuthor; // Use the expected author as found
        console.log(`    Found expected author: "${actualAuthor}"`);
        break;
      }
    }
  }
  
  // If we didn't find the exact expected author, try to find a partial match
  // This handles cases like finding "Edward Gibbon" when expected is "Gibbon"
  if (!actualAuthor && normExpectedAuthor.length > 3) {
    for (const line of lines) {
      const trimmedLine = line.trim();
      const normLine = normalize(trimmedLine);
      
      // Look for lines that contain the expected author as a word
      const words = normLine.split(' ');
      const matchingWord = words.find(word => word.includes(normExpectedAuthor));
      
      if (matchingWord) {
        // Extract the full name from the original line
        const originalWords = trimmedLine.split(' ');
        const matchingIndex = words.findIndex(word => word.includes(normExpectedAuthor));
        
        if (matchingIndex >= 0 && matchingIndex < originalWords.length) {
          // Try to get the full name (first name + last name)
          let fullName = originalWords[matchingIndex];
          
          // If we found a last name, try to get the first name too
          if (matchingIndex > 0) {
            const firstName = originalWords[matchingIndex - 1];
            // Check if the first name looks like a proper name (starts with capital, reasonable length)
            if (firstName.match(/^[A-Z][a-z]+$/) && firstName.length > 1) {
              fullName = `${firstName} ${originalWords[matchingIndex]}`;
            }
          }
          
          // Only use this if it contains our expected author
          if (normalize(fullName).includes(normExpectedAuthor)) {
            actualAuthor = fullName;
            console.log(`    Found partial author match: "${actualAuthor}"`);
            break;
          }
        }
      }
    }
  }
  
  // If we found both, return them
  if (actualTitle && actualAuthor) {
    return { actualTitle, actualAuthor };
  }
  
  // Fallback: try to find title and author using patterns
  // Look for "Title:" pattern
  if (!actualTitle) {
    for (const line of lines) {
      const titleMatch = line.match(/Title:\s*(.+)/i);
      if (titleMatch && titleMatch[1].trim().length > 3) {
        actualTitle = titleMatch[1].trim();
        console.log(`    Found title pattern: "${actualTitle}"`);
        break;
      }
    }
  }
  
  // Look for "Author:" pattern
  if (!actualAuthor) {
    for (const line of lines) {
      const authorMatch = line.match(/Author:\s*(.+)/i);
      if (authorMatch && authorMatch[1].trim().length > 3) {
        actualAuthor = authorMatch[1].trim();
        console.log(`    Found author pattern: "${actualAuthor}"`);
        break;
      }
    }
  }
  
  // Look for "BY" pattern first (header format) - prioritize this and check ONLY header area
  if (!actualAuthor) {
    for (let i = 0; i < Math.min(lines.length, 20); i++) { // Only check first 20 lines (header area)
      const line = lines[i];
      
      // Look for "BY" on its own line, followed by author on next non-empty line
      if (line.trim().toUpperCase() === 'BY') {
        // Look for the next non-empty line after "BY"
        for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) { // Check up to 5 lines ahead
          const nextLine = lines[j].trim();
          if (nextLine.length === 0) continue; // Skip empty lines
          
          // If next non-empty line looks like an author name (all caps, short, minimal punctuation)
          if (nextLine.length > 0 && nextLine.length < 50 && 
              nextLine.match(/^[A-Z\s\.]+$/) && 
              !nextLine.includes(',') &&
              !nextLine.includes(';') &&
              !nextLine.includes(':') &&
              !nextLine.includes('!') &&
              !nextLine.includes('?') &&
              !nextLine.includes('(') &&
              !nextLine.includes(')') &&
              !nextLine.includes('[') &&
              !nextLine.includes(']') &&
              !nextLine.includes('{') &&
              !nextLine.includes('}') &&
              !nextLine.includes('"') &&
              !nextLine.includes("'") &&
              !nextLine.includes('`') &&
              !nextLine.includes('~') &&
              !nextLine.includes('@') &&
              !nextLine.includes('#') &&
              !nextLine.includes('$') &&
              !nextLine.includes('%') &&
              !nextLine.includes('^') &&
              !nextLine.includes('&') &&
              !nextLine.includes('*') &&
              !nextLine.includes('+') &&
              !nextLine.includes('=') &&
              !nextLine.includes('|') &&
              !nextLine.includes('\\') &&
              !nextLine.includes('/') &&
              !nextLine.includes('<') &&
              !nextLine.includes('>') &&
              !nextLine.includes('_') &&
              !nextLine.includes('-') &&
              !nextLine.includes('0') &&
              !nextLine.includes('1') &&
              !nextLine.includes('2') &&
              !nextLine.includes('3') &&
              !nextLine.includes('4') &&
              !nextLine.includes('5') &&
              !nextLine.includes('6') &&
              !nextLine.includes('7') &&
              !nextLine.includes('8') &&
              !nextLine.includes('9')) {
            actualAuthor = nextLine;
            console.log(`    Found BY pattern: "${actualAuthor}"`);
            break;
          }
          break; // Only check the first non-empty line after BY
        }
        if (actualAuthor) break; // Exit outer loop if we found an author
      }
      
      // Also look for "BY Author" pattern
      const byMatch = line.match(/^BY\s+(.+)$/i);
      if (byMatch && byMatch[1].trim().length > 3) {
        let authorName = byMatch[1].trim();
        
        // Check if the author name continues on the next line(s)
        // Look for patterns like "L. S. WOOLF" that might be split across lines
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          // If next line looks like it continues the author name (all caps, short, no punctuation)
          if (nextLine.length > 0 && nextLine.length < 50 && 
              nextLine.match(/^[A-Z\s\.]+$/) && 
              !nextLine.includes(',') &&
              !nextLine.includes(';') &&
              !nextLine.includes(':') &&
              !nextLine.includes('!') &&
              !nextLine.includes('?') &&
              !nextLine.includes('(') &&
              !nextLine.includes(')') &&
              !nextLine.includes('[') &&
              !nextLine.includes(']') &&
              !nextLine.includes('{') &&
              !nextLine.includes('}') &&
              !nextLine.includes('"') &&
              !nextLine.includes("'") &&
              !nextLine.includes('`') &&
              !nextLine.includes('~') &&
              !nextLine.includes('@') &&
              !nextLine.includes('#') &&
              !nextLine.includes('$') &&
              !nextLine.includes('%') &&
              !nextLine.includes('^') &&
              !nextLine.includes('&') &&
              !nextLine.includes('*') &&
              !nextLine.includes('+') &&
              !nextLine.includes('=') &&
              !nextLine.includes('|') &&
              !nextLine.includes('\\') &&
              !nextLine.includes('/') &&
              !nextLine.includes('<') &&
              !nextLine.includes('>') &&
              !nextLine.includes('_') &&
              !nextLine.includes('-') &&
              !nextLine.includes('0') &&
              !nextLine.includes('1') &&
              !nextLine.includes('2') &&
              !nextLine.includes('3') &&
              !nextLine.includes('4') &&
              !nextLine.includes('5') &&
              !nextLine.includes('6') &&
              !nextLine.includes('7') &&
              !nextLine.includes('8') &&
              !nextLine.includes('9')) {
            authorName = authorName + ' ' + nextLine;
            console.log(`    Found multi-line author: "${authorName}"`);
          }
        }
        
        actualAuthor = authorName;
        console.log(`    Found BY pattern: "${actualAuthor}"`);
        break;
      }
    }
  }
  
  // Look for "by Author" pattern - be more specific (fallback) - but ONLY if header didn't work
  if (!actualAuthor) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const byMatch = line.match(/by\s+(.+)/i);
      if (byMatch && byMatch[1].trim().length > 3 && 
          !byMatch[1].includes('Project Gutenberg') && 
          !byMatch[1].includes('ebook') && 
          !byMatch[1].includes('Ebook') &&
          !byMatch[1].includes('United States') &&
          !byMatch[1].includes('anyone anywhere') &&
          !byMatch[1].includes('Kings Maiesties') &&
          !byMatch[1].includes('servants') &&
          !byMatch[1].includes('with') &&
          !byMatch[1].includes(',') &&
          !byMatch[1].includes('memorable Worthies') &&
          !byMatch[1].includes('their time') &&
          !byMatch[1].includes(';') &&
          !byMatch[1].includes('Mr.') &&
          !byMatch[1].includes('Gent.') &&
          !byMatch[1].includes('Printed at') &&
          !byMatch[1].includes('London by') &&
          !byMatch[1].includes('sold at') &&
          !byMatch[1].includes('signe of') &&
          !byMatch[1].includes('Crowne in') &&
          !byMatch[1].includes('Pauls Church') &&
          !byMatch[1].includes('1634') &&
          !byMatch[1].includes('produced by') &&
          !byMatch[1].includes('Produced by') &&
          !byMatch[1].includes('This eBook was produced by') &&
          !byMatch[1].includes('eBook was produced by') &&
          !byMatch[1].includes('was produced by')) {
        
        let authorName = byMatch[1].trim();
        
        // Check if the author name continues on the next line(s)
        // Look for patterns like "L. S. WOOLF" that might be split across lines
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          // If next line looks like it continues the author name (all caps, short, no punctuation)
          if (nextLine.length > 0 && nextLine.length < 50 && 
              nextLine.match(/^[A-Z\s\.]+$/) && 
              !nextLine.includes(',') &&
              !nextLine.includes(';') &&
              !nextLine.includes(':') &&
              !nextLine.includes('!') &&
              !nextLine.includes('?') &&
              !nextLine.includes('(') &&
              !nextLine.includes(')') &&
              !nextLine.includes('[') &&
              !nextLine.includes(']') &&
              !nextLine.includes('{') &&
              !nextLine.includes('}') &&
              !nextLine.includes('"') &&
              !nextLine.includes("'") &&
              !nextLine.includes('`') &&
              !nextLine.includes('~') &&
              !nextLine.includes('@') &&
              !nextLine.includes('#') &&
              !nextLine.includes('$') &&
              !nextLine.includes('%') &&
              !nextLine.includes('^') &&
              !nextLine.includes('&') &&
              !nextLine.includes('*') &&
              !nextLine.includes('+') &&
              !nextLine.includes('=') &&
              !nextLine.includes('|') &&
              !nextLine.includes('\\') &&
              !nextLine.includes('/') &&
              !nextLine.includes('<') &&
              !nextLine.includes('>') &&
              !nextLine.includes('_') &&
              !nextLine.includes('-') &&
              !nextLine.includes('0') &&
              !nextLine.includes('1') &&
              !nextLine.includes('2') &&
              !nextLine.includes('3') &&
              !nextLine.includes('4') &&
              !nextLine.includes('5') &&
              !nextLine.includes('6') &&
              !nextLine.includes('7') &&
              !nextLine.includes('8') &&
              !nextLine.includes('9')) {
            authorName = authorName + ' ' + nextLine;
            console.log(`    Found multi-line author: "${authorName}"`);
          }
        }
        
        actualAuthor = authorName;
        console.log(`    Found by pattern: "${actualAuthor}"`);
        break;
      }
    }
  }
  
  // Special handling for Shakespeare works with multiple authors
  if (!actualAuthor && expectedAuthor && expectedAuthor.includes('Shakespeare')) {
    for (const line of lines) {
      // Look for "Mr. William Shakspeare" or "Mr. William Shakespeare" pattern
      const shakespeareMatch = line.match(/Mr\.\s+William\s+Shaks?peare/i);
      if (shakespeareMatch) {
        actualAuthor = 'William Shakespeare';
        console.log(`    Found Shakespeare pattern: "${actualAuthor}"`);
        break;
      }
      
      // Look for lines with both Fletcher and Shakespeare
      if (line.includes('Fletcher') && line.includes('Shakspeare')) {
        actualAuthor = 'William Shakespeare';
        console.log(`    Found Fletcher/Shakespeare pattern: "${actualAuthor}"`);
        break;
      }
    }
  }
  
  return { actualTitle, actualAuthor };
}

function checkTitleMatch(expected, actual) {
  if (!expected || !actual) return false;
  
  // Normalize both titles - remove punctuation, normalize spaces, convert to lowercase
  const normalize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
      .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
      .trim();
  };
  
  const normExpected = normalize(expected);
  const normActual = normalize(actual);
  
  console.log(`    Title comparison:`);
  console.log(`      Expected: "${expected}" -> "${normExpected}"`);
  console.log(`      Actual:   "${actual}" -> "${normActual}"`);
  
  // Check for exact match or contains match
  let matches = normExpected === normActual ||
                normActual.includes(normExpected) ||
                normExpected.includes(normActual);
  
  // If no match yet, try more flexible matching
  if (!matches) {
    // Remove common prefixes like "A", "The", "An"
    const removePrefixes = (text) => {
      return text.replace(/^(a|an|the)\s+/i, '').trim();
    };
    
    const normExpectedNoPrefix = removePrefixes(normExpected);
    const normActualNoPrefix = removePrefixes(normActual);
    
    // Check if they match without prefixes
    matches = normExpectedNoPrefix === normActualNoPrefix ||
              normActualNoPrefix.includes(normExpectedNoPrefix) ||
              normExpectedNoPrefix.includes(normActualNoPrefix);
    
    // If still no match, try word-by-word similarity
    if (!matches) {
      const expectedWords = normExpectedNoPrefix.split(' ').filter(word => word.length > 2);
      const actualWords = normActualNoPrefix.split(' ').filter(word => word.length > 2);
      
      // Check if most words match (allowing for some variation)
      const matchingWords = expectedWords.filter(expectedWord => 
        actualWords.some(actualWord => 
          actualWord === expectedWord || 
          actualWord.includes(expectedWord) || 
          expectedWord.includes(actualWord) ||
          // Handle similar words (like "theological" vs "theologico")
          (expectedWord.length > 6 && actualWord.length > 6 && 
           expectedWord.substring(0, 8) === actualWord.substring(0, 8))
        )
      );
      
      // Match if at least 80% of words match
      const matchRatio = matchingWords.length / expectedWords.length;
      matches = matchRatio >= 0.8;
    }
  }
  
  // If no match yet, check if all words from expected are in actual
  if (!matches) {
    const expectedWords = normExpected.split(' ').filter(word => word.length > 2); // Only consider words longer than 2 chars
    const actualWords = normActual.split(' ').filter(word => word.length > 0);
    
    // Filter out common volume/edition indicators that might not be in actual title
    const volumeIndicators = ['volume', 'vol', 'edition', 'ed', 'part', 'book', 'chapter'];
    const coreExpectedWords = expectedWords.filter(word => !volumeIndicators.includes(word));
    
    // Check if all core words from expected are found in actual words
    const allCoreWordsFound = coreExpectedWords.every(expectedWord => 
      actualWords.some(actualWord => actualWord === expectedWord || actualWord.includes(expectedWord))
    );
    
    // Also check that we have a reasonable number of words matched
    const matchedWords = coreExpectedWords.filter(expectedWord => 
      actualWords.some(actualWord => actualWord === expectedWord || actualWord.includes(expectedWord))
    );
    
    // Match if all significant core words are found, regardless of volume indicators
    // This handles cases where the actual title is missing volume/edition info
    if (allCoreWordsFound && matchedWords.length >= 3) {
      matches = true;
      console.log(`      All core words match: ${coreExpectedWords.join(', ')} found in actual title`);
    }
  }
  
  console.log(`      Match: ${matches ? '✅' : '❌'}`);
  
  return matches;
}

function checkAuthorMatch(expected, actual) {
  if (!expected || !actual) return false;
  
  // Normalize both authors - remove punctuation, normalize spaces, convert to lowercase
  const normalize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
      .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
      .trim();
  };
  
  const normExpected = normalize(expected);
  const normActual = normalize(actual);
  
  console.log(`    Author comparison:`);
  console.log(`      Expected: "${expected}" -> "${normExpected}"`);
  console.log(`      Actual:   "${actual}" -> "${normActual}"`);
  
  // Check for exact match or contains match
  let matches = normExpected === normActual || 
                normActual.includes(normExpected) || 
                normExpected.includes(normActual);
  
  // If no match yet, try flexible name matching for common variations
  if (!matches) {
    // Handle common name variations like "J.M. Barrie" vs "James M. Barrie"
    const normalizeForComparison = (name) => {
      return name
        .replace(/\b([A-Z])\.\s*/g, '$1 ') // Convert "J.M." to "J M"
        .replace(/\b([A-Z])\s+([A-Z])\s+/g, '$1 $2 ') // Ensure single spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim();
    };
    
    const flexExpected = normalizeForComparison(normExpected);
    const flexActual = normalizeForComparison(normActual);
    
    // Check if they match after flexible normalization
    matches = flexExpected === flexActual;
    
    // If still no match, try word-by-word comparison
    if (!matches) {
      const expectedWords = flexExpected.split(' ').filter(w => w.length > 0);
      const actualWords = flexActual.split(' ').filter(w => w.length > 0);
      
      // Check if all expected words are found in actual words (allowing for order differences)
      const allWordsFound = expectedWords.every(expectedWord => 
        actualWords.some(actualWord => 
          actualWord === expectedWord || 
          actualWord.startsWith(expectedWord) || 
          expectedWord.startsWith(actualWord)
        )
      );
      
      // Also check reverse - all actual words found in expected
      const allActualWordsFound = actualWords.every(actualWord => 
        expectedWords.some(expectedWord => 
          actualWord === expectedWord || 
          actualWord.startsWith(expectedWord) || 
          expectedWord.startsWith(actualWord)
        )
      );
      
      matches = allWordsFound && allActualWordsFound;
    }
  }
  
  console.log(`      Match: ${matches ? '✅' : '❌'}`);
  
  return matches;
}

async function validateLibraryFile(filename, validBooksSet, invalidBooksSet) {
  console.log(`\n📚 Validating ${filename}...`);
  
  const filePath = path.join(process.cwd(), 'src', 'data', 'library', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return { valid: 0, invalid: 0, total: 0, results: [], invalidBooks: [] };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const books = JSON.parse(content);
  
  console.log(`📖 Found ${books.length} books`);
  
  // Filter out already processed books
  const unprocessedBooks = books.filter(book => {
    const key = getBookKey(book);
    return !validBooksSet.has(key) && !invalidBooksSet.has(key);
  });
  
  console.log(`📋 Already processed: ${books.length - unprocessedBooks.length} books`);
  console.log(`🔄 To process: ${unprocessedBooks.length} books`);
  
  const results = [];
  const invalidBooks = [];
  const booksToCheck = unprocessedBooks.slice(0, BOOKS_PER_RUN);
  
  console.log(`🎯 Processing ${booksToCheck.length} books (limit: ${BOOKS_PER_RUN})`);
  
  for (let i = 0; i < booksToCheck.length; i++) {
    const book = booksToCheck[i];
    console.log(`\n[${i + 1}/${booksToCheck.length}] Processing: ${book.title} by ${book.author}`);
    
    const result = await validateBook(book);
    
    const bookResult = {
      id: book.id,
      title: book.title,
      author: book.author,
      isValid: result.isValid,
      reason: result.reason,
      actualTitle: result.actualTitle,
      actualAuthor: result.actualAuthor,
      workingUrl: result.workingUrl,
      titleMatch: result.titleMatch,
      authorMatch: result.authorMatch
    };
    
    results.push(bookResult);
    
    // Add to invalid books if not valid
    if (!result.isValid) {
      const invalidBook = {
        file: filename,
        ...bookResult
      };
      invalidBooks.push(invalidBook);
    }
    
    console.log(`\n📊 Result: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`Reason: ${result.reason}`);
    
    if (!result.isValid) {
      console.log(`\n⚠️  PROBLEM FOUND:`);
      console.log(`Expected: "${book.title}" by "${book.author}"`);
      console.log(`Found: "${result.actualTitle}" by "${result.actualAuthor}"`);
      
      if (STOP_ON_FIRST_ERROR) {
        console.log(`\n🛑 STOPPING at first error as requested.`);
        console.log(`Check the validation-results.json file to review this entry.`);
        break;
      }
    }
    
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return { 
    valid: results.filter(r => r.isValid).length, 
    invalid: results.filter(r => !r.isValid).length, 
    total: results.length,
    results,
    invalidBooks
  };
}

async function main() {
  console.log('🔍 Careful Library Validation (Persistent Mode)');
  console.log('This will process 1000 books per run and maintain persistent valid/invalid files');
  console.log('Valid books will be written to valid-books.json');
  console.log('Invalid books will be written to invalid-books.json');
  console.log(`Stop on first error: ${STOP_ON_FIRST_ERROR ? 'YES' : 'NO'}`);
  console.log(`Books per run: ${BOOKS_PER_RUN}\n`);
  
  // Load existing valid and invalid books
  const existingValidBooks = loadValidBooks();
  const existingInvalidBooks = loadInvalidBooks();
  
  console.log(`📚 Previously processed:`);
  console.log(`  ✅ Valid books: ${existingValidBooks.length}`);
  console.log(`  ❌ Invalid books: ${existingInvalidBooks.length}`);
  
  // Create sets for fast lookup
  const validBooksSet = new Set(existingValidBooks.map(book => getBookKey(book)));
  const invalidBooksSet = new Set(existingInvalidBooks.map(book => getBookKey(book)));
  
  // First, re-check invalid books (except network failures)
  console.log('\n🔄 Re-checking invalid books with improved extraction...');
  const networkFailureBooks = existingInvalidBooks.filter(book => 
    book.reason && book.reason.startsWith('Network failure:')
  );
  const extractionFailureBooks = existingInvalidBooks.filter(book => 
    !book.reason || !book.reason.startsWith('Network failure:')
  );
  
  console.log(`  📡 Skipping ${networkFailureBooks.length} books with network failures`);
  console.log(`  🔍 Re-checking ${extractionFailureBooks.length} books with extraction failures`);
  
  let revalidatedCount = 0;
  const stillInvalidBooks = [];
  
  for (const invalidBook of extractionFailureBooks) {
    console.log(`\n🔄 Re-checking: "${invalidBook.title}" by ${invalidBook.author}`);
    
    const result = await validateBook(invalidBook);
    
    if (result.isValid) {
      console.log(`  ✅ Now valid! Moving to valid books.`);
      existingValidBooks.push({
        id: invalidBook.id,
        title: invalidBook.title,
        author: invalidBook.author,
        isValid: true,
        reason: 'Re-validated with improved extraction',
        actualTitle: result.actualTitle,
        actualAuthor: result.actualAuthor,
        workingUrl: result.workingUrl,
        titleMatch: result.titleMatch,
        authorMatch: result.authorMatch,
        hasWikipediaPage: result.hasWikipediaPage
      });
      validBooksSet.add(getBookKey(invalidBook));
      revalidatedCount++;
    } else {
      console.log(`  ❌ Still invalid: ${result.reason}`);
      stillInvalidBooks.push({
        ...invalidBook,
        reason: result.reason,
        actualTitle: result.actualTitle,
        actualAuthor: result.actualAuthor,
        workingUrl: result.workingUrl,
        titleMatch: result.titleMatch,
        authorMatch: result.authorMatch,
        hasWikipediaPage: result.hasWikipediaPage
      });
    }
    
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Update invalid books list (network failures + still invalid)
  const updatedInvalidBooks = [...networkFailureBooks, ...stillInvalidBooks];
  
  console.log(`\n📊 Re-validation results:`);
  console.log(`  ✅ Re-validated: ${revalidatedCount} books`);
  console.log(`  ❌ Still invalid: ${stillInvalidBooks.length} books`);
  console.log(`  📡 Network failures: ${networkFailureBooks.length} books (unchanged)`);
  
  // Save updated lists
  saveValidBooks(existingValidBooks);
  saveInvalidBooks(updatedInvalidBooks);
  
  console.log(`\n💾 Updated files saved`);
  console.log(`  ✅ Valid books: ${existingValidBooks.length} total`);
  console.log(`  ❌ Invalid books: ${updatedInvalidBooks.length} total`);
  
  // Now process new books
  console.log('\n🆕 Processing new books...');
  
  const allResults = {
    timestamp: new Date().toISOString(),
    config: {
      stopOnFirstError: STOP_ON_FIRST_ERROR,
      booksPerRun: BOOKS_PER_RUN
    },
    files: {}
  };
  
  let totalValid = 0;
  let totalInvalid = 0;
  let totalBooks = 0;
  let processedAnyBooks = false;
  
  for (const filename of LIBRARY_FILES) {
    const result = await validateLibraryFile(filename, validBooksSet, new Set(updatedInvalidBooks.map(book => getBookKey(book))));
    
    if (result.total > 0) {
      processedAnyBooks = true;
      totalValid += result.valid;
      totalInvalid += result.invalid;
      totalBooks += result.total;
      
      // Add new valid books to existing list
      const newValidBooks = result.results.filter(r => r.isValid);
      existingValidBooks.push(...newValidBooks);
      
      // Add new invalid books to existing list
      updatedInvalidBooks.push(...result.invalidBooks);
      
      // Update sets
      newValidBooks.forEach(book => validBooksSet.add(getBookKey(book)));
      result.invalidBooks.forEach(book => invalidBooksSet.add(getBookKey(book)));
      
      allResults.files[filename] = {
        valid: result.valid,
        invalid: result.invalid,
        total: result.total,
        books: result.results
      };
      
      // Save persistent files after each file
      saveValidBooks(existingValidBooks);
      saveInvalidBooks(updatedInvalidBooks);
      
      console.log(`\n💾 Valid books saved to ${VALID_BOOKS_FILE} (${existingValidBooks.length} total)`);
      console.log(`💾 Invalid books saved to ${INVALID_BOOKS_FILE} (${updatedInvalidBooks.length} total)`);
      
      if (STOP_ON_FIRST_ERROR && result.invalid > 0) {
        console.log(`\n🛑 Stopping due to errors found in ${filename}`);
        break;
      }
    } else {
      console.log(`\n⏭️  No unprocessed books found in ${filename}`);
    }
  }
  
  if (!processedAnyBooks) {
    console.log('\n🎉 All books have been processed!');
    console.log(`📚 Total valid books: ${existingValidBooks.length}`);
    console.log(`❌ Total invalid books: ${updatedInvalidBooks.length}`);
  } else {
    console.log('\n📊 THIS RUN RESULTS:');
    console.log(`  📚 Books processed this run: ${totalBooks}`);
    console.log(`  ✅ Valid books this run: ${totalValid}`);
    console.log(`  ❌ Invalid books this run: ${totalInvalid}`);
    console.log(`  📈 Success rate this run: ${totalBooks > 0 ? Math.round((totalValid / totalBooks) * 100) : 0}%`);
    
    console.log('\n📊 OVERALL TOTALS:');
    console.log(`  📚 Total valid books: ${existingValidBooks.length}`);
    console.log(`  ❌ Total invalid books: ${updatedInvalidBooks.length}`);
  }
  
  // Write current run results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allResults, null, 2));
  console.log(`\n📄 Current run results written to: ${OUTPUT_FILE}`);
  console.log(`📄 All valid books in: ${VALID_BOOKS_FILE}`);
  console.log(`📄 All invalid books in: ${INVALID_BOOKS_FILE}`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏸️  Validation stopped. Results saved to validation-results.json, valid-books.json, and invalid-books.json');
  process.exit(0);
});

main().catch(console.error);
