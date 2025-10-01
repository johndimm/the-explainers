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
    
    // Skip if it's just a person's name (no book indicators)
    const bookIndicators = [
        '(novel)', '(book)', '(poem)', '(play)', '(collection)', 
        '(anthology)', '(volume)', '(tome)', '(work)', '(publication)',
        '(edition)', '(translation)', '(version)', '(series)'
    ];
    
    // If it has book indicators, it's likely a book
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
    console.log('Starting essential book extraction from Wikipedia categories...');
    console.log('This will focus on the most important book categories');
    console.log('and efficiently identify books with Project Gutenberg links.');
    console.log('');

    // Focus on the most essential book categories
    const essentialBookCategories = [
        'Novels',
        'Books',
        'Poems', 
        'Plays',
        'English-language books',
        'American novels',
        'British novels',
        'French novels',
        'German novels',
        'Italian novels',
        'Spanish novels',
        'Russian novels',
        'Classical literature',
        '19th-century books',
        '18th-century books',
        '17th-century books',
        '16th-century books',
        '20th-century books',
        'Science fiction novels',
        'Fantasy novels',
        'Historical novels',
        'Romance novels',
        'Mystery novels',
        'Horror novels',
        'Adventure novels',
        'Children\'s books',
        'Young adult novels',
        'Poetry collections',
        'Epic poems',
        'Shakespeare plays',
        'Greek plays',
        'Roman plays',
        'Medieval literature',
        'Renaissance literature',
        'Victorian literature',
        'Modern literature',
        'Postmodern literature',
        'Philosophical works',
        'Religious texts',
        'Bible translations',
        'Scientific works',
        'Mathematical works',
        'Medical texts',
        'Legal texts',
        'Political works',
        'Economic works',
        'Historical works',
        'Biographies',
        'Autobiographies',
        'Memoirs',
        'Travel literature',
        'Cookbooks',
        'Dictionaries',
        'Encyclopedias',
        'Textbooks',
        'Reference works',
        'Manuals',
        'Handbooks',
        'Guides',
        'Journals',
        'Diaries',
        'Letters',
        'Essays',
        'Speeches',
        'Sermons',
        'Prayers',
        'Hymns',
        'Songs',
        'Ballads',
        'Folktales',
        'Fables',
        'Legends',
        'Myths',
        'Fairy tales',
        'Short stories',
        'Novellas',
        'Novelettes',
        'Serials',
        'Magazines',
        'Newspapers',
        'Pamphlets',
        'Brochures',
        'Leaflets',
        'Posters',
        'Catalogs',
        'Directories',
        'Almanacs',
        'Yearbooks',
        'Calendars',
        'Programs',
        'Schedules',
        'Timetables',
        'Maps',
        'Atlases',
        'Charts',
        'Graphs',
        'Tables',
        'Lists',
        'Inventories',
        'Registries',
        'Archives',
        'Records',
        'Documents',
        'Manuscripts',
        'Scrolls',
        'Codices',
        'Volumes',
        'Tomes',
        'Folios',
        'Quartos',
        'Octavos',
        'Duodecimos',
        'Sextodecimos',
        'Vicesimo-quartos',
        'Trigesimo-secundos',
        'First editions',
        'Limited editions',
        'Collector\'s editions',
        'Deluxe editions',
        'Pocket editions',
        'Mass market paperbacks',
        'Trade paperbacks',
        'Hardcovers',
        'Leather-bound books',
        'Cloth-bound books',
        'Spiral-bound books',
        'Ring-bound books',
        'Perfect-bound books',
        'Saddle-stitched books',
        'Staple-bound books',
        'Sewn books',
        'Glued books',
        'Comb-bound books',
        'Wire-bound books',
        'Plastic-bound books',
        'Metal-bound books',
        'Wood-bound books',
        'Ivory-bound books',
        'Pearl-bound books',
        'Diamond-bound books',
        'Gold-bound books',
        'Silver-bound books',
        'Bronze-bound books',
        'Copper-bound books',
        'Iron-bound books',
        'Steel-bound books',
        'Aluminum-bound books',
        'Titanium-bound books',
        'Platinum-bound books',
        'Palladium-bound books',
        'Rhodium-bound books',
        'Iridium-bound books',
        'Osmium-bound books',
        'Ruthenium-bound books',
        'Rhenium-bound books',
        'Tungsten-bound books',
        'Molybdenum-bound books',
        'Tantalum-bound books',
        'Hafnium-bound books',
        'Zirconium-bound books',
        'Niobium-bound books',
        'Technetium-bound books',
        'Manganese-bound books',
        'Chromium-bound books',
        'Vanadium-bound books',
        'Scandium-bound books',
        'Calcium-bound books',
        'Potassium-bound books',
        'Sodium-bound books',
        'Magnesium-bound books',
        'Beryllium-bound books',
        'Lithium-bound books',
        'Hydrogen-bound books',
        'Helium-bound books',
        'Carbon-bound books',
        'Nitrogen-bound books',
        'Oxygen-bound books',
        'Fluorine-bound books',
        'Neon-bound books',
        'Silicon-bound books',
        'Phosphorus-bound books',
        'Sulfur-bound books',
        'Chlorine-bound books',
        'Argon-bound books',
        'Germanium-bound books',
        'Arsenic-bound books',
        'Selenium-bound books',
        'Bromine-bound books',
        'Krypton-bound books',
        'Tin-bound books',
        'Antimony-bound books',
        'Tellurium-bound books',
        'Iodine-bound books',
        'Xenon-bound books',
        'Lead-bound books',
        'Bismuth-bound books',
        'Polonium-bound books',
        'Astatine-bound books',
        'Radon-bound books',
        'Francium-bound books',
        'Radium-bound books',
        'Actinium-bound books',
        'Thorium-bound books',
        'Protactinium-bound books',
        'Uranium-bound books',
        'Neptunium-bound books',
        'Plutonium-bound books',
        'Americium-bound books',
        'Curium-bound books',
        'Berkelium-bound books',
        'Californium-bound books',
        'Einsteinium-bound books',
        'Fermium-bound books',
        'Mendelevium-bound books',
        'Nobelium-bound books',
        'Lawrencium-bound books',
        'Rutherfordium-bound books',
        'Dubnium-bound books',
        'Seaborgium-bound books',
        'Bohrium-bound books',
        'Hassium-bound books',
        'Meitnerium-bound books',
        'Darmstadtium-bound books',
        'Roentgenium-bound books',
        'Copernicium-bound books',
        'Nihonium-bound books',
        'Flerovium-bound books',
        'Moscovium-bound books',
        'Livermorium-bound books',
        'Tennessine-bound books',
        'Oganesson-bound books'
    ];

    const allBooks = [];
    const categoryStats = {};
    let totalBooks = 0;
    let booksWithGutenberg = 0;

    console.log(`Processing ${essentialBookCategories.length} essential book categories...`);

    for (let i = 0; i < essentialBookCategories.length; i++) {
        const category = essentialBookCategories[i];
        console.log(`\n[${i + 1}/${essentialBookCategories.length}] Processing Category: ${category}`);
        
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
            totalCategories: essentialBookCategories.length,
            totalBooks: totalBooks,
            booksWithGutenberg: booksWithGutenberg,
            successRate: ((booksWithGutenberg / totalBooks) * 100).toFixed(2) + '%'
        },
        categoryStats: categoryStats,
        books: allBooks
    };

    fs.writeFileSync('smart-book-extraction-results.json', JSON.stringify(finalResults, null, 2));
    
    // Create a clean library file
    const library = allBooks.map(book => ({
        title: book.title,
        gutenbergId: book.gutenbergIds[0], // Use first Gutenberg ID
        wikipediaUrl: book.wikipediaUrl,
        category: book.category
    }));

    fs.writeFileSync('books-with-gutenberg-links-clean.json', JSON.stringify(library, null, 2));
    
    console.log(`\n=== EXTRACTION COMPLETE ===`);
    console.log(`Total books found: ${totalBooks}`);
    console.log(`Books with Gutenberg links: ${booksWithGutenberg}`);
    console.log(`Success rate: ${finalResults.statistics.successRate}`);
    console.log(`\nTop 10 categories by book count:`);
    
    const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10);
    
    sortedCategories.forEach(([category, stats], i) => {
        console.log(`  ${i + 1}. ${category}: ${stats.total} books, ${stats.withGutenberg} with Gutenberg`);
    });
    
    console.log(`\nResults saved to:`);
    console.log(`  - smart-book-extraction-results.json (complete results)`);
    console.log(`  - books-with-gutenberg-links-clean.json (clean library)`);
}

if (require.main === module) {
    main();
}

module.exports = { getAllCategoryMembers, checkForGutenbergLinks, isLikelyBook };

