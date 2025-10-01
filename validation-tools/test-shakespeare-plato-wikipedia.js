#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Wikipedia API configuration
const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'The-Explainers/1.0 (https://the-explainers.com)';

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 100; // 100ms between requests
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

async function getPageInfo(pageTitle) {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        prop: 'extracts|info|extlinks',
        titles: pageTitle,
        exintro: 'false',
        explaintext: 'true',
        exsectionformat: 'plain',
        inprop: 'length',
        ellimit: 'max'
    });

    const url = `${WIKIPEDIA_API_BASE}?${params}`;
    
    requestCount++;
    console.log(`[${requestCount}] Fetching: ${pageTitle}`);
    
    await delay(DELAY_BETWEEN_REQUESTS);
    
    try {
        const response = await makeRequest(url);
        return response;
    } catch (error) {
        console.error(`Error fetching page info for ${pageTitle}: ${error.message}`);
        return null;
    }
}

function extractGutenbergLinks(content, extlinks = []) {
    const gutenbergLinks = [];
    
    // Look for various Gutenberg link patterns in content
    const contentPatterns = [
        // Direct Gutenberg links
        /https?:\/\/www\.gutenberg\.org\/ebooks\/(\d+)/gi,
        /https?:\/\/www\.gutenberg\.org\/files\/(\d+)/gi,
        /https?:\/\/gutenberg\.org\/ebooks\/(\d+)/gi,
        /https?:\/\/gutenberg\.org\/files\/(\d+)/gi,
        // Gutenberg Australia links
        /https?:\/\/gutenberg\.net\.au\/ebooks\/(\d+)/gi,
        /https?:\/\/gutenberg\.net\.au\/files\/(\d+)/gi,
        // Template references
        /\{\{Gutenberg book\|(\d+)\}\}/gi,
        /\{\{Gutenberg author\|(\d+)\}\}/gi,
        /\{\{Gutenberg Australia\|(\d+)\}\}/gi,
        // Text references
        /Project Gutenberg.*?(\d+)/gi,
        /Gutenberg.*?ebook.*?(\d+)/gi,
        // External links section patterns
        /\[\[.*?Project Gutenberg.*?(\d+).*?\]\]/gi,
        /\[\[.*?Gutenberg.*?(\d+).*?\]\]/gi
    ];

    // Check content patterns
    contentPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const gutenbergId = match[1];
            if (gutenbergId && !gutenbergLinks.includes(gutenbergId)) {
                gutenbergLinks.push(gutenbergId);
            }
        }
    });

    // Check external links
    extlinks.forEach(link => {
        const url = link['*'];
        const gutenbergMatch = url.match(/gutenberg\.org\/ebooks\/(\d+)/i) || 
                              url.match(/gutenberg\.org\/files\/(\d+)/i) ||
                              url.match(/gutenberg\.net\.au\/ebooks\/(\d+)/i) ||
                              url.match(/gutenberg\.net\.au\/files\/(\d+)/i);
        
        if (gutenbergMatch) {
            const gutenbergId = gutenbergMatch[1];
            if (!gutenbergLinks.includes(gutenbergId)) {
                gutenbergLinks.push(gutenbergId);
            }
        }
    });

    return gutenbergLinks;
}

function extractAuthorFromContent(content, title) {
    // Try to extract author from the content
    const authorPatterns = [
        /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(/gm,
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*was/gm,
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(born/gm
    ];

    for (const pattern of authorPatterns) {
        const match = pattern.exec(content);
        if (match && match[1] && match[1] !== title) {
            return match[1].trim();
        }
    }

    return null;
}

async function processBook(book) {
    const title = book.title;
    const expectedAuthor = book.author;
    const gutenbergId = book.id || book.gutenbergId;
    
    console.log(`\nProcessing: ${title} by ${expectedAuthor}`);
    
    try {
        const infoResponse = await getPageInfo(title);
        
        if (!infoResponse || !infoResponse.query || !infoResponse.query.pages) {
            console.log(`  ❌ No Wikipedia page found for ${title}`);
            return {
                title,
                author: expectedAuthor,
                gutenbergId: gutenbergId,
                status: 'no_wikipedia_page',
                wikipediaLength: 0,
                gutenbergLinks: [],
                url: null
            };
        }

        const pages = infoResponse.query.pages;
        const pageId = Object.keys(pages)[0];
        const pageData = pages[pageId];
        
        if (!pageData || pageData.missing) {
            console.log(`  ❌ Wikipedia page missing for ${title}`);
            return {
                title,
                author: expectedAuthor,
                gutenbergId: gutenbergId,
                status: 'missing_wikipedia_page',
                wikipediaLength: 0,
                gutenbergLinks: [],
                url: null
            };
        }

        const content = pageData.extract || '';
        const length = pageData.length || 0;
        const extlinks = pageData.extlinks || [];
        const gutenbergLinks = extractGutenbergLinks(content, extlinks);
        
        const result = {
            title: title,
            author: expectedAuthor,
            gutenbergId: gutenbergId,
            wikipediaLength: length,
            gutenbergLinks: gutenbergLinks,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
            contentPreview: content.substring(0, 200) + '...',
            extlinksCount: extlinks.length
        };

        if (gutenbergLinks.length === 0) {
            console.log(`  ⚠️  No Gutenberg links found in Wikipedia page (length: ${length}, extlinks: ${extlinks.length})`);
            result.status = 'no_gutenberg_links';
        } else {
            console.log(`  ✅ Found ${gutenbergLinks.length} Gutenberg link(s): ${gutenbergLinks.join(', ')} (length: ${length}, extlinks: ${extlinks.length})`);
            result.status = 'success';
        }

        return result;
    } catch (error) {
        console.error(`  ❌ Error processing ${title}: ${error.message}`);
        return {
            title,
            author: expectedAuthor,
            gutenbergId: gutenbergId,
            status: 'error',
            error: error.message,
            wikipediaLength: 0,
            gutenbergLinks: [],
            url: null
        };
    }
}

async function main() {
    console.log('Testing Wikipedia extraction on Shakespeare and Plato works...');
    console.log('This will check if all their works have Wikipedia pages with Gutenberg links.');
    console.log('');

    try {
        // Load Shakespeare and Plato books
        const shakespearePath = '/Users/johndimm/Projects/the-explainers/src/data/library/shakespeare.json';
        const platoPath = '/Users/johndimm/Projects/the-explainers/src/data/library/plato.json';
        
        let shakespeareBooks = [];
        let platoBooks = [];
        
        if (fs.existsSync(shakespearePath)) {
            const shakespeareData = JSON.parse(fs.readFileSync(shakespearePath, 'utf8'));
            shakespeareBooks = Array.isArray(shakespeareData) ? shakespeareData : (shakespeareData.books || []);
            console.log(`Loaded ${shakespeareBooks.length} Shakespeare books`);
        } else {
            console.log('Shakespeare library file not found');
        }
        
        if (fs.existsSync(platoPath)) {
            const platoData = JSON.parse(fs.readFileSync(platoPath, 'utf8'));
            platoBooks = Array.isArray(platoData) ? platoData : (platoData.books || []);
            console.log(`Loaded ${platoBooks.length} Plato books`);
        } else {
            console.log('Plato library file not found');
        }
        
        const allBooks = [
            ...shakespeareBooks.map(book => ({...book, category: 'Shakespeare'})),
            ...platoBooks.map(book => ({...book, category: 'Plato'}))
        ];
        
        console.log(`\nTotal books to process: ${allBooks.length}`);
        console.log(`Shakespeare: ${shakespeareBooks.length}, Plato: ${platoBooks.length}`);
        
        if (allBooks.length === 0) {
            console.log('No books found. Exiting.');
            return;
        }

        // Process each book
        const results = [];
        const stats = {
            total: allBooks.length,
            success: 0,
            no_wikipedia_page: 0,
            missing_wikipedia_page: 0,
            no_gutenberg_links: 0,
            error: 0
        };
        
        for (let i = 0; i < allBooks.length; i++) {
            const book = allBooks[i];
            console.log(`\n[${i + 1}/${allBooks.length}] ${book.category}: ${book.title}`);
            
            const result = await processBook(book);
            result.category = book.category;
            results.push(result);
            
            stats[result.status]++;
            
            // Save progress every 10 books
            if ((i + 1) % 10 === 0) {
                console.log(`\nProgress: ${i + 1}/${allBooks.length} processed`);
                fs.writeFileSync('shakespeare-plato-wikipedia-test.json', JSON.stringify({
                    processed: i + 1,
                    total: allBooks.length,
                    results: results,
                    stats: stats
                }, null, 2));
            }
        }

        // Sort by Wikipedia article length (descending)
        console.log('\nSorting results by Wikipedia article length...');
        results.sort((a, b) => b.wikipediaLength - a.wikipediaLength);

        // Create summary
        const summary = {
            testDate: new Date().toISOString(),
            statistics: stats,
            results: results,
            top10ByLength: results.slice(0, 10).map(r => ({
                title: r.title,
                author: r.author,
                category: r.category,
                wikipediaLength: r.wikipediaLength,
                status: r.status,
                gutenbergLinks: r.gutenbergLinks,
                extlinksCount: r.extlinksCount
            }))
        };

        fs.writeFileSync('shakespeare-plato-wikipedia-test.json', JSON.stringify(summary, null, 2));
        
        console.log(`\n=== TEST RESULTS ===`);
        console.log(`Total books processed: ${stats.total}`);
        console.log(`✅ Success (found Gutenberg links): ${stats.success}`);
        console.log(`❌ No Wikipedia page: ${stats.no_wikipedia_page}`);
        console.log(`❌ Missing Wikipedia page: ${stats.missing_wikipedia_page}`);
        console.log(`⚠️  No Gutenberg links: ${stats.no_gutenberg_links}`);
        console.log(`❌ Error: ${stats.error}`);
        
        console.log(`\nSuccess rate: ${((stats.success / stats.total) * 100).toFixed(1)}%`);
        
        console.log(`\nTop 10 by Wikipedia article length:`);
        summary.top10ByLength.forEach((book, i) => {
            console.log(`  ${i + 1}. ${book.title} by ${book.author} (${book.category}) - ${book.wikipediaLength} chars - ${book.status} (extlinks: ${book.extlinksCount})`);
        });
        
        console.log(`\nResults saved to: shakespeare-plato-wikipedia-test.json`);

    } catch (error) {
        console.error(`Fatal error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { processBook, extractGutenbergLinks };