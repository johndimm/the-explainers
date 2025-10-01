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

function isLikelyBook(title, category) {
    // Filter out obvious non-books
    const titleLower = title.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    // Skip if it's a list, category, or meta page
    if (titleLower.includes('list of') || 
        titleLower.includes('category:') ||
        titleLower.includes('outline of') ||
        titleLower.includes('index of') ||
        titleLower.includes('timeline of') ||
        titleLower.includes('bibliography of')) {
        return false;
    }
    
    // Skip if it's about an author rather than a book
    if (titleLower.includes('biography') ||
        titleLower.includes('life of') ||
        titleLower.includes('works of') ||
        titleLower.includes('collected works') ||
        titleLower.includes('complete works')) {
        return false;
    }
    
    // Skip if it's a play/performance rather than the text
    if (titleLower.includes('production') ||
        titleLower.includes('performance') ||
        titleLower.includes('adaptation') ||
        titleLower.includes('film') ||
        titleLower.includes('movie')) {
        return false;
    }
    
    return true;
}

async function main() {
    console.log('Starting comprehensive Wikipedia + Gutenberg extraction...');
    console.log('This will find all books that exist in both Wikipedia and Project Gutenberg.');
    console.log('');

    // Comprehensive list of book categories
    const bookCategories = [
        // Literature by period
        'Classical literature',
        'Medieval literature', 
        'Renaissance literature',
        '18th-century literature',
        '19th-century literature',
        '20th-century literature',
        '21st-century literature',
        
        // Literature by genre
        'Novels',
        'Poems',
        'Plays',
        'Short stories',
        'Epic poems',
        'Historical novels',
        'Science fiction novels',
        'Fantasy novels',
        'Romance novels',
        'Mystery novels',
        'Horror novels',
        'Adventure novels',
        'Children\'s books',
        'Young adult novels',
        
        // Literature by language
        'English literature',
        'American literature',
        'British literature',
        'French literature',
        'German literature',
        'Italian literature',
        'Spanish literature',
        'Russian literature',
        'Greek literature',
        'Latin literature',
        
        // Literature by author
        'Works by William Shakespeare',
        'Works by Charles Dickens',
        'Works by Jane Austen',
        'Works by Mark Twain',
        'Works by Edgar Allan Poe',
        'Works by Oscar Wilde',
        'Works by Virginia Woolf',
        'Works by George Orwell',
        'Works by Ernest Hemingway',
        'Works by F. Scott Fitzgerald',
        
        // Philosophy and non-fiction
        'Philosophical works',
        'Religious texts',
        'Historical works',
        'Scientific works',
        'Political works',
        'Economic works',
        
        // Specific important works
        'Bible translations',
        'Shakespeare plays',
        'Greek tragedies',
        'Roman literature',
        'Ancient Greek philosophy',
        'Classical philosophy',
        'Modern philosophy'
    ];

    const allBooks = [];
    const categoryStats = {};
    let totalBooks = 0;
    let booksWithGutenberg = 0;

    console.log(`Processing ${bookCategories.length} book categories...`);

    for (let i = 0; i < bookCategories.length; i++) {
        const category = bookCategories[i];
        console.log(`\n[${i + 1}/${bookCategories.length}] Processing Category: ${category}`);
        
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
                // Skip if not likely to be a book
                if (!isLikelyBook(member.title, category)) {
                    continue;
                }

                categoryBooks++;
                totalBooks++;
                
                const gutenbergLinks = await checkForGutenbergLinks(member.title);
                if (gutenbergLinks.length > 0) {
                    categoryWithGutenberg++;
                    booksWithGutenberg++;
                    
                    allBooks.push({
                        title: member.title,
                    gutenbergIds: gutenbergLinks,
                        category: category,
                        wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(member.title)}`,
                        wikipediaTitle: member.title,
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
            totalCategories: bookCategories.length,
            totalBooks: totalBooks,
            booksWithGutenberg: booksWithGutenberg,
            successRate: totalBooks > 0 ? ((booksWithGutenberg / totalBooks) * 100).toFixed(2) + '%' : '0%'
        },
        categoryStats: categoryStats,
        books: allBooks
    };

    fs.writeFileSync('comprehensive-extraction-results.json', JSON.stringify(finalResults, null, 2));
    
    // Create a clean library file in the app format
    const library = allBooks.map(book => ({
        id: book.gutenbergIds[0], // Use first Gutenberg ID
            title: book.title,
        author: "Unknown", // We'll need to extract this separately
        wikipediaUrl: book.wikipediaUrl,
        wikipediaTitle: book.wikipediaTitle
    }));

    fs.writeFileSync('comprehensive-library.json', JSON.stringify(library, null, 2));
    
    console.log(`\n=== COMPREHENSIVE EXTRACTION COMPLETE ===`);
    console.log(`Total books found: ${totalBooks}`);
    console.log(`Books with Gutenberg links: ${booksWithGutenberg}`);
    console.log(`Success rate: ${finalResults.statistics.successRate}`);
    console.log(`\nCategories with most books:`);
    
    const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].withGutenberg - a[1].withGutenberg)
        .slice(0, 10);
    
    sortedCategories.forEach(([category, stats]) => {
        if (stats.withGutenberg > 0) {
            console.log(`  ${category}: ${stats.withGutenberg} books with Gutenberg`);
        }
    });
    
    console.log(`\nResults saved to:`);
    console.log(`  - comprehensive-extraction-results.json (complete results)`);
    console.log(`  - comprehensive-library.json (clean library format)`);
}

if (require.main === module) {
    main();
}

module.exports = { getAllCategoryMembers, checkForGutenbergLinks, isLikelyBook };