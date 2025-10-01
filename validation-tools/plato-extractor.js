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
    console.log('Starting Plato-specific extraction...');
    console.log('This will search for Plato works in Wikipedia categories');
    console.log('and check for Project Gutenberg links.');
    console.log('');

    // Plato-specific categories to search
    const platoCategories = [
        'Plato',
        'Works by Plato',
        'Dialogues of Plato',
        'The Republic (Plato)',
        'Apology (Plato)',
        'Phaedo',
        'Phaedrus (dialogue)',
        'Symposium (Plato)',
        'Timaeus (dialogue)',
        'Critias (dialogue)',
        'Laws (dialogue)',
        'Meno',
        'Gorgias (dialogue)',
        'Parmenides (dialogue)',
        'Theaetetus (dialogue)',
        'Sophist (dialogue)',
        'Statesman (dialogue)',
        'Protagoras (dialogue)',
        'Euthyphro',
        'Crito',
        'Ion (dialogue)',
        'Laches (dialogue)',
        'Charmides (dialogue)',
        'Lysis (dialogue)',
        'Euthydemus (dialogue)',
        'Cratylus (dialogue)',
        'Phaedrus (dialogue)',
        'Parmenides (dialogue)',
        'Theaetetus (dialogue)',
        'Sophist (dialogue)',
        'Statesman (dialogue)',
        'Philebus',
        'Seventh Letter',
        'Ancient Greek philosophy',
        'Classical philosophy',
        'Socratic dialogues',
        'Platonic philosophy',
        'Greek philosophy',
        'Western philosophy',
        'Philosophy of Plato',
        'Platonism',
        'Ancient Greek literature',
        'Classical literature',
        'Philosophical literature',
        'Philosophical works',
        'Philosophical texts',
        'Ancient philosophy',
        'Classical texts',
        'Greek literature',
        'Ancient Greek texts',
        'Classical Greek philosophy',
        'Socratic philosophy',
        'Ancient Greek thinkers',
        'Greek philosophers',
        'Ancient philosophers',
        'Classical philosophers'
    ];

    const allPlatoBooks = [];
    const categoryStats = {};
    let totalBooks = 0;
    let booksWithGutenberg = 0;

    console.log(`Processing ${platoCategories.length} Plato-related categories...`);

    for (let i = 0; i < platoCategories.length; i++) {
        const category = platoCategories[i];
        console.log(`\n[${i + 1}/${platoCategories.length}] Processing Category: ${category}`);
        
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
                    
                    allPlatoBooks.push({
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
            totalCategories: platoCategories.length,
            totalBooks: totalBooks,
            booksWithGutenberg: booksWithGutenberg,
            successRate: totalBooks > 0 ? ((booksWithGutenberg / totalBooks) * 100).toFixed(2) + '%' : '0%'
        },
        categoryStats: categoryStats,
        books: allPlatoBooks
    };

    fs.writeFileSync('plato-extraction-results.json', JSON.stringify(finalResults, null, 2));
    
    // Create a clean library file
    const library = allPlatoBooks.map(book => ({
        title: book.title,
        gutenbergId: book.gutenbergIds[0], // Use first Gutenberg ID
        wikipediaUrl: book.wikipediaUrl,
        category: book.category
    }));

    fs.writeFileSync('plato-books-with-gutenberg-links.json', JSON.stringify(library, null, 2));
    
    console.log(`\n=== PLATO EXTRACTION COMPLETE ===`);
    console.log(`Total Plato-related works found: ${totalBooks}`);
    console.log(`Plato works with Gutenberg links: ${booksWithGutenberg}`);
    console.log(`Success rate: ${finalResults.statistics.successRate}`);
    console.log(`\nCategories with Plato works:`);
    
    const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].total - a[1].total);
    
    sortedCategories.forEach(([category, stats]) => {
        if (stats.total > 0) {
            console.log(`  ${category}: ${stats.total} works, ${stats.withGutenberg} with Gutenberg`);
        }
    });
    
    console.log(`\nResults saved to:`);
    console.log(`  - plato-extraction-results.json (complete results)`);
    console.log(`  - plato-books-with-gutenberg-links.json (clean library)`);
}

if (require.main === module) {
    main();
}

module.exports = { getAllCategoryMembers, checkForGutenbergLinks };
