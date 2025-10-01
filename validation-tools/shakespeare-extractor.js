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

async function getCategoryMembers(category, continueToken = null) {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'categorymembers',
        cmtitle: `Category:${category}`,
        cmlimit: '500',
        cmnamespace: '0'
    });

    if (continueToken) {
        params.append('cmcontinue', continueToken);
    }

    const url = `${WIKIPEDIA_API_BASE}?${params}`;
    console.log(`Fetching category: ${category}${continueToken ? ` (continue: ${continueToken.substring(0, 20)}...)` : ''}`);
    
    requestCount++;
    if (requestCount % 10 === 0) {
        console.log(`Made ${requestCount} requests so far...`);
    }
    
    await delay(DELAY_BETWEEN_REQUESTS);
    
    try {
        const response = await makeRequest(url);
        return response;
    } catch (error) {
        console.error(`Error fetching category ${category}: ${error.message}`);
        throw error;
    }
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
                console.log(`  Found ${members.length} members (total: ${pageCount})`);
                
                continueToken = response.continue ? response.continue.cmcontinue : null;
            } else {
                console.log('  No more members found');
                break;
            }
        } catch (error) {
            console.error(`Error fetching category members for ${category}: ${error.message}`);
            break;
        }
    } while (continueToken);

    return allMembers;
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

async function main() {
    console.log('Starting Shakespeare-specific extraction...');
    console.log('This will search for Shakespeare works in Wikipedia categories');
    console.log('and check for Project Gutenberg links.');
    console.log('');

    // Shakespeare-specific categories to search
    const shakespeareCategories = [
        'Shakespeare',
        'Shakespeare plays',
        'Works by William Shakespeare',
        'Hamlet',
        'Macbeth',
        'Romeo and Juliet',
        'Othello',
        'King Lear',
        'The Tempest',
        'A Midsummer Night\'s Dream',
        'Much Ado About Nothing',
        'The Merchant of Venice',
        'Twelfth Night',
        'As You Like It',
        'Julius Caesar',
        'Antony and Cleopatra',
        'King Henry IV, Part 1',
        'King Henry IV, Part 2',
        'King Henry V',
        'King Richard III',
        'King Richard II',
        'Henry VIII',
        'The Taming of the Shrew',
        'The Comedy of Errors',
        'All\'s Well That Ends Well',
        'Measure for Measure',
        'Troilus and Cressida',
        'Coriolanus',
        'Timon of Athens',
        'Cymbeline',
        'The Winter\'s Tale',
        'Pericles, Prince of Tyre',
        'The Two Noble Kinsmen',
        'Shakespeare\'s Sonnets',
        'Venus and Adonis',
        'The Rape of Lucrece',
        'A Lover\'s Complaint',
        'The Passionate Pilgrim',
        'The Phoenix and the Turtle',
        'Sonnets To Sundry Notes of Music',
        'Locrine',
        'Mucedorus',
        'Sir Thomas More'
    ];

    const allShakespeareBooks = [];
    const categoryStats = {};
    let totalBooks = 0;
    let booksWithGutenberg = 0;

    console.log(`Processing ${shakespeareCategories.length} Shakespeare categories...`);

    for (let i = 0; i < shakespeareCategories.length; i++) {
        const category = shakespeareCategories[i];
        console.log(`\n[${i + 1}/${shakespeareCategories.length}] Processing Category: ${category}`);
        
        try {
            const members = await getAllCategoryMembers(category);
            console.log(`  Found ${members.length} total members in ${category}`);
            
            if (members.length === 0) {
                categoryStats[category] = { total: 0, withGutenberg: 0 };
                continue;
            }

            // Check each member for Gutenberg links
            let categoryBooks = 0;
            let categoryWithGutenberg = 0;
            
            for (const member of members) {
                categoryBooks++;
                totalBooks++;
                
                const gutenbergLinks = await checkForGutenbergLinks(member.title);
                if (gutenbergLinks.length > 0) {
                    categoryWithGutenberg++;
                    booksWithGutenberg++;
                    
                    allShakespeareBooks.push({
                        title: member.title,
                        gutenbergIds: gutenbergLinks,
                        category: category,
                        wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(member.title)}`,
                        pageId: member.pageid
                    });
                    
                    console.log(`    ✓ ${member.title} - Gutenberg IDs: ${gutenbergLinks.join(', ')}`);
                }
            }
            
            categoryStats[category] = { 
                total: categoryBooks, 
                withGutenberg: categoryWithGutenberg 
            };
            
            console.log(`  Category ${category}: ${categoryBooks} books, ${categoryWithGutenberg} with Gutenberg links`);

        } catch (error) {
            console.error(`Error processing category ${category}: ${error.message}`);
            categoryStats[category] = { total: 0, withGutenberg: 0, error: error.message };
        }
    }

    // Save results
    const finalResults = {
        extractionDate: new Date().toISOString(),
        statistics: {
            totalCategories: shakespeareCategories.length,
            totalBooks: totalBooks,
            booksWithGutenberg: booksWithGutenberg,
            successRate: totalBooks > 0 ? ((booksWithGutenberg / totalBooks) * 100).toFixed(2) + '%' : '0%'
        },
        categoryStats: categoryStats,
        books: allShakespeareBooks
    };

    fs.writeFileSync('shakespeare-extraction-results.json', JSON.stringify(finalResults, null, 2));
    
    // Create a clean library file
    const library = allShakespeareBooks.map(book => ({
        title: book.title,
        gutenbergId: book.gutenbergIds[0], // Use first Gutenberg ID
        wikipediaUrl: book.wikipediaUrl,
        category: book.category
    }));

    fs.writeFileSync('shakespeare-books-with-gutenberg-links.json', JSON.stringify(library, null, 2));
    
    console.log(`\n=== SHAKESPEARE EXTRACTION COMPLETE ===`);
    console.log(`Total Shakespeare works found: ${totalBooks}`);
    console.log(`Shakespeare works with Gutenberg links: ${booksWithGutenberg}`);
    console.log(`Success rate: ${finalResults.statistics.successRate}`);
    console.log(`\nCategories with Shakespeare works:`);
    
    const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].total - a[1].total);
    
    sortedCategories.forEach(([category, stats]) => {
        if (stats.total > 0) {
            console.log(`  ${category}: ${stats.total} works, ${stats.withGutenberg} with Gutenberg`);
        }
    });
    
    console.log(`\nResults saved to:`);
    console.log(`  - shakespeare-extraction-results.json (complete results)`);
    console.log(`  - shakespeare-books-with-gutenberg-links.json (clean library)`);
}

if (require.main === module) {
    main();
}

module.exports = { getAllCategoryMembers, checkForGutenbergLinks };
