#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Wikipedia API configuration
const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'The-Explainers/1.0 (https://the-explainers.com)';

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 50; // 50ms between requests
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

async function getCategoryMembers(category, continueToken = null) {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'categorymembers',
        cmtitle: `Category:${category}`,
        cmlimit: '500',
        cmnamespace: '0' // Only main namespace articles
    });

    if (continueToken) {
        params.append('cmcontinue', continueToken);
    }

    const url = `${WIKIPEDIA_API_BASE}?${params}`;
    console.log(`Fetching category members: ${category}${continueToken ? ` (continue: ${continueToken.substring(0, 20)}...)` : ''}`);
    
    requestCount++;
    if (requestCount % 20 === 0) {
        console.log(`Made ${requestCount} requests so far...`);
    }
    
    await delay(DELAY_BETWEEN_REQUESTS);
    
    try {
        const response = await makeRequest(url);
        return response;
    } catch (error) {
        console.error(`Error fetching category members: ${error.message}`);
        throw error;
    }
}

async function getArticleLengths(titles) {
    // Process in batches of 50 (Wikipedia API limit)
    const batches = [];
    for (let i = 0; i < titles.length; i += 50) {
        batches.push(titles.slice(i, i + 50));
    }

    const results = [];
    
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const params = new URLSearchParams({
            action: 'query',
            format: 'json',
            prop: 'info',
            titles: batch.join('|'),
            inprop: 'length'
        });

        const url = `${WIKIPEDIA_API_BASE}?${params}`;
        console.log(`Getting lengths for batch ${i + 1}/${batches.length} (${batch.length} articles)`);
        
        requestCount++;
        if (requestCount % 10 === 0) {
            console.log(`Made ${requestCount} requests so far...`);
        }
        
        await delay(DELAY_BETWEEN_REQUESTS);
        
        try {
            const response = await makeRequest(url);
            if (response.query && response.query.pages) {
                Object.values(response.query.pages).forEach(page => {
                    if (page.length !== undefined) {
                        results.push({
                            title: page.title,
                            length: page.length,
                            pageid: page.pageid
                        });
                    }
                });
            }
        } catch (error) {
            console.error(`Error fetching lengths for batch ${i + 1}: ${error.message}`);
        }
    }

    return results;
}

async function getPageContent(pageTitle) {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        prop: 'extracts',
        titles: pageTitle,
        exintro: 'false',
        explaintext: 'true',
        exsectionformat: 'plain'
    });

    const url = `${WIKIPEDIA_API_BASE}?${params}`;
    
    requestCount++;
    if (requestCount % 10 === 0) {
        console.log(`Made ${requestCount} requests so far...`);
    }
    
    await delay(DELAY_BETWEEN_REQUESTS);
    
    try {
        const response = await makeRequest(url);
        return response;
    } catch (error) {
        console.error(`Error fetching page content for ${pageTitle}: ${error.message}`);
        return null;
    }
}

function extractGutenbergLinks(content) {
    const gutenbergLinks = [];
    
    // Look for various Gutenberg link patterns - more comprehensive
    const patterns = [
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

    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const gutenbergId = match[1];
            if (gutenbergId && !gutenbergLinks.includes(gutenbergId)) {
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

async function getAllCategoryMembers(category) {
    const allMembers = [];
    let continueToken = null;
    let pageCount = 0;

    do {
        try {
            const response = await getCategoryMembers(category, continueToken);
            
            if (response.query && response.query.categorymembers) {
                const members = response.query.categorymembers;
                allMembers.push(...members);
                pageCount += members.length;
                console.log(`Found ${members.length} members (total: ${pageCount})`);
                
                continueToken = response.continue ? response.continue.cmcontinue : null;
            } else {
                console.log('No more members found');
                break;
            }
        } catch (error) {
            console.error(`Error fetching category members: ${error.message}`);
            break;
        }
    } while (continueToken);

    return allMembers;
}

async function main() {
    console.log('Starting efficient Wikipedia Gutenberg link extraction and ranking...');
    console.log('This will process all articles in Category:Articles with Project Gutenberg links');
    console.log('and rank them by Wikipedia article length to find the most interesting books.');
    console.log('');

    try {
        // Get all category members
        const members = await getAllCategoryMembers('Articles with Project Gutenberg links');
        console.log(`\nFound ${members.length} total articles with Gutenberg links`);
        
        if (members.length === 0) {
            console.log('No articles found. Exiting.');
            return;
        }

        // Get article lengths for all articles (without downloading content)
        console.log('\nGetting article lengths for all articles...');
        const titles = members.map(m => m.title);
        const lengthData = await getArticleLengths(titles);
        
        console.log(`Got lengths for ${lengthData.length} articles`);
        
        // Sort by length (descending) to prioritize longer articles
        lengthData.sort((a, b) => b.length - a.length);
        
        console.log(`\nTop 20 longest articles:`);
        lengthData.slice(0, 20).forEach((article, i) => {
            console.log(`  ${i + 1}. ${article.title} (${article.length} chars)`);
        });

        // Process the longest articles first to find Gutenberg links
        console.log(`\nProcessing articles for Gutenberg links (starting with longest)...`);
        const results = [];
        const errors = [];
        
        // Process in batches, starting with the longest articles
        for (let i = 0; i < lengthData.length; i++) {
            const article = lengthData[i];
            console.log(`\n[${i + 1}/${lengthData.length}] Processing: ${article.title} (${article.length} chars)`);
            
            try {
                const contentResponse = await getPageContent(article.title);
                
                if (!contentResponse || !contentResponse.query || !contentResponse.query.pages) {
                    console.log(`  No content found for ${article.title}`);
                    continue;
                }

                const pages = contentResponse.query.pages;
                const pageId = Object.keys(pages)[0];
                const pageData = pages[pageId];
                
                if (!pageData || !pageData.extract) {
                    console.log(`  No extract available for ${article.title}`);
                    continue;
                }

                const content = pageData.extract;
                const gutenbergLinks = extractGutenbergLinks(content);
                
                if (gutenbergLinks.length === 0) {
                    console.log(`  No Gutenberg links found in ${article.title}`);
                    continue;
                }

                const author = extractAuthorFromContent(content, article.title);
                
                const result = {
                    title: article.title,
                    author: author,
                    gutenbergIds: gutenbergLinks,
                    wikipediaLength: article.length,
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title)}`,
                    contentPreview: content.substring(0, 200) + '...'
                };

                results.push(result);
                console.log(`  ✓ Found ${gutenbergLinks.length} Gutenberg link(s): ${gutenbergLinks.join(', ')}`);
                if (author) {
                    console.log(`  Author: ${author}`);
                }

                // Save progress every 25 successful extractions
                if (results.length % 25 === 0) {
                    console.log(`\nSaving progress... (${results.length} successful extractions)`);
                    fs.writeFileSync('wikipedia-gutenberg-progress.json', JSON.stringify({
                        processed: i + 1,
                        total: lengthData.length,
                        successful: results.length,
                        errors: errors.length,
                        results: results,
                        errorDetails: errors
                    }, null, 2));
                }

                // Stop when we have enough results (or process all if we want)
                if (results.length >= 2000) {
                    console.log(`\nReached ${results.length} successful extractions. Stopping here.`);
                    break;
                }

            } catch (error) {
                console.error(`  Error processing ${article.title}: ${error.message}`);
                errors.push({
                    title: article.title,
                    error: error.message
                });
            }
        }

        // Sort results by Wikipedia article length (descending)
        console.log('\nSorting results by Wikipedia article length...');
        results.sort((a, b) => b.wikipediaLength - a.wikipediaLength);

        // Create top 1000 list
        const top1000 = results.slice(0, 1000);
        
        // Create summary statistics
        const stats = {
            totalArticles: lengthData.length,
            successfulExtractions: results.length,
            errorCount: errors.length,
            averageLength: results.reduce((sum, r) => sum + r.wikipediaLength, 0) / results.length,
            medianLength: results[Math.floor(results.length / 2)].wikipediaLength,
            minLength: Math.min(...results.map(r => r.wikipediaLength)),
            maxLength: Math.max(...results.map(r => r.wikipediaLength)),
            top1000MinLength: top1000[top1000.length - 1].wikipediaLength,
            top1000MaxLength: top1000[0].wikipediaLength
        };

        // Save final results
        const finalResults = {
            extractionDate: new Date().toISOString(),
            statistics: stats,
            allResults: results,
            top1000: top1000,
            errors: errors
        };

        fs.writeFileSync('wikipedia-gutenberg-ranked.json', JSON.stringify(finalResults, null, 2));
        
        // Create a clean library file for the top 1000
        const library = top1000.map(book => ({
            title: book.title,
            author: book.author,
            gutenbergId: book.gutenbergIds[0], // Use first Gutenberg ID
            wikipediaUrl: book.url,
            wikipediaLength: book.wikipediaLength,
            rank: top1000.indexOf(book) + 1
        }));

        fs.writeFileSync('top-1000-library.json', JSON.stringify(library, null, 2));
        
        console.log(`\n=== EXTRACTION AND RANKING COMPLETE ===`);
        console.log(`Total articles processed: ${lengthData.length}`);
        console.log(`Successful extractions: ${results.length}`);
        console.log(`Errors: ${errors.length}`);
        console.log(`Total Gutenberg IDs found: ${results.reduce((sum, r) => sum + r.gutenbergIds.length, 0)}`);
        console.log(`Unique Gutenberg IDs: ${[...new Set(results.flatMap(r => r.gutenbergIds))].length}`);
        console.log(`\n=== TOP 1000 STATISTICS ===`);
        console.log(`Average Wikipedia article length: ${Math.round(stats.averageLength)} characters`);
        console.log(`Median Wikipedia article length: ${stats.medianLength} characters`);
        console.log(`Length range: ${stats.minLength} - ${stats.maxLength} characters`);
        console.log(`Top 1000 length range: ${stats.top1000MinLength} - ${stats.top1000MaxLength} characters`);
        console.log(`\nTop 10 most interesting books:`);
        top1000.slice(0, 10).forEach((book, i) => {
            console.log(`  ${i + 1}. ${book.title} by ${book.author || 'Unknown'} (${book.wikipediaLength} chars)`);
        });
        console.log(`\nResults saved to:`);
        console.log(`  - wikipedia-gutenberg-ranked.json (complete results)`);
        console.log(`  - top-1000-library.json (curated library)`);
        
        if (errors.length > 0) {
            console.log(`  - wikipedia-gutenberg-ranked.json (errors section)`);
        }

    } catch (error) {
        console.error(`Fatal error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getAllCategoryMembers, getArticleLengths, extractGutenbergLinks };

