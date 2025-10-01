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

// Function to extract title and author from Gutenberg text
function extractTitleAndAuthor(text, expectedTitle, expectedAuthor) {
  const lines = text.split('\n');
  let actualTitle = '';
  let actualAuthor = '';
  
  console.log(`    📖 Extracted title: "${actualTitle}"`);
  console.log(`    👤 Extracted author: "${actualAuthor}"`);
  
  // Look for expected title first
  for (const line of lines.slice(0, 50)) { // Check first 50 lines
    const normLine = line.toLowerCase().trim();
    const normExpectedTitle = expectedTitle.toLowerCase().trim();
    
    if (normLine.includes(normExpectedTitle) && normLine.length < 200) {
      actualTitle = expectedTitle;
      console.log(`    Found expected title: "${expectedTitle}"`);
      break;
    }
  }
  
  // Look for expected author first
  for (const line of lines.slice(0, 50)) { // Check first 50 lines
    const normLine = line.toLowerCase().trim();
    const normExpectedAuthor = expectedAuthor.toLowerCase().trim();
    
    if (normLine.includes(normExpectedAuthor) && normLine.length < 100) {
      actualAuthor = expectedAuthor;
      console.log(`    Found expected author: "${expectedAuthor}"`);
      break;
    }
  }
  
  // If we found both, we're done
  if (actualTitle && actualAuthor) {
    return { actualTitle, actualAuthor };
  }
  
  // Look for title patterns
  if (!actualTitle) {
    for (const line of lines.slice(0, 30)) {
      const titleMatch = line.match(/^([A-Z][^.!?]*[.!?]?)$/);
      if (titleMatch && titleMatch[1].length > 5 && titleMatch[1].length < 100) {
        actualTitle = titleMatch[1].trim();
        console.log(`    Found title pattern: "${actualTitle}"`);
        break;
      }
    }
  }
  
  // Look for author patterns
  if (!actualAuthor) {
    for (const line of lines.slice(0, 50)) {
      // Look for "by Author" pattern
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
          !byMatch[1].includes('produced by') &&
          !byMatch[1].includes('memorable Worthies') &&
          !byMatch[1].includes('their time') &&
          !byMatch[1].includes(';') &&
          !byMatch[1].includes('Mr.') &&
          !byMatch[1].includes('Gent.') &&
          !byMatch[1].includes('Printed at') &&
          !byMatch[1].includes('London by')) {
        actualAuthor = byMatch[1].trim();
        console.log(`    Found by pattern: "${actualAuthor}"`);
        break;
      }
    }
  }
  
  // Look for "BY" on its own line, followed by author on next non-empty line
  if (!actualAuthor) {
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
      const line = lines[i].trim();
      
      // Look for "BY" on its own line, followed by author on next non-empty line
      if (line.trim().toUpperCase() === 'BY') {
        for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) { // Check up to 5 lines ahead
          const nextLine = lines[j].trim();
          if (nextLine.length === 0) continue; // Skip empty lines
          
          // If next line looks like an author name (all caps, short, minimal punctuation)
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
    }
  }
  
  // Special handling for Shakespeare
  if (!actualAuthor && expectedAuthor.toLowerCase().includes('shakespeare')) {
    for (const line of lines.slice(0, 50)) {
      if (line.toLowerCase().includes('william shakespeare') || 
          line.toLowerCase().includes('shakespeare')) {
        actualAuthor = 'William Shakespeare';
        console.log(`    Found Shakespeare pattern: "${actualAuthor}"`);
        break;
      }
    }
  }
  
  return { actualTitle, actualAuthor };
}

// Function to check if titles match
function checkTitleMatch(expected, actual) {
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
  
  // If no match yet, try flexible matching
  if (!matches) {
    // Remove common prefixes
    const removePrefixes = (text) => {
      return text.replace(/^(a|an|the)\s+/i, '').trim();
    };
    
    const flexExpected = removePrefixes(normExpected);
    const flexActual = removePrefixes(normActual);
    
    // Check if they match after removing prefixes
    matches = flexExpected === flexActual || 
              flexActual.includes(flexExpected) || 
              flexExpected.includes(flexActual);
    
    // If still no match, try word-by-word comparison
    if (!matches) {
      const expectedWords = flexExpected.split(' ').filter(w => w.length > 0);
      const actualWords = flexActual.split(' ').filter(w => w.length > 0);
      
      // Filter out volume indicators
      const filteredExpected = expectedWords.filter(w => 
        !['volume', 'vol', 'part', 'book', 'chapter', 'section'].includes(w) &&
        !/^\d+$/.test(w)
      );
      
      // Check if most expected words are found in actual words
      const foundWords = filteredExpected.filter(expectedWord => 
        actualWords.some(actualWord => 
          actualWord === expectedWord || 
          actualWord.startsWith(expectedWord) || 
          expectedWord.startsWith(actualWord)
        )
      );
      
      const matchRatio = foundWords.length / Math.max(filteredExpected.length, 1);
      matches = matchRatio >= 0.8; // 80% of words must match
    }
  }
  
  console.log(`      Match: ${matches ? '✅' : '❌'}`);
  
  return matches;
}

// Function to check if authors match
function checkAuthorMatch(expected, actual) {
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

// Function to validate a single book
async function validateBook(book) {
  console.log(`\n🔍 Checking: "${book.title}" by ${book.author} (ID: ${book.id})`);
  
  // Special case for non-Gutenberg books
  if (!book.id || isNaN(book.id)) {
    console.log(`    ℹ️  Special case detected - skipping Project Gutenberg validation`);
    return {
      isValid: true,
      reason: 'Special case (local file or non-PG source)',
      actualTitle: book.title,
      actualAuthor: book.author,
      hasWikipediaPage: false,
      workingUrl: null
    };
  }
  
  const urls = [
    `https://www.gutenberg.org/files/${book.id}/${book.id}-0.txt`,
    `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`
  ];
  
  let lastNetworkError = null;
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`  Trying URL ${i + 1}: ${url}`);
    
    try {
      const response = await fetch(url);
      
      if (response.status === 404) {
        console.log(`    ❌ HTTP 404`);
        lastNetworkError = `Network failure: HTTP 404 at ${url}`;
        continue;
      }
      
      if (!response.ok) {
        console.log(`    ❌ HTTP ${response.status}`);
        lastNetworkError = `Network failure: HTTP ${response.status} at ${url}`;
        continue;
      }
      
      const text = await response.text();
      
      if (text.length < 1000) {
        console.log(`    ❌ Text too short (${text.length} characters)`);
        lastNetworkError = `Network failure: Text too short at ${url}`;
        continue;
      }
      
      // Check if it's HTML instead of text
      if (text.includes('<html') || text.includes('<!DOCTYPE')) {
        console.log(`    ❌ Got HTML instead of text`);
        lastNetworkError = `Network failure: Got HTML instead of text at ${url}`;
        continue;
      }
      
      console.log(`    ✅ Got text content (${text.length} characters)`);
      
      // Extract title and author
      const { actualTitle, actualAuthor } = extractTitleAndAuthor(text, book.title, book.author);
      
      if (!actualTitle || !actualAuthor) {
        console.log(`    ❌ Could not extract title/author from text`);
        continue;
      }
      
      // Check if titles match
      const titleMatch = checkTitleMatch(book.title, actualTitle);
      const authorMatch = checkAuthorMatch(book.author, actualAuthor);
      
      if (!titleMatch || !authorMatch) {
        console.log(`    ❌ Title match: ${titleMatch ? '✅' : '❌'}`);
        console.log(`    ❌ Author match: ${authorMatch ? '✅' : '❌'}`);
        return {
          isValid: false,
          reason: `Extraction failure: Title match: ${titleMatch}, Author match: ${authorMatch}`,
          actualTitle,
          actualAuthor,
          hasWikipediaPage: false,
          workingUrl: url
        };
      }
      
      console.log(`    Title match: ${titleMatch ? '✅' : '❌'}`);
      console.log(`    Author match: ${authorMatch ? '✅' : '❌'}`);
      
      // Check Wikipedia page
      console.log(`    🔍 Checking Wikipedia page...`);
      const hasWikipediaPage = await checkWikipediaPage(book);
      console.log(`    Wikipedia page: ${hasWikipediaPage ? '✅' : '❌'}`);
      
      // Final validation: Wikipedia page OR basic validation
      const finalValidation = hasWikipediaPage || (titleMatch && authorMatch);
      
      return {
        isValid: finalValidation,
        reason: finalValidation ? 'Valid' : 'No Wikipedia page and basic validation failed',
        actualTitle,
        actualAuthor,
        hasWikipediaPage,
        workingUrl: url
      };
      
    } catch (error) {
      console.log(`    ❌ ${error.message}`);
      lastNetworkError = `Network failure: ${error.message} at ${url}`;
      continue;
    }
  }
  
  // If we get here, all URLs failed
  return {
    isValid: false,
    reason: lastNetworkError || 'Network failure: All URLs failed',
    actualTitle: null,
    actualAuthor: null,
    hasWikipediaPage: false,
    workingUrl: null
  };
}

// Main function
async function main() {
  console.log('🔍 Shakespeare-Only Validation');
  console.log('Processing ONLY Shakespeare books from shakespeare.json\n');
  
  // Load Shakespeare books
  const shakespearePath = path.join(__dirname, 'src', 'data', 'library', 'shakespeare.json');
  const shakespeareBooks = JSON.parse(fs.readFileSync(shakespearePath, 'utf8'));
  
  console.log(`📚 Found ${shakespeareBooks.length} Shakespeare books\n`);
  
  const validBooks = [];
  const invalidBooks = [];
  
  for (let i = 0; i < shakespeareBooks.length; i++) {
    const book = shakespeareBooks[i];
    console.log(`[${i + 1}/${shakespeareBooks.length}] Processing: ${book.title} by ${book.author}`);
    
    const result = await validateBook(book);
    
    const bookResult = {
      id: book.id,
      title: book.title,
      author: book.author,
      isValid: result.isValid,
      reason: result.reason,
      actualTitle: result.actualTitle,
      actualAuthor: result.actualAuthor,
      hasWikipediaPage: result.hasWikipediaPage,
      workingUrl: result.workingUrl
    };
    
    if (result.isValid) {
      validBooks.push(bookResult);
      console.log(`\n📊 Result: ✅ VALID`);
    } else {
      invalidBooks.push(bookResult);
      console.log(`\n📊 Result: ❌ INVALID`);
    }
    console.log(`Reason: ${result.reason}\n`);
  }
  
  // Save results
  fs.writeFileSync('shakespeare-valid.json', JSON.stringify(validBooks, null, 2));
  fs.writeFileSync('shakespeare-invalid.json', JSON.stringify(invalidBooks, null, 2));
  
  console.log(`\n📊 FINAL RESULTS:`);
  console.log(`  ✅ Valid books: ${validBooks.length}`);
  console.log(`  ❌ Invalid books: ${invalidBooks.length}`);
  console.log(`  📈 Success rate: ${((validBooks.length / shakespeareBooks.length) * 100).toFixed(1)}%`);
  
  console.log(`\n📄 Valid books saved to: shakespeare-valid.json`);
  console.log(`📄 Invalid books saved to: shakespeare-invalid.json`);
}

main().catch(console.error);
