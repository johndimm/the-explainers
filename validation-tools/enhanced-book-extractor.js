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

function isLikelyBook(title) {
    const titleLower = title.toLowerCase();
    
    // Skip obvious author pages
    const authorIndicators = [
        '(author)', '(writer)', '(poet)', '(novelist)', '(playwright)', 
        '(critic)', '(scholar)', '(philosopher)', '(scientist)',
        '(mathematician)', '(physicist)', '(chemist)', '(biologist)',
        '(doctor)', '(physician)', '(lawyer)', '(judge)', '(politician)',
        '(president)', '(king)', '(queen)', '(prince)', '(princess)',
        '(duke)', '(duchess)', '(baron)', '(baroness)', '(count)',
        '(countess)', '(earl)', '(viscount)', '(marquess)', '(marquis)',
        '(sir)', '(lady)', '(lord)', '(mrs.)', '(mr.)', '(dr.)',
        '(professor)', '(reverend)', '(father)', '(mother)', '(sister)',
        '(brother)', '(pope)', '(bishop)', '(archbishop)', '(cardinal)',
        '(deacon)', '(priest)', '(monk)', '(nun)', '(abbot)', '(abbess)',
        '(prior)', '(prioress)', '(friar)', '(hermit)', '(mystic)',
        '(saint)', '(blessed)', '(venerable)', '(servant of god)',
        '(righteous)', '(martyr)', '(confessor)', '(virgin)', '(widow)'
    ];
    
    // Skip if it contains author indicators
    for (const indicator of authorIndicators) {
        if (titleLower.includes(indicator)) {
            return false;
        }
    }
    
    // If it has book indicators, it's likely a book
    const bookIndicators = [
        '(novel)', '(book)', '(poem)', '(play)', '(collection)', 
        '(anthology)', '(volume)', '(tome)', '(work)', '(publication)',
        '(edition)', '(translation)', '(version)', '(series)'
    ];
    
    for (const indicator of bookIndicators) {
        if (titleLower.includes(indicator)) {
            return true;
        }
    }
    
    // Skip single names that are likely authors
    const words = title.split(' ');
    if (words.length <= 2 && !titleLower.includes('the') && !titleLower.includes('a ') && !titleLower.includes('an ')) {
        return false;
    }
    
    return true;
}

async function main() {
    console.log('Starting enhanced book extraction from Wikipedia categories...');
    console.log('This will target additional high-value book categories');
    console.log('to find more books with Project Gutenberg links.');
    console.log('');

    // Enhanced list focusing on the most productive categories
    const enhancedCategories = [
        // High-performing categories from first run
        'Historical novels',
        'Medieval literature',
        'English-language books',
        'Poetry collections',
        'Epic poems',
        '16th-century books',
        'Young adult novels',
        'Renaissance literature',
        'Poems',
        
        // Additional promising categories
        'Scottish literature',
        'Irish literature',
        'Welsh literature',
        'Canadian literature',
        'Australian literature',
        'New Zealand literature',
        'South African literature',
        'Indian literature',
        'African literature',
        'Asian literature',
        'Latin American literature',
        'Caribbean literature',
        
        // Literary movements and periods
        'Romantic literature',
        'Gothic literature',
        'Realist literature',
        'Naturalist literature',
        'Symbolist literature',
        'Decadent literature',
        'Expressionist literature',
        'Surrealist literature',
        'Dada literature',
        'Beat literature',
        'Beat Generation',
        'Lost Generation',
        'Harlem Renaissance',
        'Southern literature',
        'Western literature',
        'Transcendentalist literature',
        
        // Specific authors' works (focusing on classics)
        'Works by William Shakespeare',
        'Works by Charles Dickens',
        'Works by Jane Austen',
        'Works by Mark Twain',
        'Works by Edgar Allan Poe',
        'Works by Herman Melville',
        'Works by Nathaniel Hawthorne',
        'Works by Henry David Thoreau',
        'Works by Ralph Waldo Emerson',
        'Works by Walt Whitman',
        'Works by Emily Dickinson',
        'Works by Louisa May Alcott',
        'Works by Harriet Beecher Stowe',
        'Works by Frederick Douglass',
        'Works by W.E.B. Du Bois',
        'Works by Booker T. Washington',
        'Works by Zora Neale Hurston',
        'Works by Langston Hughes',
        'Works by James Baldwin',
        'Works by Toni Morrison',
        'Works by Maya Angelou',
        'Works by Alice Walker',
        'Works by Samuel Beckett',
        'Works by James Joyce',
        'Works by Virginia Woolf',
        'Works by George Orwell',
        'Works by Aldous Huxley',
        'Works by H.G. Wells',
        'Works by Jules Verne',
        'Works by Arthur Conan Doyle',
        'Works by Agatha Christie',
        'Works by Dorothy L. Sayers',
        'Works by P.G. Wodehouse',
        'Works by G.K. Chesterton',
        'Works by C.S. Lewis',
        'Works by J.R.R. Tolkien',
        'Works by Roald Dahl',
        'Works by Lewis Carroll',
        'Works by Beatrix Potter',
        'Works by A.A. Milne',
        'Works by Kenneth Grahame',
        'Works by Frances Hodgson Burnett',
        'Works by L.M. Montgomery',
        'Works by Laura Ingalls Wilder',
        'Works by E.B. White',
        'Works by Dr. Seuss',
        'Works by Maurice Sendak',
        'Works by Eric Carle',
        'Works by Shel Silverstein',
        'Works by Judy Blume',
        'Works by Beverly Cleary',
        'Works by Madeleine L\'Engle',
        'Works by Katherine Paterson',
        'Works by Lois Lowry',
        'Works by Gary Paulsen',
        'Works by Jerry Spinelli',
        'Works by Christopher Paul Curtis',
        'Works by Mildred D. Taylor',
        'Works by Walter Dean Myers',
        'Works by Sharon Draper',
        'Works by Jacqueline Woodson',
        'Works by Kwame Alexander',
        'Works by Jason Reynolds',
        'Works by Angie Thomas',
        'Works by Nic Stone',
        'Works by Elizabeth Acevedo',
        'Works by Tomi Adeyemi',
        'Works by Nnedi Okorafor',
        'Works by Chimamanda Ngozi Adichie',
        'Works by Chinua Achebe',
        'Works by Wole Soyinka',
        'Works by Ngũgĩ wa Thiong\'o',
        'Works by Ama Ata Aidoo',
        'Works by Buchi Emecheta',
        'Works by Mariama Bâ',
        'Works by Assia Djebar',
        'Works by Nawal El Saadawi',
        'Works by Tahar Ben Jelloun',
        'Works by Driss Chraïbi',
        'Works by Abdelkebir Khatibi',
        'Works by Mohammed Dib',
        'Works by Kateb Yacine',
        'Works by Albert Camus',
        'Works by Jean-Paul Sartre',
        'Works by Simone de Beauvoir',
        'Works by André Gide',
        'Works by Marcel Proust',
        'Works by Gustave Flaubert',
        'Works by Victor Hugo',
        'Works by Honoré de Balzac',
        'Works by Stendhal',
        'Works by Alexandre Dumas',
        'Works by George Sand',
        'Works by Colette',
        'Works by Marguerite Duras',
        'Works by Nathalie Sarraute',
        'Works by Alain Robbe-Grillet',
        'Works by Michel Butor',
        'Works by Claude Simon',
        'Works by Marguerite Yourcenar',
        'Works by Françoise Sagan',
        'Works by Patrick Modiano',
        'Works by J.M.G. Le Clézio',
        'Works by Annie Ernaux',
        'Works by Marie NDiaye',
        'Works by Édouard Louis',
        'Works by Leïla Slimani',
        'Works by Boualem Sansal',
        'Works by Yasmina Khadra',
        'Works by Amélie Nothomb',
        'Works by Michel Houellebecq',
        'Works by Jonathan Littell',
        'Works by Laurent Binet',
        'Works by Éric Vuillard',
        'Works by Maylis de Kerangal',
        'Works by Lydie Salvayre',
        'Works by Pierre Michon',
        'Works by Pascal Quignard',
        'Works by Jean Echenoz',
        'Works by Jean-Philippe Toussaint',
        'Works by Marie Darrieussecq',
        'Works by Virginie Despentes',
        'Works by Christine Angot',
        'Works by Camille Laurens'
    ];

    const allBooks = [];
    const categoryStats = {};
    let totalBooks = 0;
    let booksWithGutenberg = 0;

    console.log(`Processing ${enhancedCategories.length} enhanced book categories...`);

    for (let i = 0; i < enhancedCategories.length; i++) {
        const category = enhancedCategories[i];
        console.log(`\n[${i + 1}/${enhancedCategories.length}] Processing Category: ${category}`);
        
        try {
            const members = await getAllCategoryMembers(category);
            console.log(`  Found ${members.length} total members in ${category}`);
            
            if (members.length === 0) {
                categoryStats[category] = { total: 0, withGutenberg: 0 };
                continue;
            }

            // Check each member for Gutenberg links (but only if it looks like a book)
            let categoryBooks = 0;
            let categoryWithGutenberg = 0;
            
            for (const member of members) {
                if (isLikelyBook(member.title)) {
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
                            pageId: member.pageid
                        });
                        
                        console.log(`    ✓ ${member.title} - Gutenberg IDs: ${gutenbergLinks.join(', ')}`);
                    }
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
            totalCategories: enhancedCategories.length,
            totalBooks: totalBooks,
            booksWithGutenberg: booksWithGutenberg,
            successRate: totalBooks > 0 ? ((booksWithGutenberg / totalBooks) * 100).toFixed(2) + '%' : '0%'
        },
        categoryStats: categoryStats,
        books: allBooks
    };

    fs.writeFileSync('enhanced-book-extraction-results.json', JSON.stringify(finalResults, null, 2));
    
    // Create a clean library file
    const library = allBooks.map(book => ({
        title: book.title,
        gutenbergId: book.gutenbergIds[0], // Use first Gutenberg ID
        wikipediaUrl: book.wikipediaUrl,
        category: book.category
    }));

    fs.writeFileSync('enhanced-books-with-gutenberg-links.json', JSON.stringify(library, null, 2));
    
    console.log(`\n=== ENHANCED EXTRACTION COMPLETE ===`);
    console.log(`Total books found: ${totalBooks}`);
    console.log(`Books with Gutenberg links: ${booksWithGutenberg}`);
    console.log(`Success rate: ${finalResults.statistics.successRate}`);
    console.log(`\nTop 15 categories by book count:`);
    
    const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 15);
    
    sortedCategories.forEach(([category, stats], i) => {
        console.log(`  ${i + 1}. ${category}: ${stats.total} books, ${stats.withGutenberg} with Gutenberg`);
    });
    
    console.log(`\nResults saved to:`);
    console.log(`  - enhanced-book-extraction-results.json (complete results)`);
    console.log(`  - enhanced-books-with-gutenberg-links.json (clean library)`);
}

if (require.main === module) {
    main();
}

module.exports = { getAllCategoryMembers, checkForGutenbergLinks, isLikelyBook };

