#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const USER_AGENT = 'The-Explainers/1.0 (https://the-explainers.com)';

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
                resolve(data);
            });
        }).on('error', reject);
    });
}

function parseCSV(csvText) {
    console.log('Parsing Gutenberg CSV catalog...');
    
    const lines = csvText.split('\n');
    const books = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            // Split by comma, but be careful of commas in quoted fields
            const fields = [];
            let currentField = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    fields.push(currentField.trim());
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            fields.push(currentField.trim()); // Add the last field
            
            if (fields.length >= 3) {
                books.push({
                    id: fields[0],
                    title: fields[1],
                    author: fields[2],
                    language: fields[3] || 'English',
                    type: fields[4] || 'Text',
                    rights: fields[5] || 'Public domain'
                });
            }
        }
    }
    
    console.log(`Parsed ${books.length} books from Gutenberg catalog`);
    return books;
}

async function main() {
    console.log('Fetching Project Gutenberg catalog...');
    console.log('This will download the complete list of all Gutenberg books.');
    console.log('');
    
    try {
        // Try the main catalog URL first
        const catalogUrl = 'https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv';
        console.log(`Fetching from: ${catalogUrl}`);
        
        const csvData = await makeRequest(catalogUrl);
        
        if (!csvData || csvData.length < 100) {
            console.error('Catalog data seems too small or empty');
            return;
        }
        
        console.log(`Downloaded ${csvData.length} characters of catalog data`);
        
        // Parse the CSV
        const books = parseCSV(csvData);
        
        if (books.length === 0) {
            console.error('No books found in catalog');
            return;
        }
        
        // Save raw CSV
        fs.writeFileSync('gutenberg-catalog-raw.csv', csvData);
        
        // Save parsed JSON
        const catalog = {
            source: 'Project Gutenberg',
            catalogUrl: catalogUrl,
            downloadDate: new Date().toISOString(),
            totalBooks: books.length,
            books: books
        };
        
        fs.writeFileSync('gutenberg-catalog.json', JSON.stringify(catalog, null, 2));
        
        // Show sample
        console.log(`\n=== GUTENBERG CATALOG SUMMARY ===`);
        console.log(`Total books: ${books.length}`);
        console.log(`\nFirst 10 books:`);
        books.slice(0, 10).forEach((book, index) => {
            console.log(`${index + 1}. [${book.id}] "${book.title}" by ${book.author}`);
        });
        
        if (books.length > 10) {
            console.log(`... and ${books.length - 10} more`);
        }
        
        console.log(`\nFiles saved:`);
        console.log(`  - gutenberg-catalog-raw.csv (raw CSV data)`);
        console.log(`  - gutenberg-catalog.json (parsed JSON)`);
        
    } catch (error) {
        console.error(`Error fetching Gutenberg catalog: ${error.message}`);
        
        // Try alternative URL
        console.log('\nTrying alternative catalog URL...');
        try {
            const altUrl = 'https://www.gutenberg.org/cache/epub/feeds/pg_catalog.rdf';
            console.log(`Fetching from: ${altUrl}`);
            
            const altData = await makeRequest(altUrl);
            console.log(`Downloaded ${altData.length} characters from alternative URL`);
            
            fs.writeFileSync('gutenberg-catalog-alternative.rdf', altData);
            console.log('Alternative catalog saved to: gutenberg-catalog-alternative.rdf');
            
        } catch (altError) {
            console.error(`Alternative URL also failed: ${altError.message}`);
        }
    }
}

if (require.main === module) {
    main();
}

module.exports = { parseCSV, makeRequest };
