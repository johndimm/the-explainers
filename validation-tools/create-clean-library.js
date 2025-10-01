#!/usr/bin/env node

const fs = require('fs');

function loadMergedLibrary() {
    console.log('Loading merged library...');
    
    const mergedLibrary = JSON.parse(fs.readFileSync('merged-library.json', 'utf8'));
    console.log(`Loaded ${mergedLibrary.length} books`);
    
    return mergedLibrary;
}

function cleanLibrary(mergedLibrary) {
    console.log('\nCleaning library...');
    
    const cleanBooks = [];
    
    mergedLibrary.forEach(book => {
        // Filter out books with malformed titles
        if (isValidBook(book)) {
            cleanBooks.push({
                id: book.gutenbergId || book.id,
                title: book.title,
                author: book.author,
                wikipediaUrl: book.wikipediaUrl,
                wikipediaTitle: book.wikipediaTitle,
                localPath: book.localPath // Preserve if it exists
            });
        }
    });
    
    console.log(`Cleaned library: ${cleanBooks.length} books (removed ${mergedLibrary.length - cleanBooks.length} malformed entries)`);
    
    // Sort by title
    cleanBooks.sort((a, b) => a.title.localeCompare(b.title));
    
    return cleanBooks;
}

function isValidBook(book) {
    // Check if title is valid (not just a year or fragment)
    if (!book.title || book.title.trim().length < 3) return false;
    
    // Check for malformed titles (starting with numbers, years, or fragments)
    const title = book.title.trim();
    if (title.match(/^\d{4}$/)) return false; // Just a year
    if (title.match(/^[\s\d]+$/)) return false; // Just spaces and numbers
    if (title.match(/^[^A-Za-z]/)) return false; // Doesn't start with a letter
    if (title.length < 3) return false; // Too short
    
    // Check if author is valid
    if (!book.author || book.author.trim().length < 3) return false;
    
    return true;
}

function main() {
    try {
        const mergedLibrary = loadMergedLibrary();
        const cleanBooks = cleanLibrary(mergedLibrary);
        
        // Check Wikipedia link coverage
        const withWikiLinks = cleanBooks.filter(book => book.wikipediaUrl);
        const withoutWikiLinks = cleanBooks.filter(book => !book.wikipediaUrl);
        
        console.log(`\n=== CLEAN LIBRARY STATISTICS ===`);
        console.log(`Total books: ${cleanBooks.length}`);
        console.log(`Books with Wikipedia links: ${withWikiLinks.length}`);
        console.log(`Books without Wikipedia links: ${withoutWikiLinks.length}`);
        console.log(`Wikipedia link coverage: ${((withWikiLinks.length / cleanBooks.length) * 100).toFixed(1)}%`);
        
        // Show some examples
        console.log('\n=== SAMPLE CLEAN BOOKS ===');
        cleanBooks.slice(0, 15).forEach(book => {
            const hasWiki = book.wikipediaUrl ? '✅' : '❌';
            console.log(`${hasWiki} "${book.title}" by ${book.author}`);
        });
        
        // Check for specific books
        console.log('\n=== CHECKING SPECIFIC BOOKS ===');
        const finnegansWake = cleanBooks.find(book => book.title.includes('Finnegans Wake'));
        if (finnegansWake) {
            console.log(`✅ Finnegans Wake: ${finnegansWake.wikipediaUrl ? 'Has Wikipedia link' : 'Missing Wikipedia link'}`);
        } else {
            console.log('❌ Finnegans Wake: Not found');
        }
        
        const alice = cleanBooks.find(book => book.title.includes("Alice's Adventures in Wonderland"));
        if (alice) {
            console.log(`✅ Alice's Adventures: ${alice.wikipediaUrl ? 'Has Wikipedia link' : 'Missing Wikipedia link'}`);
        } else {
            console.log('❌ Alice\'s Adventures: Not found');
        }
        
        const pride = cleanBooks.find(book => book.title.includes('Pride and Prejudice'));
        if (pride) {
            console.log(`✅ Pride and Prejudice: ${pride.wikipediaUrl ? 'Has Wikipedia link' : 'Missing Wikipedia link'}`);
        } else {
            console.log('❌ Pride and Prejudice: Not found');
        }
        
        // Save clean library
        fs.writeFileSync('clean-library.json', JSON.stringify(cleanBooks, null, 2));
        console.log('\nClean library saved to: clean-library.json');
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { cleanLibrary, isValidBook };
