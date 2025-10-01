#!/usr/bin/env node

const fs = require('fs');

function loadVerifiedData() {
    console.log('Loading verified data with Wikipedia links...');
    
    const verifiedData = JSON.parse(fs.readFileSync('corrected-candidate-library.json', 'utf8'));
    console.log(`Loaded ${verifiedData.books.length} verified books with Wikipedia links`);
    
    return verifiedData.books;
}

function createLookupMap(verifiedBooks) {
    console.log('\nCreating lookup map for Wikipedia links...');
    
    const lookupMap = new Map();
    
    verifiedBooks.forEach(book => {
        // Create lookup keys based on title and author
        const titleKey = book.title.toLowerCase().trim();
        const authorKey = book.author.toLowerCase().trim();
        const combinedKey = `${titleKey}|||${authorKey}`;
        
        lookupMap.set(combinedKey, {
            wikipediaUrl: book.wikiUrl,
            wikipediaTitle: book.wikiTitle
        });
    });
    
    console.log(`Created lookup map with ${lookupMap.size} entries`);
    return lookupMap;
}

function restoreWikipediaLinks(libraryBooks, lookupMap) {
    console.log('\nRestoring Wikipedia links...');
    
    let restoredCount = 0;
    let missingCount = 0;
    
    const restoredBooks = libraryBooks.map(book => {
        const titleKey = book.title.toLowerCase().trim();
        const authorKey = book.author.toLowerCase().trim();
        const combinedKey = `${titleKey}|||${authorKey}`;
        
        const wikiData = lookupMap.get(combinedKey);
        
        if (wikiData) {
            restoredCount++;
            return {
                ...book,
                wikipediaUrl: wikiData.wikipediaUrl,
                wikipediaTitle: wikiData.wikipediaTitle
            };
        } else {
            missingCount++;
            console.log(`  ❌ Missing Wikipedia link: "${book.title}" by ${book.author}`);
            return book;
        }
    });
    
    console.log(`Restored Wikipedia links for ${restoredCount} books`);
    console.log(`Missing Wikipedia links for ${missingCount} books`);
    
    return restoredBooks;
}

function processAllLibraries() {
    console.log('\nProcessing all library files...');
    
    const verifiedBooks = loadVerifiedData();
    const lookupMap = createLookupMap(verifiedBooks);
    
    const libraryFiles = [
        'shakespeare', 'plato', 'philosophers', 'poetry', 'history',
        'english-literature', 'french-literature', 'german-literature',
        'spanish-literature', 'italian-literature', 'russian-literature',
        'classical-literature', 'spurious-shakespeare'
    ];
    
    libraryFiles.forEach(filename => {
        try {
            console.log(`\nProcessing ${filename}...`);
            
            const libraryBooks = JSON.parse(fs.readFileSync(`../src/data/library/${filename}.json`, 'utf8'));
            console.log(`  Loaded ${libraryBooks.length} books`);
            
            const restoredBooks = restoreWikipediaLinks(libraryBooks, lookupMap);
            
            // Save restored library
            fs.writeFileSync(`${filename}-restored.json`, JSON.stringify(restoredBooks, null, 2));
            fs.copyFileSync(`${filename}-restored.json`, `../src/data/library/${filename}.json`);
            
            console.log(`  ✅ ${filename} restored with Wikipedia links`);
            
        } catch (error) {
            console.log(`  ❌ Could not process ${filename}: ${error.message}`);
        }
    });
}

function main() {
    try {
        processAllLibraries();
        
        console.log('\n🎉 ALL LIBRARIES RESTORED WITH WIKIPEDIA LINKS!');
        
        // Verify one library
        console.log('\n=== VERIFICATION ===');
        const testLibrary = JSON.parse(fs.readFileSync('../src/data/library/shakespeare.json', 'utf8'));
        const withWikiLinks = testLibrary.filter(book => book.wikipediaUrl);
        const withoutWikiLinks = testLibrary.filter(book => !book.wikipediaUrl);
        
        console.log(`Shakespeare library: ${testLibrary.length} books`);
        console.log(`With Wikipedia links: ${withWikiLinks.length}`);
        console.log(`Without Wikipedia links: ${withoutWikiLinks.length}`);
        
        if (withWikiLinks.length > 0) {
            console.log('\nSample books with Wikipedia links:');
            withWikiLinks.slice(0, 3).forEach(book => {
                console.log(`  ✅ "${book.title}" - ${book.wikipediaUrl}`);
            });
        }
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createLookupMap, restoreWikipediaLinks };
