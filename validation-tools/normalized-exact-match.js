#!/usr/bin/env node

const fs = require('fs');

function loadData() {
    console.log('Loading data for normalized exact matching...');
    
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
    if (!title) return '';
    
    return title
        .toLowerCase()
        .trim()
        // Remove common prefixes
        .replace(/^(the|a|an)\s+/g, '')
        // Remove common suffixes in parentheses
        .replace(/\s*\((book|novel|play|poem|work|text|dialogue|treatise|essay|collection|plato|shakespeare)\)\s*$/g, '')
        // Remove other common suffixes
        .replace(/\s*(by\s+[^,]+|--\s*[^,]+|-.*)$/g, '')
        // Normalize punctuation
        .replace(/[''`]/g, "'")
        .replace(/[""]/g, '"')
        .replace(/[^\w\s]/g, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

function createNormalizedVariations(title) {
    const variations = new Set();
    const normalized = normalizeTitle(title);
    
    if (normalized) {
        variations.add(normalized);
    }
    
    // Add original normalized
    variations.add(normalizeTitle(title));
    
    // Add with "the" prefix
    variations.add(normalizeTitle(`The ${title}`));
    
    // Add without "the" prefix (already handled by normalizeTitle)
    
    // Handle Roman/Arabic numerals
    const romanToArabic = { 'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10' };
    const arabicToRoman = { '1': 'i', '2': 'ii', '3': 'iii', '4': 'iv', '5': 'v', '6': 'vi', '7': 'vii', '8': 'viii', '9': 'ix', '10': 'x' };
    
    for (const [roman, arabic] of Object.entries(romanToArabic)) {
        if (title.toLowerCase().includes(` part ${roman}`)) {
            variations.add(normalizeTitle(title.replace(new RegExp(` part ${roman}`, 'gi'), ` part ${arabic}`)));
            variations.add(normalizeTitle(title.replace(new RegExp(` part ${roman}`, 'gi'), ` ${arabic}`)));
        }
        if (title.toLowerCase().includes(` part ${arabic}`)) {
            variations.add(normalizeTitle(title.replace(new RegExp(` part ${arabic}`, 'gi'), ` part ${roman}`)));
            variations.add(normalizeTitle(title.replace(new RegExp(` part ${arabic}`, 'gi'), ` ${roman}`)));
        }
    }
    
    return Array.from(variations).filter(v => v && v.length > 0);
}

function findNormalizedMatches(wikiData, gutenbergBooks) {
    console.log('\nCreating normalized title maps...');
    
    // Create normalized title map for Gutenberg books
    const gutenbergMap = new Map();
    gutenbergBooks.forEach(book => {
        if (book.title && book.title.trim()) {
            const normalized = normalizeTitle(book.title);
            if (normalized) {
                if (!gutenbergMap.has(normalized)) {
                    gutenbergMap.set(normalized, []);
                }
                gutenbergMap.get(normalized).push(book);
            }
        }
    });
    
    console.log(`Created Gutenberg map with ${gutenbergMap.size} unique normalized titles`);
    
    // Find matches
    const matches = [];
    let processed = 0;
    
    console.log('\nFinding matches...');
    
    wikiData.articles.forEach(wikiArticle => {
        processed++;
        if (processed % 1000 === 0) {
            console.log(`Processed ${processed}/${wikiData.articles.length} articles`);
        }
        
        const wikiTitle = wikiArticle.title;
        const variations = createNormalizedVariations(wikiTitle);
        
        let foundMatch = false;
        
        for (const variation of variations) {
            if (gutenbergMap.has(variation)) {
                gutenbergMap.get(variation).forEach(gutenbergBook => {
                    matches.push({
                        wikiTitle: wikiTitle,
                        wikiUrl: wikiArticle.wikipediaUrl,
                        gutenbergTitle: gutenbergBook.title,
                        gutenbergId: gutenbergBook.id,
                        gutenbergAuthors: gutenbergBook.authors,
                        gutenbergLanguage: gutenbergBook.language,
                        normalizedTitle: variation,
                        matchType: 'normalized-exact'
                    });
                });
                foundMatch = true;
                break; // Found match, no need to check other variations
            }
        }
    });
    
    return matches;
}

function main() {
    try {
        const { wikiData, gutenbergBooks } = loadData();
        
        const matches = findNormalizedMatches(wikiData, gutenbergBooks);
        
        console.log(`\n=== NORMALIZED EXACT MATCH RESULTS ===`);
        console.log(`Total matches found: ${matches.length}`);
        console.log(`Match rate: ${((matches.length / wikiData.articles.length) * 100).toFixed(2)}%`);
        
        // Save results
        const results = {
            analysisDate: new Date().toISOString(),
            statistics: {
                totalWikiArticles: wikiData.articles.length,
                totalGutenbergBooks: gutenbergBooks.length,
                totalMatches: matches.length,
                matchRate: ((matches.length / wikiData.articles.length) * 100).toFixed(2) + '%'
            },
            matches: matches
        };
        
        fs.writeFileSync('normalized-exact-matches.json', JSON.stringify(results, null, 2));
        console.log('\nResults saved to: normalized-exact-matches.json');
        
        // Show some examples
        console.log('\n=== SAMPLE MATCHES ===');
        matches.slice(0, 15).forEach(match => {
            console.log(`"${match.wikiTitle}" → "${match.gutenbergTitle}" [ID: ${match.gutenbergId}]`);
        });
        
        // Show some statistics
        const uniqueWikiTitles = new Set(matches.map(m => m.wikiTitle)).size;
        const uniqueGutenbergIds = new Set(matches.map(m => m.gutenbergId)).size;
        
        console.log(`\n=== STATISTICS ===`);
        console.log(`Unique Wikipedia titles matched: ${uniqueWikiTitles}`);
        console.log(`Unique Gutenberg books matched: ${uniqueGutenbergIds}`);
        console.log(`Average matches per Wikipedia title: ${(matches.length / uniqueWikiTitles).toFixed(2)}`);
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { normalizeTitle, createNormalizedVariations, findNormalizedMatches };
