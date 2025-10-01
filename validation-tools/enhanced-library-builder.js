#!/usr/bin/env node

const fs = require('fs');

function loadData() {
    console.log('Loading data for enhanced library building...');
    
    // Load base normalized matches
    const baseMatches = JSON.parse(fs.readFileSync('normalized-exact-matches.json', 'utf8'));
    console.log(`Loaded ${baseMatches.matches.length} base normalized matches`);
    
    // Load Wikipedia articles
    const wikiData = JSON.parse(fs.readFileSync('wiki-gutenberg-raw-list.json', 'utf8'));
    console.log(`Loaded ${wikiData.articles.length} Wikipedia articles`);
    
    // Parse Gutenberg CSV correctly
    const csvData = fs.readFileSync('gutenberg-catalog-raw.csv', 'utf8');
    const gutenbergBooks = parseCSVCorrectly(csvData);
    console.log(`Loaded ${gutenbergBooks.length} Gutenberg books`);
    
    return { baseMatches, wikiData, gutenbergBooks };
}

function parseCSVCorrectly(csvText) {
    const lines = csvText.split('\n');
    const books = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const fields = parseCSVLine(line);
            
            if (fields.length >= 6) {
                books.push({
                    id: fields[0],
                    type: fields[1],
                    issued: fields[2],
                    title: fields[3],
                    language: fields[4],
                    authors: fields[5],
                    subjects: fields[6] || '',
                    locc: fields[7] || '',
                    bookshelves: fields[8] || ''
                });
            }
        }
    }
    
    return books;
}

function parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    fields.push(currentField.trim());
    
    return fields;
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
    
    // Add original
    variations.add(title);
    variations.add(normalizeTitle(title));
    
    // Handle "King" prefix variations
    if (title.startsWith("King ")) {
        variations.add(title.substring(5)); // "Richard II" from "King Richard II"
        variations.add(normalizeTitle(title.substring(5)));
    } else {
        variations.add(`King ${title}`);
        variations.add(normalizeTitle(`King ${title}`));
    }
    
    // Handle Roman/Arabic numerals
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
    
    // Add original
    variations.add(title);
    variations.add(normalizeTitle(title));
    
    // Handle "The" prefix
    if (title.startsWith("The ")) {
        variations.add(title.substring(4));
        variations.add(normalizeTitle(title.substring(4)));
    } else {
        variations.add(`The ${title}`);
        variations.add(normalizeTitle(`The ${title}`));
    }
    
    // Handle dialogue suffix
    if (!title.includes("(dialogue)")) {
        variations.add(`${title} (dialogue)`);
        variations.add(normalizeTitle(`${title} (dialogue)`));
    }
    
    // Handle Roman/Arabic numerals for letters
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

function buildEnhancedLibrary(baseMatches, shakespeareEnhancements, platoEnhancements) {
    console.log('\nBuilding enhanced library...');
    
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
    
    return allMatches;
}

function main() {
    try {
        const { baseMatches, wikiData, gutenbergBooks } = loadData();
        
        // Find enhancements
        const shakespeareEnhancements = findShakespeareEnhancements(wikiData, gutenbergBooks);
        const platoEnhancements = findPlatoEnhancements(wikiData, gutenbergBooks);
        
        // Build enhanced library
        const enhancedMatches = buildEnhancedLibrary(baseMatches, shakespeareEnhancements, platoEnhancements);
        
        console.log(`\n=== ENHANCED LIBRARY RESULTS ===`);
        console.log(`Base matches: ${baseMatches.matches.length}`);
        console.log(`Shakespeare enhancements: ${shakespeareEnhancements.length}`);
        console.log(`Plato enhancements: ${platoEnhancements.length}`);
        console.log(`Total enhanced matches: ${enhancedMatches.length}`);
        
        // Save enhanced library
        const enhancedLibrary = {
            analysisDate: new Date().toISOString(),
            statistics: {
                baseMatches: baseMatches.matches.length,
                shakespeareEnhancements: shakespeareEnhancements.length,
                platoEnhancements: platoEnhancements.length,
                totalMatches: enhancedMatches.length,
                improvement: enhancedMatches.length - baseMatches.matches.length
            },
            matches: enhancedMatches
        };
        
        fs.writeFileSync('enhanced-library.json', JSON.stringify(enhancedLibrary, null, 2));
        console.log('\nEnhanced library saved to: enhanced-library.json');
        
        // Show some examples
        console.log('\n=== SAMPLE ENHANCED MATCHES ===');
        enhancedMatches.slice(-10).forEach(match => {
            console.log(`${match.matchType}: "${match.wikiTitle}" → "${match.gutenbergTitle}" [ID: ${match.gutenbergId}]`);
        });
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createShakespeareVariations, createPlatoVariations, findShakespeareEnhancements, findPlatoEnhancements };
