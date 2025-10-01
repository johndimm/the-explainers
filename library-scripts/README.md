# Library Scripts

This directory contains scripts and result files used during the library cleanup and organization process.

## Script Categories

### Analysis Scripts
- `analyze-*-literature.js` - Scripts to analyze Wikipedia link coverage
- `add-wikipedia-links-gutenberg-top.js` - Add missing Wikipedia links

### Update/Restore Scripts  
- `restore-all-*.js` - Restore complete collections for major authors
- `update-*-file.js` - Update specific library files

### Cleanup Scripts
- `cleanup-library-files.js` - Remove unneeded files from library directory
- `remove-poetry-category.js` - Remove the poetry category
- `filter-*-only-*.js` - Filter collections by various criteria

### Library Management
- `check-*-downloads.js` - Verify book downloads work
- `limit-*-authors.js` - Limit books per author
- `sort-*.js` - Sort collections
- `update-*-library.js` - Update library files with working books only

## Result Files
- `*-results.json` - Analysis results
- `removed-*.json` - Books that were removed during cleanup
- `valid-books.json` / `invalid-books.json` - Validation results

## Usage
These scripts were used to:
1. Clean up library collections by removing books without Wikipedia links
2. Restore complete collections for major authors (Shakespeare, Plato)
3. Filter out non-English authors from English Literature
4. Remove problematic categories (poetry)
5. Organize and validate the final library structure

The scripts are kept for reference and potential future use.
