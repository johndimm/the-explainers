#!/usr/bin/env node

const fs = require('fs');

function loadData() {
    console.log('Loading data for corrected library building...');
    
    // Load base normalized matches
    const baseMatches = JSON.parse(fs.readFileSync('normalized-exact-matches.json', 'utf8'));
    console.log(`Loaded ${baseMatches.matches.length} base normalized matches`);
    
    // Load Wikipedia articles
    const wikiData = JSON.parse(fs.readFileSync('wiki-gutenberg-raw-list.json', 'utf8'));
    console.log(`Loaded ${wikiData.articles.length} Wikipedia articles`);
    
    // Load corrected Gutenberg catalog
    const gutenbergBooks = JSON.parse(fs.readFileSync('gutenberg-catalog-fixed.json', 'utf8'));
    console.log(`Loaded ${gutenbergBooks.length} corrected Gutenberg books`);
    
    return { baseMatches, wikiData, gutenbergBooks };
}

function normalizeTitle(title) {
    if (!title) return '';
    
    return title
        .toLowerCase()
        .trim()
        .replace(/^(the|a|an)\s+/g, '')
        .replace(/\s*\((book|novel|play|poem|work|text|dialogue|treatise|essay|collection|plato|shakespeare)\)\s*$/g, '')
        .replace(/\s*(by\s+[^,]+|--\s*[^,]+|-.*)$/g, '')
        .replace(/[''`]/g, "'")
        .replace(/[""]/g, '"')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function createShakespeareVariations(title) {
    const variations = new Set();
    
    variations.add(title);
    variations.add(normalizeTitle(title));
    
    if (title.startsWith("King ")) {
        variations.add(title.substring(5));
        variations.add(normalizeTitle(title.substring(5)));
    } else {
        variations.add(`King ${title}`);
        variations.add(normalizeTitle(`King ${title}`));
    }
    
    const romanToArabic = { 'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6', 'vii': '7', 'viii': '8' };
    
    for (const [roman, arabic] of Object.entries(romanToArabic)) {
        if (title.toLowerCase().includes(`part ${roman}`)) {
            variations.add(title.replace(new RegExp(`part ${roman}`, 'gi'), `part ${arabic}`));
            variations.add(title.replace(new RegExp(`part ${roman}`, 'gi'), `${arabic}`));
            variations.add(normalizeTitle(title.replace(new RegExp(`part ${roman}`, 'gi'), `part ${arabic}`)));
            variations.add(normalizeTitle(title.replace(new RegExp(`part ${roman}`, 'gi'), `${arabic}`)));
        }
        if (title.toLowerCase().includes(`part ${arabic}`)) {
            variations.add(title.replace(new RegExp(`part ${arabic}`, 'gi'), `part ${roman}`));
            variations.add(title.replace(new RegExp(`part ${arabic}`, 'gi'), `${roman}`));
            variations.add(normalizeTitle(title.replace(new RegExp(`part ${arabic}`, 'gi'), `part ${roman}`)));
            variations.add(normalizeTitle(title.replace(new RegExp(`part ${arabic}`, 'gi'), `${roman}`)));
        }
    }
    
    return Array.from(variations).filter(v => v && v.length > 0);
}

function createPlatoVariations(title) {
    const variations = new Set();
    
    variations.add(title);
    variations.add(normalizeTitle(title));
    
    if (title.startsWith("The ")) {
        variations.add(title.substring(4));
        variations.add(normalizeTitle(title.substring(4)));
    } else {
        variations.add(`The ${title}`);
        variations.add(normalizeTitle(`The ${title}`));
    }
    
    if (!title.includes("(dialogue)")) {
        variations.add(`${title} (dialogue)`);
        variations.add(normalizeTitle(`${title} (dialogue)`));
    }
    
    const romanToArabic = { 'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10' };
    
    for (const [roman, arabic] of Object.entries(romanToArabic)) {
        if (title.toLowerCase().includes(` ${roman} letter`)) {
            variations.add(title.replace(new RegExp(` ${roman} letter`, 'gi'), ` ${arabic} letter`));
            variations.add(title.replace(new RegExp(` ${roman} letter`, 'gi'), ` ${arabic}th letter`));
            variations.add(normalizeTitle(title.replace(new RegExp(` ${roman} letter`, 'gi'), ` ${arabic} letter`)));
            variations.add(normalizeTitle(title.replace(new RegExp(` ${roman} letter`, 'gi'), ` ${arabic}th letter`)));
        }
        if (title.toLowerCase().includes(` ${arabic} letter`)) {
            variations.add(title.replace(new RegExp(` ${arabic} letter`, 'gi'), ` ${roman} letter`));
            variations.add(normalizeTitle(title.replace(new RegExp(` ${arabic} letter`, 'gi'), ` ${roman} letter`)));
        }
    }
    
    return Array.from(variations).filter(v => v && v.length > 0);
}

function findShakespeareEnhancements(wikiData, gutenbergBooks) {
    console.log('\nEnhancing Shakespeare works...');
    
    const shakespearePlays = [
        'Hamlet', 'Macbeth', 'Romeo and Juliet', 'Othello', 'King Lear', 'Julius Caesar',
        'The Tempest', 'A Midsummer Night\'s Dream', 'Much Ado About Nothing', 'As You Like It',
        'Twelfth Night', 'The Merchant of Venice', 'The Taming of the Shrew', 'Richard III',
        'Henry V', 'Henry IV, Part 1', 'Henry IV, Part 2', 'Richard II', 'King John',
        'Henry VI, Part 1', 'Henry VI, Part 2', 'Henry VI, Part 3', 'Henry VIII',
        'Antony and Cleopatra', 'Coriolanus', 'Timon of Athens', 'Pericles, Prince of Tyre',
        'Cymbeline', 'The Winter\'s Tale', 'All\'s Well That Ends Well', 'Measure for Measure',
        'Troilus and Cressida', 'The Comedy of Errors', 'Love\'s Labour\'s Lost',
        'The Two Gentlemen of Verona', 'Titus Andronicus', 'King Richard II',
        'King Henry IV, Part 1', 'King Henry IV, Part 2', 'King Henry V', 'King Henry VI, Part 1',
        'King Henry VI, Part 2', 'King Henry VI, Part 3', 'King Henry VIII'
    ];
    
    const shakespeareBooks = gutenbergBooks.filter(book => 
        book.authors && book.authors.toLowerCase().includes('shakespeare')
    );
    
    console.log(`Found ${shakespeareBooks.length} Shakespeare works in Gutenberg`);
    
    const enhancements = [];
    
    shakespearePlays.forEach(playTitle => {
        const variations = createShakespeareVariations(playTitle);
        let found = false;
        
        shakespeareBooks.forEach(book => {
            variations.forEach(variation => {
                if (normalizeTitle(variation) === normalizeTitle(book.title)) {
                    enhancements.push({
                        wikiTitle: playTitle,
                        wikiUrl: `https://en.wikipedia.org/wiki/${playTitle.replace(/\s+/g, '_')}`,
                        gutenbergTitle: book.title,
                        gutenbergId: book.id,
                        gutenbergAuthors: book.authors,
                        gutenbergLanguage: book.language,
                        matchType: 'shakespeare-enhanced',
                        normalizedTitle: normalizeTitle(variation),
                        variation: variation
                    });
                    found = true;
                }
            });
        });
        
        if (!found) {
            console.log(`  Missing: "${playTitle}"`);
        }
    });
    
    console.log(`Found ${enhancements.length} Shakespeare enhancements`);
    return enhancements;
}

function findPlatoEnhancements(wikiData, gutenbergBooks) {
    console.log('\nEnhancing Plato works...');
    
    const platoWorks = [
        'The Republic', 'Apology', 'Phaedo', 'Phaedrus', 'Symposium', 'Timaeus', 'Critias',
        'Laws', 'Meno', 'Gorgias', 'Parmenides', 'Theaetetus', 'Sophist', 'Statesman',
        'Protagoras', 'Euthyphro', 'Crito', 'Ion', 'Laches', 'Charmides', 'Lysis',
        'Euthydemus', 'Cratylus', 'Philebus', 'Menexenus', 'Alcibiades I', 'Alcibiades II',
        'Eryxias', 'Lesser Hippias', 'Hippias Major', 'Hippias Minor', 'Theages', 'Clitophon',
        'Minos', 'The Rivals', 'Seventh Letter', 'First Letter', 'Second Letter', 'Third Letter',
        'Fourth Letter', 'Fifth Letter', 'Sixth Letter', 'Eighth Letter', 'Ninth Letter',
        'Tenth Letter', 'Eleventh Letter', 'Twelfth Letter', 'Thirteenth Letter'
    ];
    
    const platoBooks = gutenbergBooks.filter(book => 
        book.authors && (
            book.authors.toLowerCase().includes('plato') ||
            book.authors.toLowerCase().includes('platon') ||
            book.authors.toLowerCase().includes('platonis')
        )
    );
    
    console.log(`Found ${platoBooks.length} Plato works in Gutenberg`);
    
    const enhancements = [];
    
    platoWorks.forEach(workTitle => {
        const variations = createPlatoVariations(workTitle);
        let found = false;
        
        platoBooks.forEach(book => {
            variations.forEach(variation => {
                if (normalizeTitle(variation) === normalizeTitle(book.title)) {
                    enhancements.push({
                        wikiTitle: workTitle,
                        wikiUrl: `https://en.wikipedia.org/wiki/${workTitle.replace(/\s+/g, '_')}`,
                        gutenbergTitle: book.title,
                        gutenbergId: book.id,
                        gutenbergAuthors: book.authors,
                        gutenbergLanguage: book.language,
                        matchType: 'plato-enhanced',
                        normalizedTitle: normalizeTitle(variation),
                        variation: variation
                    });
                    found = true;
                }
            });
        });
        
        if (!found) {
            console.log(`  Missing: "${workTitle}"`);
        }
    });
    
    console.log(`Found ${enhancements.length} Plato enhancements`);
    return enhancements;
}

function createCorrectedLibrary(baseMatches, shakespeareEnhancements, platoEnhancements) {
    console.log('\nCreating corrected library with proper Wikipedia links...');
    
    // Start with base matches
    const allMatches = [...baseMatches.matches];
    
    // Add Shakespeare enhancements (avoiding duplicates)
    const existingShakespeareIds = new Set(
        allMatches.filter(m => m.gutenbergAuthors && m.gutenbergAuthors.toLowerCase().includes('shakespeare'))
                  .map(m => m.gutenbergId)
    );
    
    const newShakespeareMatches = shakespeareEnhancements.filter(enhancement => 
        !existingShakespeareIds.has(enhancement.gutenbergId)
    );
    
    console.log(`Adding ${newShakespeareMatches.length} new Shakespeare matches`);
    allMatches.push(...newShakespeareMatches);
    
    // Add Plato enhancements (avoiding duplicates)
    const existingPlatoIds = new Set(
        allMatches.filter(m => m.gutenbergAuthors && m.gutenbergAuthors.toLowerCase().includes('plato'))
                  .map(m => m.gutenbergId)
    );
    
    const newPlatoMatches = platoEnhancements.filter(enhancement => 
        !existingPlatoIds.has(enhancement.gutenbergId)
    );
    
    console.log(`Adding ${newPlatoMatches.length} new Plato matches`);
    allMatches.push(...newPlatoMatches);
    
    // Group by Wikipedia title and select lowest Gutenberg ID
    const matchesByWikiTitle = new Map();
    
    allMatches.forEach(match => {
        const wikiTitle = match.wikiTitle;
        
        if (!matchesByWikiTitle.has(wikiTitle)) {
            matchesByWikiTitle.set(wikiTitle, []);
        }
        
        matchesByWikiTitle.get(wikiTitle).push(match);
    });
    
    const candidateLibrary = [];
    
    matchesByWikiTitle.forEach((matches, wikiTitle) => {
        const sortedMatches = matches.sort((a, b) => {
            const idA = parseInt(a.gutenbergId) || 999999;
            const idB = parseInt(b.gutenbergId) || 999999;
            return idA - idB;
        });
        
        const selectedMatch = sortedMatches[0];
        
        candidateLibrary.push({
            title: selectedMatch.gutenbergTitle,
            author: selectedMatch.gutenbergAuthors,
            gutenbergId: selectedMatch.gutenbergId,
            language: selectedMatch.gutenbergLanguage,
            wikipediaTitle: selectedMatch.wikiTitle,
            wikipediaUrl: selectedMatch.wikiUrl,
            matchType: selectedMatch.matchType,
            category: determineCategory(selectedMatch),
            description: generateDescription(selectedMatch)
        });
    });
    
    candidateLibrary.sort((a, b) => a.title.localeCompare(b.title));
    
    return candidateLibrary;
}

function determineCategory(match) {
    const title = match.gutenbergTitle.toLowerCase();
    const authors = match.gutenbergAuthors.toLowerCase();
    
    if (authors.includes('shakespeare')) {
        return 'Shakespeare';
    } else if (authors.includes('plato')) {
        return 'Philosophy';
    } else if (title.includes('poem') || title.includes('poetry')) {
        return 'Poetry';
    } else if (title.includes('history')) {
        return 'History';
    } else if (title.includes('science') || title.includes('philosophy')) {
        return 'Philosophy';
    } else if (title.includes('novel') || title.includes('story')) {
        return 'Literature';
    } else {
        return 'Literature';
    }
}

function generateDescription(match) {
    const title = match.gutenbergTitle;
    const author = match.gutenbergAuthors;
    
    if (match.matchType === 'shakespeare-enhanced') {
        return `A play by William Shakespeare. ${title} is one of Shakespeare's most famous works, available in the public domain through Project Gutenberg.`;
    } else if (match.matchType === 'plato-enhanced') {
        return `A philosophical dialogue by Plato. ${title} explores fundamental questions of philosophy and remains a cornerstone of Western thought.`;
    } else {
        return `${title} by ${author}. This classic work is available in the public domain through Project Gutenberg.`;
    }
}

function main() {
    try {
        const { baseMatches, wikiData, gutenbergBooks } = loadData();
        
        const shakespeareEnhancements = findShakespeareEnhancements(wikiData, gutenbergBooks);
        const platoEnhancements = findPlatoEnhancements(wikiData, gutenbergBooks);
        
        const candidateLibrary = createCorrectedLibrary(baseMatches, shakespeareEnhancements, platoEnhancements);
        
        console.log(`\n=== CORRECTED LIBRARY RESULTS ===`);
        console.log(`Total books: ${candidateLibrary.length}`);
        
        // Check Wikipedia links
        const withWikiLinks = candidateLibrary.filter(book => book.wikipediaUrl);
        const withoutWikiLinks = candidateLibrary.filter(book => !book.wikipediaUrl);
        
        console.log(`Books with Wikipedia links: ${withWikiLinks.length}`);
        console.log(`Books without Wikipedia links: ${withoutWikiLinks.length}`);
        
        if (withoutWikiLinks.length > 0) {
            console.log('\nBooks missing Wikipedia links:');
            withoutWikiLinks.slice(0, 10).forEach(book => {
                console.log(`  "${book.title}" by ${book.author}`);
            });
        }
        
        // Save corrected library
        const libraryData = {
            name: "Corrected Enhanced Wikipedia-Gutenberg Library",
            description: "A comprehensive library with proper Wikipedia links and corrected data",
            totalBooks: candidateLibrary.length,
            lastUpdated: new Date().toISOString(),
            sources: [
                "Wikipedia articles with Project Gutenberg links",
                "Project Gutenberg catalog (corrected parsing)",
                "Enhanced matching for Shakespeare and Plato works"
            ],
            books: candidateLibrary
        };
        
        fs.writeFileSync('corrected-candidate-library.json', JSON.stringify(libraryData, null, 2));
        console.log('\nCorrected library saved to: corrected-candidate-library.json');
        
        // Show some examples with Wikipedia links
        console.log('\n=== SAMPLE BOOKS WITH WIKIPEDIA LINKS ===');
        withWikiLinks.slice(0, 10).forEach(book => {
            console.log(`"${book.title}" by ${book.author} [ID: ${book.gutenbergId}]`);
            console.log(`  Wikipedia: ${book.wikipediaUrl}`);
        });
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createCorrectedLibrary, determineCategory, generateDescription };
