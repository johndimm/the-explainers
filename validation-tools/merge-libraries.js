#!/usr/bin/env node

const fs = require('fs');

function loadLibraries() {
    console.log('Loading libraries for merging...');
    
    // Load old English literature library
    const oldLibrary = JSON.parse(fs.readFileSync('../src/data/library/english-literature.json.old', 'utf8'));
    console.log(`Loaded old library with ${oldLibrary.length} books`);
    
    // Load enhanced library
    const enhancedLibrary = JSON.parse(fs.readFileSync('corrected-candidate-library.json', 'utf8'));
    console.log(`Loaded enhanced library with ${enhancedLibrary.books.length} books`);
    
    return { oldLibrary, enhancedLibrary };
}

function mergeLibraries(oldLibrary, enhancedLibrary) {
    console.log('\nMerging libraries...');
    
    const mergedBooks = [];
    const processedTitles = new Set();
    
    // First, add all enhanced library books (these have Wikipedia links)
    enhancedLibrary.books.forEach(book => {
        const key = `${book.title.toLowerCase()}_${book.author.toLowerCase()}`;
        if (!processedTitles.has(key)) {
            mergedBooks.push({
                id: book.gutenbergId,
                title: book.title,
                author: book.author,
                gutenbergId: book.gutenbergId,
                language: book.language,
                wikipediaTitle: book.wikipediaTitle,
                wikipediaUrl: book.wikipediaUrl,
                matchType: book.matchType,
                category: book.category,
                description: book.description
            });
            processedTitles.add(key);
        }
    });
    
    console.log(`Added ${mergedBooks.length} books from enhanced library`);
    
    // Then, add books from old library that aren't already included
    let addedFromOld = 0;
    oldLibrary.forEach(book => {
        const key = `${book.title.toLowerCase()}_${book.author.toLowerCase()}`;
        if (!processedTitles.has(key)) {
            // Convert old library format to new format
            mergedBooks.push({
                id: book.id,
                title: book.title,
                author: book.author,
                gutenbergId: book.id,
                language: 'en',
                wikipediaTitle: book.wikipediaTitle,
                wikipediaUrl: book.wikipediaUrl,
                matchType: 'legacy',
                category: 'Literature',
                description: `${book.title} by ${book.author}. This classic work is available in the public domain.`,
                localPath: book.localPath // Preserve local path if it exists
            });
            processedTitles.add(key);
            addedFromOld++;
        }
    });
    
    console.log(`Added ${addedFromOld} books from old library`);
    console.log(`Total merged books: ${mergedBooks.length}`);
    
    // Sort by title
    mergedBooks.sort((a, b) => a.title.localeCompare(b.title));
    
    return mergedBooks;
}

function main() {
    try {
        const { oldLibrary, enhancedLibrary } = loadLibraries();
        const mergedBooks = mergeLibraries(oldLibrary, enhancedLibrary);
        
        // Check Wikipedia link coverage
        const withWikiLinks = mergedBooks.filter(book => book.wikipediaUrl);
        const withoutWikiLinks = mergedBooks.filter(book => !book.wikipediaUrl);
        
        console.log(`\n=== MERGED LIBRARY STATISTICS ===`);
        console.log(`Total books: ${mergedBooks.length}`);
        console.log(`Books with Wikipedia links: ${withWikiLinks.length}`);
        console.log(`Books without Wikipedia links: ${withoutWikiLinks.length}`);
        console.log(`Wikipedia link coverage: ${((withWikiLinks.length / mergedBooks.length) * 100).toFixed(1)}%`);
        
        if (withoutWikiLinks.length > 0) {
            console.log('\nBooks missing Wikipedia links:');
            withoutWikiLinks.slice(0, 10).forEach(book => {
                console.log(`  "${book.title}" by ${book.author}`);
            });
        }
        
        // Save merged library
        fs.writeFileSync('merged-library.json', JSON.stringify(mergedBooks, null, 2));
        console.log('\nMerged library saved to: merged-library.json');
        
        // Show some examples
        console.log('\n=== SAMPLE MERGED BOOKS ===');
        mergedBooks.slice(0, 10).forEach(book => {
            const hasWiki = book.wikipediaUrl ? '✅' : '❌';
            console.log(`${hasWiki} "${book.title}" by ${book.author} [ID: ${book.gutenbergId}]`);
        });
        
        // Check for specific books
        console.log('\n=== CHECKING SPECIFIC BOOKS ===');
        const finnegansWake = mergedBooks.find(book => book.title.includes('Finnegans Wake'));
        if (finnegansWake) {
            console.log(`✅ Finnegans Wake: ${finnegansWake.wikipediaUrl ? 'Has Wikipedia link' : 'Missing Wikipedia link'}`);
        } else {
            console.log('❌ Finnegans Wake: Not found');
        }
        
        const alice = mergedBooks.find(book => book.title.includes("Alice's Adventures in Wonderland"));
        if (alice) {
            console.log(`✅ Alice's Adventures: ${alice.wikipediaUrl ? 'Has Wikipedia link' : 'Missing Wikipedia link'}`);
        } else {
            console.log('❌ Alice\'s Adventures: Not found');
        }
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { mergeLibraries };
