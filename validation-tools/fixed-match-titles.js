#!/usr/bin/env node

const fs = require('fs');

function loadData() {
    console.log('Loading Wikipedia articles and Gutenberg catalog...');
    
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
    console.log('Parsing Gutenberg CSV with correct structure...');
    
    const lines = csvText.split('\n');
    const books = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            // Parse CSV with proper comma handling
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
    
    console.log(`Parsed ${books.length} books from Gutenberg catalog`);
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
    fields.push(currentField.trim()); // Add the last field
    
    return fields;
}

function normalizeTitle(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ');   // Normalize whitespace
}

function findExactMatches(wikiData, gutenbergBooks) {
    console.log('\nFinding exact title matches...');
    
    // Create lookup map for Gutenberg books by normalized title
    const gutenbergMap = new Map();
    gutenbergBooks.forEach(book => {
        const normalized = normalizeTitle(book.title);
        if (normalized && normalized !== 'text') { // Skip generic "Text" entries
            if (!gutenbergMap.has(normalized)) {
                gutenbergMap.set(normalized, []);
            }
            gutenbergMap.get(normalized).push(book);
        }
    });
    
    console.log(`Created lookup map for ${gutenbergMap.size} unique Gutenberg titles`);
    
    const matches = [];
    let processed = 0;
    
    wikiData.articles.forEach(wikiArticle => {
        processed++;
        if (processed % 1000 === 0) {
            console.log(`Processed ${processed}/${wikiData.articles.length} Wikipedia articles...`);
        }
        
        const normalizedWiki = normalizeTitle(wikiArticle.title);
        const gutenbergMatches = gutenbergMap.get(normalizedWiki);
        
        if (gutenbergMatches) {
            // Save ALL Gutenberg matches for this Wikipedia article
            gutenbergMatches.forEach(gutenbergBook => {
                matches.push({
                    wikipediaTitle: wikiArticle.title,
                    wikipediaUrl: wikiArticle.wikipediaUrl,
                    gutenbergId: gutenbergBook.id,
                    gutenbergTitle: gutenbergBook.title,
                    gutenbergAuthors: gutenbergBook.authors,
                    gutenbergLanguage: gutenbergBook.language,
                    gutenbergType: gutenbergBook.type,
                    gutenbergIssued: gutenbergBook.issued,
                    matchType: 'exact'
                });
            });
        }
    });
    
    return matches;
}

function generateReport(matches, wikiData, gutenbergBooks) {
    console.log('\n=== EXACT TITLE MATCH REPORT ===');
    console.log(`Wikipedia articles: ${wikiData.articles.length}`);
    console.log(`Gutenberg books: ${gutenbergBooks.length}`);
    console.log(`Exact matches found: ${matches.length}`);
    console.log(`Match rate: ${((matches.length / wikiData.articles.length) * 100).toFixed(2)}%`);
    
    // Count unique Wikipedia articles that matched
    const uniqueWikiMatches = new Set(matches.map(m => m.wikipediaTitle));
    console.log(`Unique Wikipedia articles matched: ${uniqueWikiMatches.size}`);
    console.log(`Average Gutenberg versions per Wikipedia article: ${(matches.length / uniqueWikiMatches.size).toFixed(2)}`);
    
    // Show sample matches
    console.log('\nFirst 10 matches:');
    matches.slice(0, 10).forEach((match, index) => {
        console.log(`${index + 1}. "${match.wikipediaTitle}" ↔ "${match.gutenbergTitle}" by ${match.gutenbergAuthors} [ID: ${match.gutenbergId}]`);
    });
    
    if (matches.length > 10) {
        console.log(`... and ${matches.length - 10} more matches`);
    }
    
    // Show author breakdown
    const authorCounts = {};
    matches.forEach(match => {
        const author = match.gutenbergAuthors || 'Unknown';
        authorCounts[author] = (authorCounts[author] || 0) + 1;
    });
    
    console.log('\nTop 10 authors by match count:');
    Object.entries(authorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([author, count]) => {
            console.log(`  ${author}: ${count} matches`);
        });
    
    // Show examples of multiple versions
    const multiVersionTitles = {};
    matches.forEach(match => {
        const title = match.wikipediaTitle;
        if (!multiVersionTitles[title]) {
            multiVersionTitles[title] = [];
        }
        multiVersionTitles[title].push(match);
    });
    
    const titlesWithMultipleVersions = Object.entries(multiVersionTitles)
        .filter(([title, versions]) => versions.length > 1)
        .sort((a, b) => b[1].length - a[1].length);
    
    console.log('\nTitles with multiple Gutenberg versions:');
    titlesWithMultipleVersions.slice(0, 10).forEach(([title, versions]) => {
        console.log(`  "${title}": ${versions.length} versions`);
        versions.forEach(version => {
            console.log(`    - ID ${version.gutenbergId}: ${version.gutenbergAuthors} (${version.gutenbergLanguage})`);
        });
    });
}

function main() {
    try {
        // Load data
        const { wikiData, gutenbergBooks } = loadData();
        
        // Find exact matches
        const matches = findExactMatches(wikiData, gutenbergBooks);
        
        // Generate report
        generateReport(matches, wikiData, gutenbergBooks);
        
        // Save results
        const results = {
            analysisDate: new Date().toISOString(),
            statistics: {
                wikipediaArticles: wikiData.articles.length,
                gutenbergBooks: gutenbergBooks.length,
                exactMatches: matches.length,
                uniqueWikiMatches: new Set(matches.map(m => m.wikipediaTitle)).size,
                matchRate: ((matches.length / wikiData.articles.length) * 100).toFixed(2) + '%'
            },
            matches: matches
        };
        
        fs.writeFileSync('fixed-exact-title-matches.json', JSON.stringify(results, null, 2));
        
        // Create app-ready library (one entry per Wikipedia article, but with all Gutenberg IDs)
        const wikiToGutenberg = {};
        matches.forEach(match => {
            if (!wikiToGutenberg[match.wikipediaTitle]) {
                wikiToGutenberg[match.wikipediaTitle] = {
                    title: match.wikipediaTitle,
                    wikipediaUrl: match.wikipediaUrl,
                    gutenbergVersions: []
                };
            }
            wikiToGutenberg[match.wikipediaTitle].gutenbergVersions.push({
                id: match.gutenbergId,
                title: match.gutenbergTitle,
                authors: match.gutenbergAuthors,
                language: match.gutenbergLanguage,
                type: match.gutenbergType,
                issued: match.gutenbergIssued
            });
        });
        
        const library = Object.values(wikiToGutenberg).map(entry => ({
            id: entry.gutenbergVersions[0].id, // Use first version as primary ID
            title: entry.title,
            author: entry.gutenbergVersions[0].authors,
            wikipediaUrl: entry.wikipediaUrl,
            wikipediaTitle: entry.title,
            gutenbergVersions: entry.gutenbergVersions
        }));
        
        fs.writeFileSync('fixed-exact-matches-library.json', JSON.stringify(library, null, 2));
        
        console.log('\nFiles saved:');
        console.log('  - fixed-exact-title-matches.json (complete analysis)');
        console.log('  - fixed-exact-matches-library.json (app-ready library)');
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { normalizeTitle, findExactMatches, parseCSVCorrectly };
