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

async function searchForBooks(searchTerm) {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: searchTerm,
        srlimit: '20',
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
        
        if (response.query && response.query.search) {
            return response.query.search.map(result => ({
                title: result.title,
                snippet: result.snippet
            }));
        }
        
        return [];
    } catch (error) {
        console.error(`Error searching for "${searchTerm}": ${error.message}`);
        return [];
    }
}

async function checkForGutenbergLinks(title) {
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

function isLikelyBook(title, snippet) {
    const titleLower = title.toLowerCase();
    const snippetLower = snippet.toLowerCase();
    
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
        titleLower.includes('performance')) {
        return false;
    }
    
    // Look for book indicators in snippet
    if (snippetLower.includes('novel') ||
        snippetLower.includes('book') ||
        snippetLower.includes('poem') ||
        snippetLower.includes('play') ||
        snippetLower.includes('work') ||
        snippetLower.includes('written by') ||
        snippetLower.includes('published') ||
        snippetLower.includes('author')) {
        return true;
    }
    
    return false;
}

async function main() {
    console.log('Smart book finder - using targeted searches instead of bulk downloads...');
    console.log('This will search for specific book titles and check for Gutenberg links.');
    console.log('');
    
    // List of famous book titles to search for
    const famousBooks = [
        // Classic novels
        "Pride and Prejudice",
        "Jane Eyre", 
        "Wuthering Heights",
        "Great Expectations",
        "David Copperfield",
        "Oliver Twist",
        "A Tale of Two Cities",
        "Moby Dick",
        "The Scarlet Letter",
        "The Great Gatsby",
        "To Kill a Mockingbird",
        "1984",
        "Animal Farm",
        "Brave New World",
        "The Catcher in the Rye",
        "Lord of the Flies",
        "The Old Man and the Sea",
        "For Whom the Bell Tolls",
        "The Sun Also Rises",
        "A Farewell to Arms",
        
        // Poetry
        "The Waste Land",
        "Leaves of Grass",
        "Paradise Lost",
        "The Divine Comedy",
        "The Canterbury Tales",
        "Beowulf",
        "The Iliad",
        "The Odyssey",
        
        // Philosophy
        "The Republic",
        "The Prince",
        "Leviathan",
        "The Social Contract",
        "Beyond Good and Evil",
        "Thus Spoke Zarathustra",
        "The Critique of Pure Reason",
        "Being and Time",
        
        // Science and non-fiction
        "On the Origin of Species",
        "The Wealth of Nations",
        "The Art of War",
        "The Prince",
        "Meditations",
        
        // Children's books
        "Alice's Adventures in Wonderland",
        "Through the Looking-Glass",
        "The Adventures of Tom Sawyer",
        "Adventures of Huckleberry Finn",
        "Treasure Island",
        "Robinson Crusoe",
        "Gulliver's Travels",
        
        // Shakespeare plays
        "Hamlet",
        "Macbeth",
        "Romeo and Juliet",
        "Othello",
        "King Lear",
        "The Tempest",
        "A Midsummer Night's Dream",
        "The Merchant of Venice",
        "Twelfth Night",
        "As You Like It"
    ];
    
    const foundBooks = [];
    let searched = 0;
    let found = 0;
    
    console.log(`Searching for ${famousBooks.length} famous books...`);
    
    for (const bookTitle of famousBooks) {
        searched++;
        console.log(`\n[${searched}/${famousBooks.length}] Searching for: "${bookTitle}"`);
        
        const searchResults = await searchForBooks(bookTitle);
        
        for (const result of searchResults) {
            if (isLikelyBook(result.title, result.snippet)) {
                console.log(`  Checking: ${result.title}`);
                
                const gutenbergLinks = await checkForGutenbergLinks(result.title);
                if (gutenbergLinks.length > 0) {
                    foundBooks.push({
                        title: result.title,
                        gutenbergIds: gutenbergLinks,
                        wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
                        wikipediaTitle: result.title,
                        searchTerm: bookTitle
                    });
                    found++;
                    console.log(`    ✓ Found Gutenberg links: ${gutenbergLinks.join(', ')}`);
                } else {
                    console.log(`    ✗ No Gutenberg links found`);
                }
            }
        }
    }
    
    // Save results
    const results = {
        searchDate: new Date().toISOString(),
        statistics: {
            booksSearched: searched,
            booksFound: found,
            successRate: ((found / searched) * 100).toFixed(2) + '%'
        },
        books: foundBooks
    };
    
    fs.writeFileSync('smart-search-results.json', JSON.stringify(results, null, 2));
    
    // Create app-ready library
    const library = foundBooks.map(book => ({
        id: book.gutenbergIds[0],
        title: book.title,
        author: "Unknown", // We'll need to extract this
        wikipediaUrl: book.wikipediaUrl,
        wikipediaTitle: book.wikipediaTitle
    }));
    
    fs.writeFileSync('smart-search-library.json', JSON.stringify(library, null, 2));
    
    console.log(`\n=== SMART SEARCH COMPLETE ===`);
    console.log(`Books searched: ${searched}`);
    console.log(`Books found with Gutenberg links: ${found}`);
    console.log(`Success rate: ${results.statistics.successRate}`);
    console.log(`\nResults saved to:`);
    console.log(`  - smart-search-results.json`);
    console.log(`  - smart-search-library.json`);
}

if (require.main === module) {
    main();
}

module.exports = { searchForBooks, checkForGutenbergLinks, isLikelyBook };
