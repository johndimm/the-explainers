#!/usr/bin/env node

const fs = require('fs');

function loadLibrary() {
    console.log('Loading current library...');
    
    const library = JSON.parse(fs.readFileSync('../src/data/library/english-literature.json', 'utf8'));
    console.log(`Loaded ${library.length} books`);
    
    return library;
}

function createWikiOnlyLibrary(library) {
    console.log('\nCreating Wikipedia-only library...');
    
    const wikiOnlyBooks = library.filter(book => book.wikipediaUrl);
    
    console.log(`Wikipedia-only library: ${wikiOnlyBooks.length} books (removed ${library.length - wikiOnlyBooks.length} books without Wikipedia links)`);
    
    // Sort by title
    wikiOnlyBooks.sort((a, b) => a.title.localeCompare(b.title));
    
    return wikiOnlyBooks;
}

function main() {
    try {
        const library = loadLibrary();
        const wikiOnlyBooks = createWikiOnlyLibrary(library);
        
        console.log(`\n=== WIKIPEDIA-ONLY LIBRARY STATISTICS ===`);
        console.log(`Total books: ${wikiOnlyBooks.length}`);
        console.log(`Wikipedia link coverage: 100%`);
        
        // Show some examples
        console.log('\n=== SAMPLE BOOKS WITH WIKIPEDIA LINKS ===');
        wikiOnlyBooks.slice(0, 20).forEach(book => {
            console.log(`✅ "${book.title}" by ${book.author}`);
        });
        
        // Check for specific books
        console.log('\n=== CHECKING SPECIFIC BOOKS ===');
        const finnegansWake = wikiOnlyBooks.find(book => book.title.includes('Finnegans Wake'));
        if (finnegansWake) {
            console.log(`✅ Finnegans Wake: Has Wikipedia link`);
        } else {
            console.log('❌ Finnegans Wake: Not found');
        }
        
        const alice = wikiOnlyBooks.find(book => book.title.includes("Alice's Adventures in Wonderland"));
        if (alice) {
            console.log(`✅ Alice's Adventures: Has Wikipedia link`);
        } else {
            console.log('❌ Alice\'s Adventures: Not found');
        }
        
        const pride = wikiOnlyBooks.find(book => book.title.includes('Pride and Prejudice'));
        if (pride) {
            console.log(`✅ Pride and Prejudice: Has Wikipedia link`);
        } else {
            console.log('❌ Pride and Prejudice: Not found');
        }
        
        const hamlet = wikiOnlyBooks.find(book => book.title.includes('Hamlet'));
        if (hamlet) {
            console.log(`✅ Hamlet: Has Wikipedia link`);
        } else {
            console.log('❌ Hamlet: Not found');
        }
        
        const bookOfPrefaces = wikiOnlyBooks.find(book => book.title.includes('A Book of Prefaces'));
        if (bookOfPrefaces) {
            console.log(`✅ A Book of Prefaces: Has Wikipedia link`);
        } else {
            console.log('❌ A Book of Prefaces: Not found');
        }
        
        // Save Wikipedia-only library
        fs.writeFileSync('wiki-only-library.json', JSON.stringify(wikiOnlyBooks, null, 2));
        console.log('\nWikipedia-only library saved to: wiki-only-library.json');
        
        // Copy to app directory
        fs.copyFileSync('wiki-only-library.json', '../src/data/library/english-literature.json');
        console.log('Wikipedia-only library copied to: src/data/library/english-literature.json');
        
        console.log('\n🎉 Now ALL books in the library should have Wikipedia links!');
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createWikiOnlyLibrary };
