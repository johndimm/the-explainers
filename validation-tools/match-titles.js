#!/usr/bin/env node

const fs = require('fs');

function loadData() {
    console.log('Loading Wikipedia articles and Gutenberg catalog...');
    
    // Load Wikipedia articles
    const wikiData = JSON.parse(fs.readFileSync('wiki-gutenberg-raw-list.json', 'utf8'));
    console.log(`Loaded ${wikiData.articles.length} Wikipedia articles`);
    
    // Load Gutenberg catalog
    const gutenbergData = JSON.parse(fs.readFileSync('gutenberg-catalog.json', 'utf8'));
    console.log(`Loaded ${gutenbergData.books.length} Gutenberg books`);
    
    return { wikiData, gutenbergData };
}

function normalizeTitle(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ');   // Normalize whitespace
}

function findExactMatches(wikiData, gutenbergData) {
    console.log('\nFinding exact title matches...');
    
    // Create lookup map for Gutenberg books by normalized title
    const gutenbergMap = new Map();
    gutenbergData.books.forEach(book => {
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
            gutenbergMatches.forEach(gutenbergBook => {
                matches.push({
                    wikipediaTitle: wikiArticle.title,
                    wikipediaUrl: wikiArticle.wikipediaUrl,
                    gutenbergId: gutenbergBook.id,
                    gutenbergTitle: gutenbergBook.title,
                    gutenbergAuthor: gutenbergBook.author,
                    gutenbergLanguage: gutenbergBook.language,
                    matchType: 'exact'
                });
            });
        }
    });
    
    return matches;
}

function generateReport(matches, wikiData, gutenbergData) {
    console.log('\n=== EXACT TITLE MATCH REPORT ===');
    console.log(`Wikipedia articles: ${wikiData.articles.length}`);
    console.log(`Gutenberg books: ${gutenbergData.books.length}`);
    console.log(`Exact matches found: ${matches.length}`);
    console.log(`Match rate: ${((matches.length / wikiData.articles.length) * 100).toFixed(2)}%`);
    
    // Show sample matches
    console.log('\nFirst 10 matches:');
    matches.slice(0, 10).forEach((match, index) => {
        console.log(`${index + 1}. "${match.wikipediaTitle}" ↔ "${match.gutenbergTitle}" by ${match.gutenbergAuthor} [ID: ${match.gutenbergId}]`);
    });
    
    if (matches.length > 10) {
        console.log(`... and ${matches.length - 10} more matches`);
    }
    
    // Show author breakdown
    const authorCounts = {};
    matches.forEach(match => {
        const author = match.gutenbergAuthor || 'Unknown';
        authorCounts[author] = (authorCounts[author] || 0) + 1;
    });
    
    console.log('\nTop 10 authors by match count:');
    Object.entries(authorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([author, count]) => {
            console.log(`  ${author}: ${count} matches`);
        });
}

function main() {
    try {
        // Load data
        const { wikiData, gutenbergData } = loadData();
        
        // Find exact matches
        const matches = findExactMatches(wikiData, gutenbergData);
        
        // Generate report
        generateReport(matches, wikiData, gutenbergData);
        
        // Save results
        const results = {
            analysisDate: new Date().toISOString(),
            statistics: {
                wikipediaArticles: wikiData.articles.length,
                gutenbergBooks: gutenbergData.books.length,
                exactMatches: matches.length,
                matchRate: ((matches.length / wikiData.articles.length) * 100).toFixed(2) + '%'
            },
            matches: matches
        };
        
        fs.writeFileSync('exact-title-matches.json', JSON.stringify(results, null, 2));
        
        // Create app-ready library
        const library = matches.map(match => ({
            id: match.gutenbergId,
            title: match.wikipediaTitle,
            author: match.gutenbergAuthor,
            wikipediaUrl: match.wikipediaUrl,
            wikipediaTitle: match.wikipediaTitle,
            gutenbergTitle: match.gutenbergTitle
        }));
        
        fs.writeFileSync('exact-matches-library.json', JSON.stringify(library, null, 2));
        
        console.log('\nFiles saved:');
        console.log('  - exact-title-matches.json (complete analysis)');
        console.log('  - exact-matches-library.json (app-ready library)');
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { normalizeTitle, findExactMatches };
