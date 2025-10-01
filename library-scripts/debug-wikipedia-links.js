#!/usr/bin/env node

const fs = require('fs');

console.log('🔍 Debugging Wikipedia links in English Literature...\n');

// Load the English Literature file
const englishLit = JSON.parse(fs.readFileSync('src/data/library/english-literature.json', 'utf8'));

console.log(`📚 Total books: ${englishLit.length}\n`);

// Check first 10 books for Wikipedia links
console.log('🔗 First 10 books and their Wikipedia links:');
englishLit.slice(0, 10).forEach((book, index) => {
  console.log(`${index + 1}. "${book.title}" by ${book.author}`);
  if (book.wikipediaUrl) {
    console.log(`   ✅ Wikipedia: ${book.wikipediaUrl}`);
  } else {
    console.log(`   ❌ No Wikipedia URL`);
  }
  console.log('');
});

// Count books with and without Wikipedia links
const withWiki = englishLit.filter(book => book.wikipediaUrl).length;
const withoutWiki = englishLit.length - withWiki;

console.log(`📊 Statistics:`);
console.log(`   Books with Wikipedia links: ${withWiki} (${((withWiki/englishLit.length)*100).toFixed(1)}%)`);
console.log(`   Books without Wikipedia links: ${withoutWiki} (${((withoutWiki/englishLit.length)*100).toFixed(1)}%)`);

// Check specific books mentioned in screenshot
const alice = englishLit.find(book => book.title === "Alice's Adventures in Wonderland");
const pride = englishLit.find(book => book.title === "Pride and Prejudice");

console.log(`\n🎯 Specific books from screenshot:`);
console.log(`Alice's Adventures in Wonderland: ${alice ? (alice.wikipediaUrl ? '✅ Has Wikipedia link' : '❌ No Wikipedia link') : '❌ Not found'}`);
console.log(`Pride and Prejudice: ${pride ? (pride.wikipediaUrl ? '✅ Has Wikipedia link' : '❌ No Wikipedia link') : '❌ Not found'}`);


