#!/usr/bin/env node

const fs = require('fs');

function parseCSVCorrectly(csvText) {
    const lines = csvText.split('\n');
    const books = [];
    let currentLine = '';
    let lineNumber = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        lineNumber++;
        
        // Skip header
        if (lineNumber === 1) continue;
        
        currentLine += line;
        
        // Check if this line completes a record by counting quotes
        const quoteCount = (currentLine.match(/"/g) || []).length;
        
        if (quoteCount % 2 === 0 && currentLine.trim()) {
            // This line completes a record
            try {
                const fields = parseCSVLine(currentLine);
                
                if (fields.length >= 6) {
                    books.push({
                        id: fields[0],
                        type: fields[1],
                        issued: fields[2],
                        title: fields[3],
                        language: fields[4],
                        authors: fields[5],
                        subjects: fields[6] || '',
                        locc: fields[7] || '',
                        bookshelves: fields[8] || ''
                    });
                }
            } catch (error) {
                console.log(`Error parsing line ${lineNumber}: ${error.message}`);
                console.log(`Line content: ${currentLine.substring(0, 100)}...`);
            }
            
            currentLine = '';
        } else {
            // This line is part of a multiline record, add a newline
            currentLine += '\n';
        }
    }
    
    return books;
}

function parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    fields.push(currentField.trim());
    
    return fields;
}

function testParsing() {
    console.log('Testing CSV parsing...');
    
    const csvData = fs.readFileSync('gutenberg-catalog-raw.csv', 'utf8');
    const books = parseCSVCorrectly(csvData);
    
    console.log(`Parsed ${books.length} books`);
    
    // Test a few entries
    console.log('\nFirst few entries:');
    books.slice(0, 5).forEach(book => {
        console.log(`ID: ${book.id}, Title: "${book.title}", Author: "${book.authors}"`);
    });
    
    // Test problematic entries
    console.log('\nTesting entry #2 (multiline):');
    const entry2 = books.find(book => book.id === '2');
    if (entry2) {
        console.log(`ID: ${entry2.id}`);
        console.log(`Title: "${entry2.title}"`);
        console.log(`Author: "${entry2.authors}"`);
    }
    
    // Save corrected data
    fs.writeFileSync('gutenberg-catalog-fixed.json', JSON.stringify(books, null, 2));
    console.log('\nCorrected Gutenberg catalog saved to: gutenberg-catalog-fixed.json');
    
    return books;
}

if (require.main === module) {
    testParsing();
}

module.exports = { parseCSVCorrectly, parseCSVLine };
