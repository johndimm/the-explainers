#!/usr/bin/env node

const fs = require('fs');

function loadData() {
    console.log('Loading data for fuzzy Plato matching...');
    
    // Load Wikipedia articles
    const wikiData = JSON.parse(fs.readFileSync('wiki-gutenberg-raw-list.json', 'utf8'));
    console.log(`Loaded ${wikiData.articles.length} Wikipedia articles`);
    
    // Parse Gutenberg CSV correctly
    const csvData = fs.readFileSync('gutenberg-catalog-raw.csv', 'utf8');
    const gutenbergBooks = parseCSVCorrectly(csvData);
    console.log(`Loaded ${gutenbergBooks.length} Gutenberg books`);
    
    return { wikiData, gutenbergBooks };
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
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ');   // Normalize whitespace
}

function createVariations(title) {
    const variations = [title];
    
    // Create variations for Plato dialogues
    const titleLower = title.toLowerCase();
    
    // Try without "The" prefix
    if (titleLower.startsWith('the ')) {
        variations.push(title.replace(/^the\s+/i, ''));
    }
    
    // Try with "The" prefix
    if (!titleLower.startsWith('the ')) {
        variations.push(`The ${title}`);
    }
    
    // Try without "dialogue" suffix
    if (titleLower.includes('(dialogue)')) {
        variations.push(title.replace(/\s*\(dialogue\)/gi, ''));
    }
    
    // Try with "dialogue" suffix
    if (!titleLower.includes('(dialogue)')) {
        variations.push(`${title} (dialogue)`);
    }
    
    // Try without "Plato" suffix
    if (titleLower.includes('(plato)')) {
        variations.push(title.replace(/\s*\(plato\)/gi, ''));
    }
    
    // Try with "Plato" suffix
    if (!titleLower.includes('(plato)')) {
        variations.push(`${title} (Plato)`);
    }
    
    // Try different punctuation styles
    if (titleLower.includes("'")) {
        variations.push(title.replace(/'/g, "'"));
        variations.push(title.replace(/'/g, ""));
    }
    
    // Try without commas
    if (title.includes(',')) {
        variations.push(title.replace(/,/g, ''));
    }
    
    return [...new Set(variations)]; // Remove duplicates
}

function getPlatoWorks() {
    // Complete list of Plato works
    return [
        // Major dialogues
        'The Republic',
        'Apology',
        'Phaedo',
        'Phaedrus',
        'Symposium',
        'Timaeus',
        'Critias',
        'Laws',
        'Meno',
        'Gorgias',
        'Parmenides',
        'Theaetetus',
        'Sophist',
        'Statesman',
        'Protagoras',
        'Euthyphro',
        'Crito',
        'Ion',
        'Laches',
        'Charmides',
        'Lysis',
        'Euthydemus',
        'Cratylus',
        'Philebus',
        'Second Alcibiades',
        'Menexenus',
        'Minos',
        
        // Letters
        'Seventh Letter',
        'First Letter',
        'Second Letter',
        'Third Letter',
        'Fourth Letter',
        'Fifth Letter',
        'Sixth Letter',
        'Eighth Letter',
        'Ninth Letter',
        'Tenth Letter',
        'Eleventh Letter',
        'Twelfth Letter',
        'Thirteenth Letter',
        
        // Spurious works
        'Alcibiades I',
        'Alcibiades II',
        'Hipparchus',
        'Theages',
        'Eryxias',
        'Clitophon',
        'Hippias Major',
        'Hippias Minor',
        'The Rivals'
    ];
}

function findFuzzyMatches(wikiData, gutenbergBooks, targetWorks) {
    console.log('\nFinding fuzzy matches for Plato works...');
    
    // Filter Gutenberg books to only Plato works
    const platoBooks = gutenbergBooks.filter(book => 
        book.authors && (
            book.authors.includes('Plato') ||
            book.authors.includes('Platon') ||
            book.authors.includes('Platonis')
        )
    );
    
    console.log(`Found ${platoBooks.length} Plato works in Gutenberg`);
    
    const matches = [];
    
    targetWorks.forEach(work => {
        console.log(`\nSearching for: "${work}"`);
        
        // Create title variations
        const variations = createVariations(work);
        console.log(`  Variations: ${variations.map(v => `"${v}"`).join(', ')}`);
        
        // Find matches in Gutenberg
        const foundMatches = [];
        
        platoBooks.forEach(book => {
            const bookTitleNormalized = normalizeTitle(book.title);
            
            variations.forEach(variation => {
                const variationNormalized = normalizeTitle(variation);
                
                if (bookTitleNormalized === variationNormalized) {
                    foundMatches.push({
                        targetWork: work,
                        variation: variation,
                        gutenbergTitle: book.title,
                        gutenbergId: book.id,
                        gutenbergAuthors: book.authors,
                        gutenbergLanguage: book.language,
                        matchType: 'exact'
                    });
                }
            });
        });
        
        if (foundMatches.length > 0) {
            console.log(`  ✓ Found ${foundMatches.length} match(es):`);
            foundMatches.forEach(match => {
                console.log(`    - "${match.gutenbergTitle}" [ID: ${match.gutenbergId}]`);
            });
            matches.push(...foundMatches);
        } else {
            console.log(`  ✗ No matches found`);
            
            // Show close matches for debugging
            const closeMatches = platoBooks.filter(book => {
                const bookTitleLower = book.title.toLowerCase();
                const workLower = work.toLowerCase();
                
                // Look for partial matches
                return bookTitleLower.includes(workLower.split(' ')[0]) ||
                       workLower.includes(bookTitleLower.split(' ')[0]);
            }).slice(0, 3);
            
            if (closeMatches.length > 0) {
                console.log(`  Close matches:`);
                closeMatches.forEach(book => {
                    console.log(`    - "${book.title}" [ID: ${book.id}]`);
                });
            }
        }
    });
    
    return matches;
}

function main() {
    try {
        const { wikiData, gutenbergBooks } = loadData();
        
        // Get all Plato works
        const platoWorks = getPlatoWorks();
        
        const matches = findFuzzyMatches(wikiData, gutenbergBooks, platoWorks);
        
        console.log(`\n=== FUZZY PLATO MATCH RESULTS ===`);
        console.log(`Total matches found: ${matches.length}`);
        
        if (matches.length > 0) {
            console.log('\nFound matches:');
            matches.forEach(match => {
                console.log(`✓ "${match.targetWork}" → "${match.gutenbergTitle}" [ID: ${match.gutenbergId}]`);
            });
        }
        
        // Save results
        const results = {
            analysisDate: new Date().toISOString(),
            targetWorks: platoWorks,
            matches: matches,
            statistics: {
                totalTargetWorks: platoWorks.length,
                matchesFound: matches.length,
                successRate: ((matches.length / platoWorks.length) * 100).toFixed(2) + '%'
            }
        };
        
        fs.writeFileSync('fuzzy-plato-matches.json', JSON.stringify(results, null, 2));
        console.log('\nResults saved to: fuzzy-plato-matches.json');
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createVariations, findFuzzyMatches, normalizeTitle, getPlatoWorks };
