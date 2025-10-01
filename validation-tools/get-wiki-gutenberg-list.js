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

async function main() {
    console.log('Getting raw list of Wikipedia articles with Project Gutenberg links...');
    console.log('This will fetch the category members without filtering or checking individual pages.');
    console.log('');

    const category = 'Articles with Project Gutenberg links';
    
    try {
        const members = await getAllCategoryMembers(category);
        
        console.log(`\n=== RESULTS ===`);
        console.log(`Total articles found: ${members.length}`);
        
        // Save raw list
        const rawList = {
            category: category,
            extractionDate: new Date().toISOString(),
            totalArticles: members.length,
            articles: members.map(member => ({
                title: member.title,
                pageId: member.pageid,
                wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(member.title)}`
            }))
        };
        
        fs.writeFileSync('wiki-gutenberg-raw-list.json', JSON.stringify(rawList, null, 2));
        
        // Show first 20 articles
        console.log(`\nFirst 20 articles:`);
        members.slice(0, 20).forEach((member, index) => {
            console.log(`${index + 1}. ${member.title}`);
        });
        
        if (members.length > 20) {
            console.log(`... and ${members.length - 20} more`);
        }
        
        console.log(`\nRaw list saved to: wiki-gutenberg-raw-list.json`);
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getAllCategoryMembers };
