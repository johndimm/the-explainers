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

async function searchWikipedia(title, author = null) {
    // First try exact title match
    let searchTerm = title;
    
    // If author is provided, try "Title by Author" format
    if (author && author !== 'Various') {
        searchTerm = `${title} by ${author}`;
    }

    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: searchTerm,
        srlimit: '5',
        srnamespace: '0'
    });

    const url = `${WIKIPEDIA_API_BASE}?${params}`;
    
    requestCount++;
    if (requestCount % 10 === 0) {
        console.log(`Made ${requestCount} requests...`);
    }
    
    await delay(DELAY_BETWEEN_REQUESTS);
    
    try {
        const response = await makeRequest(url);
        
        if (response.query && response.query.search && response.query.search.length > 0) {
            // Return the first result
            const result = response.query.search[0];
            return {
                title: result.title,
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
                snippet: result.snippet
            };
        }
        
        // If no results with author, try just the title
        if (author && author !== 'Various') {
            const titleOnlyParams = new URLSearchParams({
                action: 'query',
                format: 'json',
                list: 'search',
                srsearch: title,
                srlimit: '5',
                srnamespace: '0'
            });
            
            const titleOnlyUrl = `${WIKIPEDIA_API_BASE}?${titleOnlyParams}`;
            requestCount++;
            await delay(DELAY_BETWEEN_REQUESTS);
            
            const titleResponse = await makeRequest(titleOnlyUrl);
            
            if (titleResponse.query && titleResponse.query.search && titleResponse.query.search.length > 0) {
                const result = titleResponse.query.search[0];
                return {
                    title: result.title,
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
                    snippet: result.snippet
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error(`Error searching for "${title}": ${error.message}`);
        return null;
    }
}

async function addWikipediaLinksToFile(filePath) {
    console.log(`Processing ${filePath}...`);
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const updated = [];
    let added = 0;
    let skipped = 0;
    
    for (let i = 0; i < data.length; i++) {
        const book = data[i];
        
        // Skip if already has Wikipedia URL
        if (book.wikipediaUrl) {
            updated.push(book);
            skipped++;
            continue;
        }
        
        console.log(`[${i + 1}/${data.length}] Searching for: "${book.title}" by ${book.author}`);
        
        const result = await searchWikipedia(book.title, book.author);
        
        if (result) {
            book.wikipediaUrl = result.url;
            book.wikipediaTitle = result.title;
            updated.push(book);
            added++;
            console.log(`  ✓ Found: ${result.title}`);
        } else {
            updated.push(book);
            console.log(`  ✗ No Wikipedia page found`);
        }
    }
    
    // Save updated file
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    
    console.log(`\n${filePath} updated:`);
    console.log(`  Added Wikipedia links: ${added}`);
    console.log(`  Already had links: ${skipped}`);
    console.log(`  Total books: ${data.length}`);
}

async function main() {
    const filesToProcess = [
        'src/data/library/shakespeare.json',
        'src/data/library/philosophers.json',
        'src/data/library/english-literature.json'
    ];
    
    console.log('Adding Wikipedia links to library files...');
    console.log('This will search for Wikipedia pages for books missing Wikipedia URLs.');
    console.log('');
    
    for (const file of filesToProcess) {
        if (fs.existsSync(file)) {
            await addWikipediaLinksToFile(file);
            console.log('');
        } else {
            console.log(`File not found: ${file}`);
        }
    }
    
    console.log('Wikipedia link addition complete!');
}

if (require.main === module) {
    main();
}

module.exports = { searchWikipedia, addWikipediaLinksToFile };
