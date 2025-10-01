#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Wikipedia API configuration
const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'The-Explainers/1.0 (https://the-explainers.com)';

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 100;
let requestCount = 0;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': USER_AGENT
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

async function getGutenbergCatalog() {
    console.log('Fetching Project Gutenberg catalog...');
    
    // Get the Gutenberg catalog via their API
    const url = 'https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv';
    
    try {
        const response = await makeRequest(url);
        console.log('Gutenberg catalog fetched successfully');
        return response;
    } catch (error) {
        console.error('Error fetching Gutenberg catalog:', error.message);
        return null;
    }
}

async function getWikipediaGutenbergArticles() {
    console.log('Fetching Wikipedia articles with Gutenberg links...');
    
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'categorymembers',
        cmtitle: 'Category:Articles with Project Gutenberg links',
        cmlimit: '500',
        cmnamespace: '0'
    });

    const url = `${WIKIPEDIA_API_BASE}?${params}`;
    
    requestCount++;
    await delay(DELAY_BETWEEN_REQUESTS);
    
    try {
        const response = await makeRequest(url);
        
        if (response.query && response.query.categorymembers) {
            console.log(`Found ${response.query.categorymembers.length} Wikipedia articles with Gutenberg links`);
            return response.query.categorymembers;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching Wikipedia articles:', error.message);
        return [];
    }
}

async function getGutenbergLinksFromWikipedia(title) {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        prop: 'extlinks',
        titles: title,
        ellimit: 'max'
    });

    const url = `${WIKIPEDIA_API_BASE}?${params}`;
    
    requestCount++;
    await delay(DELAY_BETWEEN_REQUESTS);
    
    try {
        const response = await makeRequest(url);
        if (response.query && response.query.pages) {
            const pages = response.query.pages;
            const pageId = Object.keys(pages)[0];
            const pageData = pages[pageId];
            
            if (pageData && pageData.extlinks) {
                const gutenbergLinks = [];
                pageData.extlinks.forEach(link => {
                    const url = link['*'];
                    const match = url.match(/gutenberg\.org\/ebooks\/(\d+)/i) || 
                                  url.match(/gutenberg\.org\/files\/(\d+)/i) ||
                                  url.match(/gutenberg\.net\.au\/ebooks\/(\d+)/i) ||
                                  url.match(/gutenberg\.net\.au\/files\/(\d+)/i);
                    
                    if (match) {
                        gutenbergLinks.push(match[1]);
                    }
                });
                return gutenbergLinks;
            }
        }
        return [];
    } catch (error) {
        console.error(`Error checking Gutenberg links for ${title}: ${error.message}`);
        return [];
    }
}

function parseGutenbergCSV(csvData) {
    console.log('Parsing Gutenberg catalog...');
    
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    const books = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',');
            if (values.length >= 3) {
                books.push({
                    id: values[0],
                    title: values[1],
                    author: values[2]
                });
            }
        }
    }
    
    console.log(`Parsed ${books.length} books from Gutenberg catalog`);
    return books;
}

function isLikelyBook(title) {
    const titleLower = title.toLowerCase();
    
    // Skip obvious non-books
    if (titleLower.includes('list of') || 
        titleLower.includes('category:') ||
        titleLower.includes('outline of') ||
        titleLower.includes('index of') ||
        titleLower.includes('timeline of') ||
        titleLower.includes('biography') ||
        titleLower.includes('film') ||
        titleLower.includes('movie') ||
        titleLower.includes('adaptation') ||
        titleLower.includes('production') ||
        titleLower.includes('performance') ||
        titleLower.includes('disambiguation')) {
        return false;
    }
    
    return true;
}

async function main() {
    console.log('Cross-referencing Gutenberg catalog with Wikipedia articles...');
    console.log('This will find books that exist in both catalogs.');
    console.log('');
    
    // Step 1: Get Wikipedia articles with Gutenberg links
    const wikipediaArticles = await getWikipediaGutenbergArticles();
    
    if (wikipediaArticles.length === 0) {
        console.error('No Wikipedia articles found. Exiting.');
        return;
    }
    
    // Step 2: Get Gutenberg links from each Wikipedia article
    console.log('\nExtracting Gutenberg IDs from Wikipedia articles...');
    const wikipediaBooks = [];
    
    for (let i = 0; i < Math.min(wikipediaArticles.length, 100); i++) { // Limit to first 100 for testing
        const article = wikipediaArticles[i];
        
        if (!isLikelyBook(article.title)) {
            continue;
        }
        
        console.log(`[${i + 1}/${Math.min(wikipediaArticles.length, 100)}] Checking: ${article.title}`);
        
        const gutenbergLinks = await getGutenbergLinksFromWikipedia(article.title);
        
        if (gutenbergLinks.length > 0) {
            wikipediaBooks.push({
                title: article.title,
                gutenbergIds: gutenbergLinks,
                wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title)}`,
                wikipediaTitle: article.title,
                pageId: article.pageid
            });
            
            console.log(`  ✓ Found Gutenberg IDs: ${gutenbergLinks.join(', ')}`);
        } else {
            console.log(`  ✗ No Gutenberg links found`);
        }
    }
    
    // Step 3: Save results
    const results = {
        extractionDate: new Date().toISOString(),
        statistics: {
            wikipediaArticlesChecked: Math.min(wikipediaArticles.length, 100),
            booksFound: wikipediaBooks.length,
            successRate: ((wikipediaBooks.length / Math.min(wikipediaArticles.length, 100)) * 100).toFixed(2) + '%'
        },
        books: wikipediaBooks
    };
    
    fs.writeFileSync('cross-reference-results.json', JSON.stringify(results, null, 2));
    
    // Create app-ready library
    const library = wikipediaBooks.map(book => ({
        id: book.gutenbergIds[0],
        title: book.title,
        author: "Unknown", // We'll need to get this from Gutenberg catalog
        wikipediaUrl: book.wikipediaUrl,
        wikipediaTitle: book.wikipediaTitle
    }));
    
    fs.writeFileSync('cross-reference-library.json', JSON.stringify(library, null, 2));
    
    console.log(`\n=== CROSS-REFERENCE COMPLETE ===`);
    console.log(`Wikipedia articles checked: ${results.statistics.wikipediaArticlesChecked}`);
    console.log(`Books found with Gutenberg links: ${wikipediaBooks.length}`);
    console.log(`Success rate: ${results.statistics.successRate}`);
    console.log(`\nResults saved to:`);
    console.log(`  - cross-reference-results.json`);
    console.log(`  - cross-reference-library.json`);
}

if (require.main === module) {
    main();
}

module.exports = { getGutenbergCatalog, getWikipediaGutenbergArticles, getGutenbergLinksFromWikipedia };
