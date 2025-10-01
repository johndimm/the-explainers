#!/usr/bin/env node

const fs = require('fs');

function loadAllLibraries() {
    console.log('Loading all library files...');
    
    const libraries = {};
    const libraryFiles = [
        'shakespeare', 'plato', 'philosophers', 'poetry', 'history',
        'english-literature', 'french-literature', 'german-literature',
        'spanish-literature', 'italian-literature', 'russian-literature',
        'classical-literature'
    ];
    
    libraryFiles.forEach(filename => {
        try {
            const books = JSON.parse(fs.readFileSync(`../src/data/library/${filename}.json`, 'utf8'));
            libraries[filename] = books;
            console.log(`Loaded ${filename}: ${books.length} books`);
        } catch (error) {
            console.log(`Could not load ${filename}: ${error.message}`);
        }
    });
    
    return libraries;
}

function separateSpuriousShakespeare(shakespeareBooks) {
    console.log('\nSeparating spurious Shakespeare works...');
    
    const authenticShakespeare = [];
    const spuriousShakespeare = [];
    
    shakespeareBooks.forEach(book => {
        if (book.author.includes('spurious') || book.author.includes('doubtful')) {
            spuriousShakespeare.push(book);
        } else {
            authenticShakespeare.push(book);
        }
    });
    
    console.log(`Authentic Shakespeare: ${authenticShakespeare.length} works`);
    console.log(`Spurious Shakespeare: ${spuriousShakespeare.length} works`);
    
    return { authenticShakespeare, spuriousShakespeare };
}

function removeDuplicates(books) {
    console.log('\nRemoving duplicates...');
    
    const seen = new Set();
    const uniqueBooks = [];
    let duplicatesFound = 0;
    
    books.forEach(book => {
        // Create a unique key based on title and author
        const key = `${book.title.toLowerCase().trim()}_${book.author.toLowerCase().trim()}`;
        
        if (!seen.has(key)) {
            seen.add(key);
            uniqueBooks.push(book);
        } else {
            duplicatesFound++;
        }
    });
    
    console.log(`Removed ${duplicatesFound} duplicates`);
    console.log(`Unique books: ${uniqueBooks.length}`);
    
    return uniqueBooks;
}

function removeCrossCategoryDuplicates(libraries) {
    console.log('\nRemoving cross-category duplicates...');
    
    // Create a master set of all books to track duplicates across categories
    const masterSet = new Set();
    const cleanedLibraries = {};
    let totalDuplicatesRemoved = 0;
    
    // Process libraries in order of priority (Shakespeare first, then others)
    const priorityOrder = [
        'shakespeare', 'plato', 'philosophers', 'poetry', 'history',
        'english-literature', 'french-literature', 'german-literature',
        'spanish-literature', 'italian-literature', 'russian-literature',
        'classical-literature'
    ];
    
    priorityOrder.forEach(category => {
        if (libraries[category]) {
            const cleanedBooks = [];
            
            libraries[category].forEach(book => {
                const key = `${book.title.toLowerCase().trim()}_${book.author.toLowerCase().trim()}`;
                
                if (!masterSet.has(key)) {
                    masterSet.add(key);
                    cleanedBooks.push(book);
                } else {
                    totalDuplicatesRemoved++;
                }
            });
            
            cleanedLibraries[category] = cleanedBooks;
        }
    });
    
    console.log(`Removed ${totalDuplicatesRemoved} cross-category duplicates`);
    
    return cleanedLibraries;
}

function saveCleanedLibraries(libraries) {
    console.log('\nSaving cleaned libraries...');
    
    Object.entries(libraries).forEach(([category, books]) => {
        if (books.length > 0) {
            // Sort by author, then title
            books.sort((a, b) => {
                const authorCompare = a.author.localeCompare(b.author);
                if (authorCompare !== 0) {
                    return authorCompare;
                }
                return a.title.localeCompare(b.title);
            });
            
            // Save to validation-tools directory
            const filename = `${category}.json`;
            fs.writeFileSync(filename, JSON.stringify(books, null, 2));
            
            // Copy to app directory
            fs.copyFileSync(filename, `../src/data/library/${filename}`);
            
            console.log(`✅ ${category.toUpperCase()}: ${books.length} books`);
        }
    });
}

function showFinalStatistics(libraries) {
    console.log('\n=== FINAL LIBRARY STATISTICS ===');
    
    const totalBooks = Object.values(libraries).reduce((sum, books) => sum + books.length, 0);
    console.log(`Total unique books across all categories: ${totalBooks}`);
    
    Object.entries(libraries).forEach(([category, books]) => {
        if (books.length > 0) {
            console.log(`\n📚 ${category.toUpperCase()} (${books.length} books):`);
            
            // Show top authors
            const authorCounts = {};
            books.forEach(book => {
                authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
            });
            
            const topAuthors = Object.entries(authorCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);
            
            topAuthors.forEach(([author, count]) => {
                console.log(`  • ${author}: ${count} book${count > 1 ? 's' : ''}`);
            });
        }
    });
}

function main() {
    try {
        const libraries = loadAllLibraries();
        
        // Separate spurious Shakespeare
        if (libraries.shakespeare) {
            const { authenticShakespeare, spuriousShakespeare } = separateSpuriousShakespeare(libraries.shakespeare);
            libraries.shakespeare = authenticShakespeare;
            libraries['spurious-shakespeare'] = spuriousShakespeare;
        }
        
        // Remove duplicates within each category
        Object.keys(libraries).forEach(category => {
            if (libraries[category]) {
                libraries[category] = removeDuplicates(libraries[category]);
            }
        });
        
        // Remove cross-category duplicates
        const cleanedLibraries = removeCrossCategoryDuplicates(libraries);
        
        saveCleanedLibraries(cleanedLibraries);
        showFinalStatistics(cleanedLibraries);
        
        console.log('\n🎉 ALL LIBRARIES DEDUPLICATED AND ORGANIZED!');
        console.log('\n📁 Updated library files:');
        Object.entries(cleanedLibraries).forEach(([category, books]) => {
            if (books.length > 0) {
                console.log(`  • ${category}.json (${books.length} books)`);
            }
        });
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { separateSpuriousShakespeare, removeDuplicates, removeCrossCategoryDuplicates };
