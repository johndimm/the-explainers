#!/usr/bin/env node

const fs = require('fs');

function loadData() {
    console.log('Loading data for comprehensive fuzzy matching...');
    
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

function createTitleVariations(title) {
    const variations = [title];
    const titleLower = title.toLowerCase();
    
    // Remove common prefixes
    if (titleLower.startsWith('the ')) {
        variations.push(title.substring(4));
    }
    if (titleLower.startsWith('a ')) {
        variations.push(title.substring(2));
    }
    if (titleLower.startsWith('an ')) {
        variations.push(title.substring(3));
    }
    
    // Add common prefixes
    if (!titleLower.startsWith('the ') && !titleLower.startsWith('a ') && !titleLower.startsWith('an ')) {
        variations.push(`The ${title}`);
    }
    
    // Remove common suffixes
    const suffixesToRemove = [
        ' (book)', ' (novel)', ' (play)', ' (poem)', ' (work)', ' (text)',
        ' (dialogue)', ' (treatise)', ' (essay)', ' (collection)',
        ' by ', ' - ', ' -- '
    ];
    
    suffixesToRemove.forEach(suffix => {
        if (titleLower.includes(suffix)) {
            variations.push(title.replace(new RegExp(suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ''));
        }
    });
    
    // Handle Roman/Arabic numerals
    const romanToArabic = { 'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10' };
    const arabicToRoman = { '1': 'i', '2': 'ii', '3': 'iii', '4': 'iv', '5': 'v', '6': 'vi', '7': 'vii', '8': 'viii', '9': 'ix', '10': 'x' };
    
    for (const [roman, arabic] of Object.entries(romanToArabic)) {
        if (titleLower.includes(` part ${roman}`)) {
            variations.push(title.replace(new RegExp(` part ${roman}`, 'gi'), ` part ${arabic}`));
            variations.push(title.replace(new RegExp(` part ${roman}`, 'gi'), ` ${arabic}`));
        }
        if (titleLower.includes(` part ${arabic}`)) {
            variations.push(title.replace(new RegExp(` part ${arabic}`, 'gi'), ` part ${roman}`));
            variations.push(title.replace(new RegExp(` part ${arabic}`, 'gi'), ` ${roman}`));
        }
    }
    
    // Handle punctuation variations
    if (title.includes("'")) {
        variations.push(title.replace(/'/g, "'"));
        variations.push(title.replace(/'/g, ""));
    }
    
    return [...new Set(variations)]; // Remove duplicates
}

function calculateSimilarity(str1, str2) {
    const s1 = normalizeTitle(str1);
    const s2 = normalizeTitle(str2);
    
    if (s1 === s2) return 1.0;
    
    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
        return 0.8;
    }
    
    // Simple word overlap similarity
    const words1 = s1.split(' ');
    const words2 = s2.split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
}

function findFuzzyMatches(wikiData, gutenbergBooks) {
    console.log('\nFinding fuzzy matches...');
    
    const matches = [];
    const processed = new Set();
    
    wikiData.articles.forEach((wikiArticle, index) => {
        if (index % 1000 === 0) {
            console.log(`Processing article ${index + 1}/${wikiData.articles.length}: "${wikiArticle.title}"`);
        }
        
        const wikiTitle = wikiArticle.title;
        const variations = createTitleVariations(wikiTitle);
        
        let bestMatch = null;
        let bestSimilarity = 0;
        
        // Try exact matches first
        for (const variation of variations) {
            const normalizedVariation = normalizeTitle(variation);
            
            gutenbergBooks.forEach(book => {
                const normalizedBookTitle = normalizeTitle(book.title);
                
                if (normalizedVariation === normalizedBookTitle) {
                    const matchKey = `${wikiTitle}|||${book.id}`;
                    if (!processed.has(matchKey)) {
                        matches.push({
                            wikiTitle: wikiTitle,
                            wikiUrl: wikiArticle.wikipediaUrl,
                            gutenbergTitle: book.title,
                            gutenbergId: book.id,
                            gutenbergAuthors: book.authors,
                            gutenbergLanguage: book.language,
                            matchType: 'exact',
                            similarity: 1.0,
                            variation: variation
                        });
                        processed.add(matchKey);
                    }
                }
            });
        }
        
        // Try fuzzy matches if no exact match found
        if (!processed.has(`${wikiTitle}|||exact`)) {
            gutenbergBooks.forEach(book => {
                const similarity = calculateSimilarity(wikiTitle, book.title);
                
                if (similarity >= 0.7 && similarity > bestSimilarity) {
                    bestMatch = book;
                    bestSimilarity = similarity;
                }
            });
            
            if (bestMatch && bestSimilarity >= 0.7) {
                const matchKey = `${wikiTitle}|||${bestMatch.id}`;
                if (!processed.has(matchKey)) {
                    matches.push({
                        wikiTitle: wikiTitle,
                        wikiUrl: wikiArticle.wikipediaUrl,
                        gutenbergTitle: bestMatch.title,
                        gutenbergId: bestMatch.id,
                        gutenbergAuthors: bestMatch.authors,
                        gutenbergLanguage: bestMatch.language,
                        matchType: 'fuzzy',
                        similarity: bestSimilarity,
                        variation: null
                    });
                    processed.add(matchKey);
                }
            }
        }
    });
    
    return matches;
}

function main() {
    try {
        const { wikiData, gutenbergBooks } = loadData();
        
        const matches = findFuzzyMatches(wikiData, gutenbergBooks);
        
        console.log(`\n=== COMPREHENSIVE FUZZY MATCH RESULTS ===`);
        console.log(`Total matches found: ${matches.length}`);
        
        const exactMatches = matches.filter(m => m.matchType === 'exact');
        const fuzzyMatches = matches.filter(m => m.matchType === 'fuzzy');
        
        console.log(`Exact matches: ${exactMatches.length}`);
        console.log(`Fuzzy matches: ${fuzzyMatches.length}`);
        
        // Save results
        const results = {
            analysisDate: new Date().toISOString(),
            statistics: {
                totalWikiArticles: wikiData.articles.length,
                totalGutenbergBooks: gutenbergBooks.length,
                totalMatches: matches.length,
                exactMatches: exactMatches.length,
                fuzzyMatches: fuzzyMatches.length,
                matchRate: ((matches.length / wikiData.articles.length) * 100).toFixed(2) + '%'
            },
            matches: matches
        };
        
        fs.writeFileSync('comprehensive-fuzzy-matches.json', JSON.stringify(results, null, 2));
        console.log('\nResults saved to: comprehensive-fuzzy-matches.json');
        
        // Show some examples
        console.log('\n=== SAMPLE MATCHES ===');
        matches.slice(0, 10).forEach(match => {
            console.log(`${match.matchType.toUpperCase()}: "${match.wikiTitle}" → "${match.gutenbergTitle}" [ID: ${match.gutenbergId}] (${(match.similarity * 100).toFixed(1)}%)`);
        });
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createTitleVariations, calculateSimilarity, findFuzzyMatches };
