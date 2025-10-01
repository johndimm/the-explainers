#!/usr/bin/env node

const fs = require('fs');

// Load the original enhanced library to find spurious Shakespeare works
const enhancedLibrary = JSON.parse(fs.readFileSync('corrected-candidate-library.json', 'utf8'));

console.log(`Loaded ${enhancedLibrary.books.length} books from enhanced library`);

// Filter for spurious Shakespeare works
const spuriousShakespeare = enhancedLibrary.books.filter(book => {
    const author = book.author.toLowerCase();
    return author.includes('shakespeare') && (author.includes('spurious') || author.includes('doubtful'));
});

console.log(`Found ${spuriousShakespeare.length} spurious Shakespeare works`);

// Convert to library format
const spuriousLibrary = spuriousShakespeare.map(book => ({
    id: book.gutenbergId,
    title: book.title,
    author: book.author,
    wikipediaUrl: book.wikiUrl,
    wikipediaTitle: book.wikiTitle
}));

// Sort by author, then title
spuriousLibrary.sort((a, b) => {
    const authorCompare = a.author.localeCompare(b.author);
    if (authorCompare !== 0) {
        return authorCompare;
    }
    return a.title.localeCompare(b.title);
});

// Save spurious Shakespeare library
fs.writeFileSync('spurious-shakespeare.json', JSON.stringify(spuriousLibrary, null, 2));
fs.copyFileSync('spurious-shakespeare.json', '../src/data/library/spurious-shakespeare.json');

console.log('\n✅ Spurious Shakespeare library created!');
console.log(`\n📚 SPURIOUS SHAKESPEARE (${spuriousLibrary.length} works):`);

spuriousLibrary.forEach(book => {
    console.log(`  • "${book.title}" by ${book.author}`);
});

console.log('\n🎉 Spurious Shakespeare works now in separate category!');
