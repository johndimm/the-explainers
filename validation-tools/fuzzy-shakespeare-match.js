#!/usr/bin/env node

const fs = require('fs');

function loadData() {
    console.log('Loading data for fuzzy Shakespeare matching...');
    
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
    
    // Convert Roman numerals to Arabic and vice versa
    const romanToArabic = {
        'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5',
        'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10'
    };
    
    const arabicToRoman = {
        '1': 'i', '2': 'ii', '3': 'iii', '4': 'iv', '5': 'v',
        '6': 'vi', '7': 'vii', '8': 'viii', '9': 'ix', '10': 'x'
    };
    
    // Create variations for Henry plays
    if (title.toLowerCase().includes('henry')) {
        const titleLower = title.toLowerCase();
        
        // Try different number formats
        for (const [roman, arabic] of Object.entries(romanToArabic)) {
            if (titleLower.includes(`part ${roman}`)) {
                variations.push(title.replace(new RegExp(`part ${roman}`, 'gi'), `part ${arabic}`));
                variations.push(title.replace(new RegExp(`part ${roman}`, 'gi'), `${arabic}`));
            }
            if (titleLower.includes(`part ${arabic}`)) {
                variations.push(title.replace(new RegExp(`part ${arabic}`, 'gi'), `part ${roman}`));
                variations.push(title.replace(new RegExp(`part ${arabic}`, 'gi'), `${roman}`));
            }
        }
        
        // Try without "King" prefix
        if (titleLower.startsWith('king ')) {
            variations.push(title.replace(/^king\s+/i, ''));
        }
        
        // Try with "King" prefix
        if (!titleLower.startsWith('king ')) {
            variations.push(`King ${title}`);
        }
    }
    
    // Create variations for Richard plays
    if (title.toLowerCase().includes('richard')) {
        const titleLower = title.toLowerCase();
        
        for (const [roman, arabic] of Object.entries(romanToArabic)) {
            if (titleLower.includes(roman)) {
                variations.push(title.replace(new RegExp(roman, 'gi'), arabic));
            }
            if (titleLower.includes(arabic)) {
                variations.push(title.replace(new RegExp(arabic, 'gi'), roman));
            }
        }
        
        if (titleLower.startsWith('king ')) {
            variations.push(title.replace(/^king\s+/i, ''));
        }
        if (!titleLower.startsWith('king ')) {
            variations.push(`King ${title}`);
        }
    }
    
    // Create variations for other plays
    const titleLower = title.toLowerCase();
    
    // Try without "The" prefix
    if (titleLower.startsWith('the ')) {
        variations.push(title.replace(/^the\s+/i, ''));
    }
    
    // Try with "The" prefix
    if (!titleLower.startsWith('the ')) {
        variations.push(`The ${title}`);
    }
    
    return [...new Set(variations)]; // Remove duplicates
}

function findFuzzyMatches(wikiData, gutenbergBooks, targetPlays) {
    console.log('\nFinding fuzzy matches for Shakespeare history plays...');
    
    // Filter Gutenberg books to only Shakespeare works
    const shakespeareBooks = gutenbergBooks.filter(book => 
        book.authors && book.authors.includes('Shakespeare, William, 1564-1616')
    );
    
    console.log(`Found ${shakespeareBooks.length} Shakespeare works in Gutenberg`);
    
    const matches = [];
    
    targetPlays.forEach(play => {
        console.log(`\nSearching for: "${play}"`);
        
        // Create title variations
        const variations = createVariations(play);
        console.log(`  Variations: ${variations.map(v => `"${v}"`).join(', ')}`);
        
        // Find matches in Gutenberg
        const foundMatches = [];
        
        shakespeareBooks.forEach(book => {
            const bookTitleNormalized = normalizeTitle(book.title);
            
            variations.forEach(variation => {
                const variationNormalized = normalizeTitle(variation);
                
                if (bookTitleNormalized === variationNormalized) {
                    foundMatches.push({
                        targetPlay: play,
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
            const closeMatches = shakespeareBooks.filter(book => {
                const bookTitleLower = book.title.toLowerCase();
                const playLower = play.toLowerCase();
                
                return bookTitleLower.includes('henry') && playLower.includes('henry') ||
                       bookTitleLower.includes('richard') && playLower.includes('richard') ||
                       bookTitleLower.includes('john') && playLower.includes('john');
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
        
        // Focus on the missing history plays
        const missingHistoryPlays = [
            'King John',
            'King Richard II', 
            'King Henry IV, Part 1',
            'King Henry IV, Part 2',
            'King Henry V',
            'King Henry VI, Part 1',
            'King Henry VI, Part 2', 
            'King Henry VI, Part 3',
            'King Richard III',
            'King Henry VIII',
            'Coriolanus',
            'King Lear',
            'Timon of Athens',
            'Cymbeline',
            'Pericles',
            'The Taming of the Shrew',
            'Sonnets',
            'Venus and Adonis'
        ];
        
        const matches = findFuzzyMatches(wikiData, gutenbergBooks, missingHistoryPlays);
        
        console.log(`\n=== FUZZY MATCH RESULTS ===`);
        console.log(`Total matches found: ${matches.length}`);
        
        if (matches.length > 0) {
            console.log('\nFound matches:');
            matches.forEach(match => {
                console.log(`✓ "${match.targetPlay}" → "${match.gutenbergTitle}" [ID: ${match.gutenbergId}]`);
            });
        }
        
        // Save results
        const results = {
            analysisDate: new Date().toISOString(),
            targetPlays: missingHistoryPlays,
            matches: matches,
            statistics: {
                totalTargetPlays: missingHistoryPlays.length,
                matchesFound: matches.length,
                successRate: ((matches.length / missingHistoryPlays.length) * 100).toFixed(2) + '%'
            }
        };
        
        fs.writeFileSync('fuzzy-shakespeare-matches.json', JSON.stringify(results, null, 2));
        console.log('\nResults saved to: fuzzy-shakespeare-matches.json');
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createVariations, findFuzzyMatches, normalizeTitle };
