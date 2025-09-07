# Wikipedia Data System

This system pre-generates Wikipedia page existence data to avoid runtime API calls, making the application faster and more reliable.

## How It Works

1. **Static Data**: Wikipedia page existence is checked once and saved to `src/data/wikipedia-data.json`
2. **Fast Lookups**: Components use the static data instead of making API calls
3. **Fallback**: If data isn't found, it assumes the page exists (graceful degradation)

## Files

- `src/data/wikipedia-data.json` - Pre-generated Wikipedia data
- `src/utils/wikipediaStatic.ts` - Static data lookup functions
- `src/scripts/generate-wikipedia-data.ts` - Script to generate the data
- `src/components/FilteredStyleList.tsx` - Uses static data for explainer styles
- `src/components/FilteredBookList.tsx` - Uses static data for books
- `src/components/WikipediaLink.tsx` - Uses static data for link display

## Generating Wikipedia Data

### Run the Generation Script

```bash
npm run generate-wikipedia
```

This will:
1. Check all explainer styles (people) for Wikipedia pages
2. Check sample books for Wikipedia pages
3. Save results to `src/data/wikipedia-data.json`
4. Show a summary of what was found

### What Gets Checked

**People (Explainer Styles):**
- All 80+ explainer styles from the categories
- Uses optimized search terms (e.g., "Martin Luther King Jr." instead of "Martin Luther King")

**Books:**
- Sample books from the library
- Uses "Title (Author)" format for better Wikipedia matching

### Data Structure

```json
{
  "people": {
    "Harold Bloom": {
      "exists": true,
      "url": "https://en.wikipedia.org/wiki/Harold_Bloom",
      "title": "Harold Bloom"
    },
    "Andy Andrist": {
      "exists": false
    }
  },
  "books": {
    "Hamlet by William Shakespeare": {
      "exists": true,
      "url": "https://en.wikipedia.org/wiki/Hamlet",
      "title": "Hamlet"
    }
  },
  "generatedAt": "2024-01-15T10:00:00.000Z"
}
```

## Benefits

1. **Performance**: No runtime API calls = faster page loads
2. **Reliability**: No network dependency for Wikipedia checks
3. **Consistency**: Same results every time
4. **Respectful**: Doesn't hammer Wikipedia's servers
5. **Offline**: Works even without internet connection

## Updating the Data

The data should be updated when:
- New explainer styles are added
- New books are added to the library
- Wikipedia pages are created/removed (rare)
- You want to refresh the data (recommended monthly)

## Usage in Components

```typescript
import { checkPersonWikipediaPage, checkBookWikipediaPage } from '@/utils/wikipediaStatic'

// Check if a person has a Wikipedia page
const result = checkPersonWikipediaPage('Harold Bloom')
if (result.exists) {
  // Show Wikipedia link
  window.open(result.url, '_blank')
}

// Check if a book has a Wikipedia page
const bookResult = checkBookWikipediaPage('Hamlet', 'William Shakespeare')
if (bookResult.exists) {
  // Show Wikipedia link
  window.open(bookResult.url, '_blank')
}
```

## Fallback Behavior

If a person or book isn't found in the static data:
- The system assumes a Wikipedia page exists
- Generates a Wikipedia URL using the name/title
- Logs a warning to the console
- This ensures the app doesn't break if new items are added

## Performance Impact

- **Before**: 80+ API calls on every page load
- **After**: 0 API calls, instant lookups
- **Bundle Size**: +~50KB for the static data file
- **Load Time**: Significantly faster, especially on slow connections
