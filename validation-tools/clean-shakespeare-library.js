#!/usr/bin/env node

const fs = require('fs');

function loadShakespeareLibrary() {
    console.log('Loading Shakespeare library...');
    
    const shakespeareLibrary = JSON.parse(fs.readFileSync('../src/data/library/shakespeare.json', 'utf8'));
    console.log(`Loaded ${shakespeareLibrary.length} books`);
    
    return shakespeareLibrary;
}

function isActualShakespeareWork(book) {
    const title = book.title.toLowerCase();
    const author = book.author.toLowerCase();
    
    // Books that are NOT by Shakespeare (retellings, adaptations, etc.)
    const nonShakespeareWorks = [
        'beautiful stories from shakespeare',
        'tales from shakespeare',
        'stories from shakespeare',
        'shakespeare for children',
        'shakespeare made easy',
        'shakespeare simplified',
        'shakespeare adaptations',
        'shakespeare retellings'
    ];
    
    // Check if this is a non-Shakespeare work
    const isNonShakespeare = nonShakespeareWorks.some(nonWork => 
        title.includes(nonWork)
    );
    
    if (isNonShakespeare) {
        return false;
    }
    
    // Check if author is actually Shakespeare or a translator/editor
    const isShakespeareAuthor = author.includes('shakespeare, william') && 
                               !author.includes('nesbit') && 
                               !author.includes('lamb') &&
                               !author.includes('retelling') &&
                               !author.includes('adaptation');
    
    return isShakespeareAuthor;
}

function cleanShakespeareLibrary(shakespeareBooks) {
    console.log('\nCleaning Shakespeare library...');
    
    const actualShakespeareWorks = [];
    const removedWorks = [];
    
    shakespeareBooks.forEach(book => {
        if (isActualShakespeareWork(book)) {
            actualShakespeareWorks.push(book);
        } else {
            removedWorks.push(book);
        }
    });
    
    console.log(`Kept ${actualShakespeareWorks.length} actual Shakespeare works`);
    console.log(`Removed ${removedWorks.length} non-Shakespeare works:`);
    
    removedWorks.forEach(book => {
        console.log(`  ❌ "${book.title}" by ${book.author}`);
    });
    
    return actualShakespeareWorks;
}

function main() {
    try {
        const shakespeareBooks = loadShakespeareLibrary();
        const cleanedShakespeareBooks = cleanShakespeareLibrary(shakespeareBooks);
        
        // Sort by author, then title
        cleanedShakespeareBooks.sort((a, b) => {
            const authorCompare = a.author.localeCompare(b.author);
            if (authorCompare !== 0) {
                return authorCompare;
            }
            return a.title.localeCompare(b.title);
        });
        
        // Save cleaned Shakespeare library
        fs.writeFileSync('shakespeare-cleaned.json', JSON.stringify(cleanedShakespeareBooks, null, 2));
        fs.copyFileSync('shakespeare-cleaned.json', '../src/data/library/shakespeare.json');
        
        console.log('\n✅ Shakespeare library cleaned and saved!');
        
        // Show some examples of remaining works
        console.log('\n📚 Remaining Shakespeare works:');
        cleanedShakespeareBooks.slice(0, 10).forEach(book => {
            console.log(`  ✅ "${book.title}" by ${book.author}`);
        });
        
        if (cleanedShakespeareBooks.length > 10) {
            console.log(`  ... and ${cleanedShakespeareBooks.length - 10} more`);
        }
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { isActualShakespeareWork, cleanShakespeareLibrary };
