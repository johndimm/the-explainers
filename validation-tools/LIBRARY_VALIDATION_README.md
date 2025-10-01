# Library Validation and Cleanup Scripts

This directory contains scripts to validate and fix issues in the library data files.

## Scripts Overview

### 1. `comprehensive-library-cleanup.js` - Main Validation Script
**Purpose**: Validates all library files by checking if books actually match their titles and authors on Project Gutenberg.

**Features**:
- ✅ **Resumable**: Saves progress and can be restarted if interrupted
- ✅ **Progress tracking**: Shows current file and book being processed
- ✅ **Multiple URL formats**: Tries different Project Gutenberg URL patterns
- ✅ **Author corrections**: Automatically identifies problematic authors
- ✅ **Detailed reporting**: Shows examples of invalid books

**Usage**:
```bash
node comprehensive-library-cleanup.js
```

**What it does**:
- Checks each book against Project Gutenberg to verify title/author match
- Identifies books that should be removed (like Sidney Austen)
- Saves progress to `validation-progress.json`
- Can be safely interrupted and restarted

### 2. `fix-library-issues.js` - Specific Fixes Script
**Purpose**: Applies specific fixes to known problematic entries.

**Fixes applied**:
- 🗑️ Removes "The Frightened Planet" by Jane Austen (Sidney Austen is not a classic author)
- ✏️ Changes "Bacon" to "Francis Bacon" for proper attribution
- 📝 Updates 11 specific books with incorrect author attributions

**Usage**:
```bash
node fix-library-issues.js
```

**What it does**:
- Removes Sidney Austen's book from English literature
- Fixes all "Bacon" attributions to "Francis Bacon"
- Updates the JSON files with corrected data

### 3. `test-fixes.js` - Verification Script
**Purpose**: Verifies that the fixes were applied correctly.

**Usage**:
```bash
node test-fixes.js
```

**What it checks**:
- ✅ Sidney Austen book was removed
- ✅ Bacon books were updated to Francis Bacon
- ✅ Specific books have correct author attributions

### 4. `test-validation.js` - Quick Test Script
**Purpose**: Tests the validation logic on a few specific books.

**Usage**:
```bash
node test-validation.js
```

## Recommended Workflow

1. **First, apply specific fixes**:
   ```bash
   node fix-library-issues.js
   ```

2. **Verify the fixes worked**:
   ```bash
   node test-fixes.js
   ```

3. **Run comprehensive validation**:
   ```bash
   node comprehensive-library-cleanup.js
   ```

4. **If interrupted, just run again** - it will resume from where it left off

## Known Issues Fixed

### Sidney Austen Problem
- **Issue**: "The Frightened Planet" was attributed to Jane Austen but written by Sidney Austen
- **Fix**: Removed entirely (Sidney Austen is not a classic author)

### Bacon Attribution Problem
- **Issue**: Many works attributed to just "Bacon" instead of "Francis Bacon"
- **Fix**: Updated all "Bacon" attributions to "Francis Bacon"

### Specific Books Fixed
- A Philanthropist
- An Idyll of All Fools' Day
- In the Border Country
- In The Valley Of The Shadow
- Index of the Project Gutenberg Works of Francis Bacon
- Julia The Apostate
- Lives of the apostles of Jesus Christ
- Margarita's Soul: The Romantic Recollections of a Man of Fifty
- Mrs. Dud's Sister
- New Atlantis

## Progress Tracking

The validation script creates a `validation-progress.json` file to track progress:
- Shows which files have been completed
- Tracks current file and position
- Saves results as it goes
- Automatically cleans up when complete

## Error Handling

- **Network issues**: Script continues with next book if one fails
- **Invalid JSON**: Reports error and continues
- **Missing files**: Reports and skips
- **Interruption**: Saves progress and can resume

## Output Examples

### Validation Results
```
📊 Results for english-literature.json:
  ✅ Valid: 1250
  ❌ Invalid: 45
  🗑️  Should remove: 12
  📈 Success rate: 96%
```

### Fix Results
```
📊 Results for english-literature.json:
  ✏️  Fixed: 10
  🗑️  Removed: 1
  ❌ Errors: 0
  📚 Final count: 1259 books
```

## Notes

- The validation script makes HTTP requests to Project Gutenberg, so it may take time
- Progress is saved after each book, so interruptions are safe
- The script includes delays to avoid overwhelming Project Gutenberg servers
- All changes are made to the original JSON files
