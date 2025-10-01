#!/usr/bin/env node

const fs = require('fs');

function combineAllExtractions() {
    console.log('Combining all previous extractions into comprehensive library...');
    
    const allBooks = [];
    const sources = [];
    
    // 1. Original targeted extraction (71 books)
    if (fs.existsSync('books-with-gutenberg-links.json')) {
        const data = JSON.parse(fs.readFileSync('books-with-gutenberg-links.json', 'utf8'));
        const books = data.map(book => ({
            id: book.gutenbergId,
            title: book.title,
            author: "Unknown", // We'll need to extract this
            wikipediaUrl: book.wikipediaUrl,
            wikipediaTitle: book.title,
            category: book.category,
            source: 'targeted-extraction'
        }));
        allBooks.push(...books);
        sources.push(`Original targeted extraction: ${books.length} books`);
    }
    
    // 2. Shakespeare extraction (26 books)
    if (fs.existsSync('shakespeare-books-with-gutenberg-links.json')) {
        const data = JSON.parse(fs.readFileSync('shakespeare-books-with-gutenberg-links.json', 'utf8'));
        const books = data.map(book => ({
            id: book.gutenbergId,
            title: book.title,
            author: book.title.includes('Shakespeare') || book.title.includes('Hamlet') || book.title.includes('Macbeth') || 
                   book.title.includes('Romeo') || book.title.includes('Othello') || book.title.includes('Lear') ||
                   book.title.includes('Tempest') || book.title.includes('Midsummer') || book.title.includes('Merchant') ||
                   book.title.includes('Twelfth') || book.title.includes('As You Like') || book.title.includes('Antony') ||
                   book.title.includes('Taming') || book.title.includes('Troilus') || book.title.includes('Coriolanus') ||
                   book.title.includes('First Folio') || book.title.includes('Complete Works') ? 
                   "William Shakespeare" : "Various",
            wikipediaUrl: book.wikipediaUrl,
            wikipediaTitle: book.title,
            category: book.category,
            source: 'shakespeare-extraction'
        }));
        allBooks.push(...books);
        sources.push(`Shakespeare extraction: ${books.length} books`);
    }
    
    // 3. Plato extraction (25 books)
    if (fs.existsSync('plato-books-with-gutenberg-links.json')) {
        const data = JSON.parse(fs.readFileSync('plato-books-with-gutenberg-links.json', 'utf8'));
        const books = data.map(book => ({
            id: book.gutenbergId,
            title: book.title,
            author: book.title.includes('Plato') || book.title.includes('Republic') || book.title.includes('Apology') ||
                   book.title.includes('Symposium') || book.title.includes('Gorgias') || book.title.includes('Timaeus') ||
                   book.title.includes('Laws') || book.title.includes('Parmenides') || book.title.includes('Philebus') ||
                   book.title.includes('Protagoras') || book.title.includes('Charmides') || book.title.includes('Critias') ||
                   book.title.includes('Ion') || book.title.includes('Menexenus') || book.title.includes('Minos') ||
                   book.title.includes('Second Alcibiades') ? "Plato" :
                   book.title.includes('Xenophon') || book.title.includes('Memorabilia') || book.title.includes('Oeconomicus') ? "Xenophon" :
                   book.title.includes('Machiavelli') ? "Niccolò Machiavelli" :
                   book.title.includes('Aesop') ? "Aesop" : "Various",
            wikipediaUrl: book.wikipediaUrl,
            wikipediaTitle: book.title,
            category: book.category,
            source: 'plato-extraction'
        }));
        allBooks.push(...books);
        sources.push(`Plato extraction: ${books.length} books`);
    }
    
    // Remove duplicates based on Gutenberg ID
    const uniqueBooks = [];
    const seenIds = new Set();
    
    allBooks.forEach(book => {
        if (!seenIds.has(book.id)) {
            seenIds.add(book.id);
            uniqueBooks.push(book);
        }
    });
    
    // Sort by title
    uniqueBooks.sort((a, b) => a.title.localeCompare(b.title));
    
    // Create comprehensive library file
    const comprehensiveLibrary = {
        metadata: {
            creationDate: new Date().toISOString(),
            totalBooks: uniqueBooks.length,
            sources: sources,
            description: "Comprehensive library of books with both Wikipedia pages and Project Gutenberg entries"
        },
        books: uniqueBooks
    };
    
    fs.writeFileSync('comprehensive-library.json', JSON.stringify(comprehensiveLibrary, null, 2));
    
    // Create app-ready library file (just the books array)
    fs.writeFileSync('comprehensive-library-app.json', JSON.stringify(uniqueBooks, null, 2));
    
    console.log(`\n=== COMBINATION COMPLETE ===`);
    console.log(`Total unique books: ${uniqueBooks.length}`);
    console.log(`Sources combined:`);
    sources.forEach(source => console.log(`  - ${source}`));
    
    // Show category breakdown
    const categoryCount = {};
    uniqueBooks.forEach(book => {
        const cat = book.category || 'Unknown';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    console.log(`\nCategory breakdown:`);
    Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([category, count]) => {
            console.log(`  ${category}: ${count} books`);
        });
    
    console.log(`\nFiles created:`);
    console.log(`  - comprehensive-library.json (with metadata)`);
    console.log(`  - comprehensive-library-app.json (app-ready format)`);
}

if (require.main === module) {
    combineAllExtractions();
}

module.exports = { combineAllExtractions };
