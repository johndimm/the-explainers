#!/usr/bin/env node

const fs = require('fs');

function loadLibrary() {
    console.log('Loading current library...');
    
    const library = JSON.parse(fs.readFileSync('../src/data/library/english-literature.json', 'utf8'));
    console.log(`Loaded ${library.length} books`);
    
    return library;
}

function sortByAuthor(library) {
    console.log('\nSorting library by author, then by title...');
    
    // Sort by author first, then by title within each author
    const sortedLibrary = library.sort((a, b) => {
        // First sort by author
        const authorCompare = a.author.localeCompare(b.author);
        if (authorCompare !== 0) {
            return authorCompare;
        }
        // If authors are the same, sort by title
        return a.title.localeCompare(b.title);
    });
    
    console.log(`Sorted ${sortedLibrary.length} books by author and title`);
    
    return sortedLibrary;
}

function showAuthorGroups(library) {
    console.log('\n=== AUTHOR GROUPS ===');
    
    const authorGroups = {};
    library.forEach(book => {
        if (!authorGroups[book.author]) {
            authorGroups[book.author] = [];
        }
        authorGroups[book.author].push(book.title);
    });
    
    // Show authors with multiple books
    Object.entries(authorGroups)
        .filter(([author, books]) => books.length > 1)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, 15) // Show first 15 authors with multiple books
        .forEach(([author, books]) => {
            console.log(`\n📚 ${author} (${books.length} books):`);
            books.forEach(title => {
                console.log(`  • ${title}`);
            });
        });
    
    // Show statistics
    const authorsWithMultipleBooks = Object.entries(authorGroups).filter(([author, books]) => books.length > 1);
    const totalBooksByAuthorsWithMultiple = authorsWithMultipleBooks.reduce((sum, [author, books]) => sum + books.length, 0);
    
    console.log(`\n=== STATISTICS ===`);
    console.log(`Total authors: ${Object.keys(authorGroups).length}`);
    console.log(`Authors with multiple books: ${authorsWithMultipleBooks.length}`);
    console.log(`Books by authors with multiple works: ${totalBooksByAuthorsWithMultiple}`);
    console.log(`Books by single-work authors: ${library.length - totalBooksByAuthorsWithMultiple}`);
}

function main() {
    try {
        const library = loadLibrary();
        const sortedLibrary = sortByAuthor(library);
        
        showAuthorGroups(sortedLibrary);
        
        // Save sorted library
        fs.writeFileSync('sorted-by-author-library.json', JSON.stringify(sortedLibrary, null, 2));
        console.log('\nSorted library saved to: sorted-by-author-library.json');
        
        // Copy to app directory
        fs.copyFileSync('sorted-by-author-library.json', '../src/data/library/english-literature.json');
        console.log('Sorted library copied to: src/data/library/english-literature.json');
        
        console.log('\n🎉 Books are now grouped by author!');
        
        // Show some examples of the new ordering
        console.log('\n=== SAMPLE SORTED ORDER ===');
        sortedLibrary.slice(0, 20).forEach(book => {
            console.log(`"${book.title}" by ${book.author}`);
        });
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { sortByAuthor };
