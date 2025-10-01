#!/usr/bin/env node

const https = require('https');

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'The-Explainers/1.0 (https://the-explainers.com)';

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': USER_AGENT
            }
        };

        console.log(`Making request to: ${url}`);
        
        https.get(url, options, (res) => {
            console.log(`Response status: ${res.statusCode}`);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    console.error(`Failed to parse JSON: ${e.message}`);
                    console.error(`Response data: ${data.substring(0, 500)}`);
                    reject(new Error(`Failed to parse JSON: ${e.message}`));
                }
            });
        }).on('error', (error) => {
            console.error(`Request error: ${error.message}`);
            reject(error);
        });
    });
}

async function testCategoryMembers() {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'categorymembers',
        cmtitle: 'Category:Articles with Project Gutenberg links',
        cmlimit: '10',
        cmnamespace: '0'
    });

    const url = `${WIKIPEDIA_API_BASE}?${params}`;
    console.log('Testing Wikipedia API...');
    
    try {
        const response = await makeRequest(url);
        console.log('Success! Response keys:', Object.keys(response));
        
        if (response.query && response.query.categorymembers) {
            console.log(`Found ${response.query.categorymembers.length} members`);
            console.log('First few members:');
            response.query.categorymembers.slice(0, 3).forEach((member, i) => {
                console.log(`  ${i + 1}. ${member.title}`);
            });
        } else {
            console.log('No category members found');
            console.log('Response structure:', JSON.stringify(response, null, 2));
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

testCategoryMembers();

