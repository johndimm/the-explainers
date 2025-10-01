#!/usr/bin/env node

const fs = require('fs');

function loadCleanLibrary() {
    console.log('Loading clean library...');
    
    const cleanLibrary = JSON.parse(fs.readFileSync('clean-library.json', 'utf8'));
    console.log(`Loaded ${cleanLibrary.length} books`);
    
    return cleanLibrary;
}

function createFinalLibrary(cleanLibrary) {
    console.log('\nCreating final library with strict filtering...');
    
    const finalBooks = [];
    
    cleanLibrary.forEach(book => {
        if (isHighQualityBook(book)) {
            finalBooks.push({
                id: book.id,
                title: book.title,
                author: book.author,
                wikipediaUrl: book.wikipediaUrl,
                wikipediaTitle: book.wikipediaTitle,
                localPath: book.localPath
            });
        }
    });
    
    console.log(`Final library: ${finalBooks.length} books (removed ${cleanLibrary.length - finalBooks.length} low-quality entries)`);
    
    // Sort by title
    finalBooks.sort((a, b) => a.title.localeCompare(b.title));
    
    return finalBooks;
}

function isHighQualityBook(book) {
    const title = book.title.trim();
    const author = book.author.trim();
    
    // Must have a valid title
    if (!title || title.length < 5) return false;
    
    // Title must start with a capital letter
    if (!title.match(/^[A-Z]/)) return false;
    
    // Title must not be just a fragment (no leading spaces, numbers, or punctuation)
    if (title.match(/^[\s\d\-\.\,\:\;]/)) return false;
    
    // Title must not end with fragments
    if (title.match(/[\s\-\.\,\:\;]$/)) return false;
    
    // Title must not be just a year
    if (title.match(/^\d{4}$/)) return false;
    
    // Title must not be just numbers and spaces
    if (title.match(/^[\s\d]+$/)) return false;
    
    // Title must not be just punctuation and fragments
    if (title.match(/^[\s\-\.\,\:\;\&\+\=\/\\]+$/)) return false;
    
    // Title must not be too long (likely malformed)
    if (title.length > 200) return false;
    
    // Must have a valid author
    if (!author || author.length < 3) return false;
    
    // Author must start with a capital letter
    if (!author.match(/^[A-Z]/)) return false;
    
    // Author must not be just numbers or fragments
    if (author.match(/^[\s\d\-\.\,\:\;]+$/)) return false;
    
    return true;
}

function main() {
    try {
        const cleanLibrary = loadCleanLibrary();
        const finalBooks = createFinalLibrary(cleanLibrary);
        
        // Check Wikipedia link coverage
        const withWikiLinks = finalBooks.filter(book => book.wikipediaUrl);
        const withoutWikiLinks = finalBooks.filter(book => !book.wikipediaUrl);
        
        console.log(`\n=== FINAL LIBRARY STATISTICS ===`);
        console.log(`Total books: ${finalBooks.length}`);
        console.log(`Books with Wikipedia links: ${withWikiLinks.length}`);
        console.log(`Books without Wikipedia links: ${withoutWikiLinks.length}`);
        console.log(`Wikipedia link coverage: ${((withWikiLinks.length / finalBooks.length) * 100).toFixed(1)}%`);
        
        // Show some examples
        console.log('\n=== SAMPLE FINAL BOOKS ===');
        finalBooks.slice(0, 20).forEach(book => {
            const hasWiki = book.wikipediaUrl ? '✅' : '❌';
            console.log(`${hasWiki} "${book.title}" by ${book.author}`);
        });
        
        // Check for specific books
        console.log('\n=== CHECKING SPECIFIC BOOKS ===');
        const finnegansWake = finalBooks.find(book => book.title.includes('Finnegans Wake'));
        if (finnegansWake) {
            console.log(`✅ Finnegans Wake: ${finnegansWake.wikipediaUrl ? 'Has Wikipedia link' : 'Missing Wikipedia link'}`);
        } else {
            console.log('❌ Finnegans Wake: Not found');
        }
        
        const alice = finalBooks.find(book => book.title.includes("Alice's Adventures in Wonderland"));
        if (alice) {
            console.log(`✅ Alice's Adventures: ${alice.wikipediaUrl ? 'Has Wikipedia link' : 'Missing Wikipedia link'}`);
        } else {
            console.log('❌ Alice\'s Adventures: Not found');
        }
        
        const pride = finalBooks.find(book => book.title.includes('Pride and Prejudice'));
        if (pride) {
            console.log(`✅ Pride and Prejudice: ${pride.wikipediaUrl ? 'Has Wikipedia link' : 'Missing Wikipedia link'}`);
        } else {
            console.log('❌ Pride and Prejudice: Not found');
        }
        
        const hamlet = finalBooks.find(book => book.title.includes('Hamlet'));
        if (hamlet) {
            console.log(`✅ Hamlet: ${hamlet.wikipediaUrl ? 'Has Wikipedia link' : 'Missing Wikipedia link'}`);
        } else {
            console.log('❌ Hamlet: Not found');
        }
        
        // Save final library
        fs.writeFileSync('final-library.json', JSON.stringify(finalBooks, null, 2));
        console.log('\nFinal library saved to: final-library.json');
        
        // Copy to app directory
        fs.copyFileSync('final-library.json', '../src/data/library/english-literature.json');
        console.log('Final library copied to: src/data/library/english-literature.json');
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createFinalLibrary, isHighQualityBook };
