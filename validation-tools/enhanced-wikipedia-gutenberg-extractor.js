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

async function getPageInfo(pageTitle) {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        prop: 'extracts|info|extlinks|categories',
        titles: pageTitle,
        exintro: 'false',
        explaintext: 'true',
        exsectionformat: 'plain',
        inprop: 'length',
        ellimit: 'max',
        cllimit: 'max'
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

function isBookPage(title, content, categories = []) {
    // Convert to lowercase for easier matching
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Strong indicators this is a book page
    const bookIndicators = [
        // Common book-related phrases in content
        /\b(novel|book|poem|poetry|collection|anthology|volume|tome|work|publication|edition)\b/,
        /\b(written by|authored by|composed by|created by)\b/,
        /\b(published in|first published|originally published)\b/,
        /\b(chapter|act|scene|stanza|verse|canto|part)\b/,
        /\b(plot|story|narrative|tale|fable|legend|myth)\b/,
        /\b(protagonist|character|hero|heroine|villain)\b/,
        /\b(genre|literary|literature|fiction|non-fiction)\b/,
        /\b(ISBN|publisher|publishing house|press)\b/,
        // Title patterns
        /\b(the|a|an)\s+\w+\s+(and|or|of|in|on|at|by|for|with)\b/,
        /\b(adventures|tale|story|novel|book|poems|works|collection)\b/,
        // Specific book title patterns
        /\b(volume|part|chapter|book|section)\s+[ivx\d]+\b/i,
        /\b\d{4}\b/, // Publication year
    ];
    
    // Strong indicators this is an author page
    const authorIndicators = [
        // Author-related phrases
        /\b(author|writer|poet|novelist|playwright|essayist|critic|scholar)\b/,
        /\b(born|died|lived|biography|life|career|works|bibliography)\b/,
        /\b(was born|was an|was a|became|studied|graduated)\b/,
        /\b(married|children|family|education|university|college)\b/,
        /\b(influence|influenced by|style|literary movement)\b/,
        /\b(awards|prizes|honors|recognition|fame)\b/,
        // Title patterns that suggest author
        /\b(jr|sr|iii|iv|v)\b/i, // Name suffixes
        /\b\d{4}\s*[-–]\s*\d{4}\b/, // Birth-death years
        /\b(baron|count|duke|sir|lady|mr|mrs|dr|professor)\b/i,
    ];
    
    // Category-based indicators
    const categoryLower = categories.map(cat => cat.toLowerCase()).join(' ');
    
    const bookCategories = [
        'novels', 'books', 'poems', 'plays', 'works', 'literature',
        'fiction', 'non-fiction', 'poetry', 'drama', 'collections',
        'anthologies', 'publications', 'editions'
    ];
    
    const authorCategories = [
        'writers', 'authors', 'poets', 'novelists', 'playwrights',
        'essayists', 'critics', 'scholars', 'people', 'biographies',
        'births', 'deaths', 'century', 'nationality'
    ];
    
    // Score the indicators
    let bookScore = 0;
    let authorScore = 0;
    
    // Check content indicators
    bookIndicators.forEach(pattern => {
        if (pattern.test(contentLower)) bookScore++;
    });
    
    authorIndicators.forEach(pattern => {
        if (pattern.test(contentLower)) authorScore++;
    });
    
    // Check category indicators
    bookCategories.forEach(cat => {
        if (categoryLower.includes(cat)) bookScore += 2; // Categories are stronger indicators
    });
    
    authorCategories.forEach(cat => {
        if (categoryLower.includes(cat)) authorScore += 2;
    });
    
    // Special title patterns
    if (titleLower.includes('(novel)') || titleLower.includes('(book)') || 
        titleLower.includes('(poem)') || titleLower.includes('(play)')) {
        bookScore += 3;
    }
    
    if (titleLower.includes('(author)') || titleLower.includes('(writer)') || 
        titleLower.includes('(poet)') || titleLower.includes('(novelist)')) {
        authorScore += 3;
    }
    
    // Length-based scoring (books often have longer, more detailed content)
    if (content.length > 2000) bookScore += 1;
    if (content.length < 500) authorScore += 1;
    
    // Decision logic
    const isBook = bookScore > authorScore;
    const confidence = Math.abs(bookScore - authorScore) / Math.max(bookScore + authorScore, 1);
    
    return {
        isBook,
        confidence,
        bookScore,
        authorScore,
        reasoning: {
            title,
            contentLength: content.length,
            categories: categories.slice(0, 5), // First 5 categories
            indicators: {
                book: bookScore,
                author: authorScore
            }
        }
    };
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
    console.log('Starting enhanced Wikipedia Gutenberg book extraction...');
    console.log('This will process all articles in Category:Articles with Project Gutenberg links');
    console.log('and intelligently distinguish between book pages and author pages.');
    console.log('');

    try {
        // Get all category members
        const members = await getAllCategoryMembers('Articles with Project Gutenberg links');
        console.log(`\nFound ${members.length} total articles with Gutenberg links`);
        
        if (members.length === 0) {
            console.log('No articles found. Exiting.');
            return;
        }

        // Process articles to identify books vs authors
        console.log(`\nProcessing articles to identify books and extract Gutenberg links...`);
        const books = [];
        const authors = [];
        const errors = [];
        const stats = {
            total: members.length,
            processed: 0,
            books: 0,
            authors: 0,
            errors: 0,
            withGutenbergLinks: 0
        };
        
        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            console.log(`\n[${i + 1}/${members.length}] Processing: ${member.title}`);
            
            try {
                const contentResponse = await getPageInfo(member.title);
                
                if (!contentResponse || !contentResponse.query || !contentResponse.query.pages) {
                    console.log(`  No content found for ${member.title}`);
                    stats.errors++;
                    errors.push({
                        title: member.title,
                        error: 'No content found'
                    });
                    continue;
                }

                const pages = contentResponse.query.pages;
                const pageId = Object.keys(pages)[0];
                const pageData = pages[pageId];
                
                if (!pageData || !pageData.extract) {
                    console.log(`  No extract available for ${member.title}`);
                    stats.errors++;
                    errors.push({
                        title: member.title,
                        error: 'No extract available'
                    });
                    continue;
                }

                const content = pageData.extract;
                const extlinks = pageData.extlinks || [];
                const categories = pageData.categories ? pageData.categories.map(cat => cat.title) : [];
                const gutenbergLinks = extractGutenbergLinks(content, extlinks);
                
                // Determine if this is a book or author page
                const classification = isBookPage(member.title, content, categories);
                
                const result = {
                    title: member.title,
                    pageId: member.pageid,
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(member.title)}`,
                    gutenbergIds: gutenbergLinks,
                    wikipediaLength: pageData.length,
                    extlinksCount: extlinks.length,
                    categories: categories.slice(0, 10), // First 10 categories
                    classification: classification,
                    contentPreview: content.substring(0, 300) + '...'
                };

                if (classification.isBook) {
                    books.push(result);
                    stats.books++;
                    console.log(`  ✓ BOOK (confidence: ${(classification.confidence * 100).toFixed(1)}%) - Found ${gutenbergLinks.length} Gutenberg link(s): ${gutenbergLinks.join(', ')}`);
                } else {
                    authors.push(result);
                    stats.authors++;
                    console.log(`  ✓ AUTHOR (confidence: ${(classification.confidence * 100).toFixed(1)}%) - Found ${gutenbergLinks.length} Gutenberg link(s): ${gutenbergLinks.join(', ')}`);
                }
                
                if (gutenbergLinks.length > 0) {
                    stats.withGutenbergLinks++;
                }

                stats.processed++;

                // Save progress every 50 successful extractions
                if (stats.processed % 50 === 0) {
                    console.log(`\nSaving progress... (${stats.processed}/${stats.total} processed)`);
                    const progress = {
                        timestamp: new Date().toISOString(),
                        stats: stats,
                        books: books.slice(-10), // Last 10 books
                        authors: authors.slice(-10), // Last 10 authors
                        errors: errors.slice(-10) // Last 10 errors
                    };
                    fs.writeFileSync('enhanced-extraction-progress.json', JSON.stringify(progress, null, 2));
                }

            } catch (error) {
                console.error(`  Error processing ${member.title}: ${error.message}`);
                stats.errors++;
                errors.push({
                    title: member.title,
                    error: error.message
                });
            }
        }

        // Sort results
        books.sort((a, b) => b.wikipediaLength - a.wikipediaLength);
        authors.sort((a, b) => b.wikipediaLength - a.wikipediaLength);

        // Create final results
        const finalResults = {
            extractionDate: new Date().toISOString(),
            statistics: stats,
            books: books,
            authors: authors,
            errors: errors,
            summary: {
                totalArticles: stats.total,
                booksFound: stats.books,
                authorsFound: stats.authors,
                booksWithGutenberg: books.filter(b => b.gutenbergIds.length > 0).length,
                authorsWithGutenberg: authors.filter(a => a.gutenbergIds.length > 0).length,
                successRate: ((stats.processed / stats.total) * 100).toFixed(2) + '%',
                errorRate: ((stats.errors / stats.total) * 100).toFixed(2) + '%'
            }
        };

        fs.writeFileSync('enhanced-wikipedia-gutenberg-results.json', JSON.stringify(finalResults, null, 2));
        
        // Create a clean book library file
        const bookLibrary = books
            .filter(book => book.gutenbergIds.length > 0)
            .map(book => ({
                title: book.title,
                gutenbergId: book.gutenbergIds[0], // Use first Gutenberg ID
                wikipediaUrl: book.url,
                wikipediaLength: book.wikipediaLength,
                confidence: book.classification.confidence,
                categories: book.categories.slice(0, 5)
            }));

        fs.writeFileSync('books-with-gutenberg-links.json', JSON.stringify(bookLibrary, null, 2));
        
        console.log(`\n=== EXTRACTION COMPLETE ===`);
        console.log(`Total articles processed: ${stats.processed}`);
        console.log(`Books identified: ${stats.books}`);
        console.log(`Authors identified: ${stats.authors}`);
        console.log(`Errors: ${stats.errors}`);
        console.log(`Books with Gutenberg links: ${finalResults.summary.booksWithGutenberg}`);
        console.log(`Authors with Gutenberg links: ${finalResults.summary.authorsWithGutenberg}`);
        console.log(`Success rate: ${finalResults.summary.successRate}`);
        console.log(`\nTop 10 longest book articles:`);
        books.slice(0, 10).forEach((book, i) => {
            console.log(`  ${i + 1}. ${book.title} (${book.wikipediaLength} chars, ${book.gutenbergIds.length} Gutenberg links)`);
        });
        console.log(`\nResults saved to:`);
        console.log(`  - enhanced-wikipedia-gutenberg-results.json (complete results)`);
        console.log(`  - books-with-gutenberg-links.json (clean book library)`);
        console.log(`  - enhanced-extraction-progress.json (progress log)`);

    } catch (error) {
        console.error(`Fatal error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getAllCategoryMembers, extractGutenbergLinks, isBookPage };

