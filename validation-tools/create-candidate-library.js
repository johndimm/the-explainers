#!/usr/bin/env node

const fs = require('fs');

function loadEnhancedData() {
    console.log('Loading enhanced library data...');
    
    const enhancedLibrary = JSON.parse(fs.readFileSync('enhanced-library.json', 'utf8'));
    console.log(`Loaded ${enhancedLibrary.matches.length} enhanced matches`);
    
    return enhancedLibrary;
}

function createCandidateLibrary(enhancedLibrary) {
    console.log('\nCreating candidate library with lowest Gutenberg IDs...');
    
    // Group matches by Wikipedia title
    const matchesByWikiTitle = new Map();
    
    enhancedLibrary.matches.forEach(match => {
        const wikiTitle = match.wikiTitle;
        
        if (!matchesByWikiTitle.has(wikiTitle)) {
            matchesByWikiTitle.set(wikiTitle, []);
        }
        
        matchesByWikiTitle.get(wikiTitle).push(match);
    });
    
    console.log(`Found ${matchesByWikiTitle.size} unique Wikipedia titles`);
    
    // Select the match with lowest Gutenberg ID for each Wikipedia title
    const candidateLibrary = [];
    
    matchesByWikiTitle.forEach((matches, wikiTitle) => {
        // Sort by Gutenberg ID (ascending) and take the first one
        const sortedMatches = matches.sort((a, b) => {
            const idA = parseInt(a.gutenbergId) || 999999;
            const idB = parseInt(b.gutenbergId) || 999999;
            return idA - idB;
        });
        
        const selectedMatch = sortedMatches[0];
        
        candidateLibrary.push({
            title: selectedMatch.gutenbergTitle,
            author: selectedMatch.gutenbergAuthors,
            gutenbergId: selectedMatch.gutenbergId,
            language: selectedMatch.gutenbergLanguage,
            wikipediaTitle: selectedMatch.wikiTitle,
            wikipediaUrl: selectedMatch.wikipediaUrl,
            matchType: selectedMatch.matchType,
            // Add some additional fields for the library
            category: determineCategory(selectedMatch),
            description: generateDescription(selectedMatch),
            year: extractYear(selectedMatch.gutenbergId)
        });
    });
    
    console.log(`Created candidate library with ${candidateLibrary.length} books`);
    
    // Sort by title for better organization
    candidateLibrary.sort((a, b) => a.title.localeCompare(b.title));
    
    return candidateLibrary;
}

function determineCategory(match) {
    const title = match.gutenbergTitle.toLowerCase();
    const authors = match.gutenbergAuthors.toLowerCase();
    
    if (authors.includes('shakespeare')) {
        return 'Shakespeare';
    } else if (authors.includes('plato')) {
        return 'Philosophy';
    } else if (title.includes('poem') || title.includes('poetry')) {
        return 'Poetry';
    } else if (title.includes('history')) {
        return 'History';
    } else if (title.includes('science') || title.includes('philosophy')) {
        return 'Philosophy';
    } else if (title.includes('novel') || title.includes('story')) {
        return 'Literature';
    } else {
        return 'Literature';
    }
}

function generateDescription(match) {
    const title = match.gutenbergTitle;
    const author = match.gutenbergAuthors;
    
    if (match.matchType === 'shakespeare-enhanced') {
        return `A play by William Shakespeare. ${title} is one of Shakespeare's most famous works, available in the public domain through Project Gutenberg.`;
    } else if (match.matchType === 'plato-enhanced') {
        return `A philosophical dialogue by Plato. ${title} explores fundamental questions of philosophy and remains a cornerstone of Western thought.`;
    } else {
        return `${title} by ${author}. This classic work is available in the public domain through Project Gutenberg.`;
    }
}

function extractYear(gutenbergId) {
    // Simple heuristic: older Gutenberg IDs are generally older works
    const id = parseInt(gutenbergId);
    if (id < 1000) return '1800s';
    if (id < 5000) return '1900s';
    if (id < 20000) return '1910s';
    if (id < 50000) return '1920s-1950s';
    return '1950s+';
}

function main() {
    try {
        const enhancedLibrary = loadEnhancedData();
        const candidateLibrary = createCandidateLibrary(enhancedLibrary);
        
        // Create the library object
        const libraryData = {
            name: "Enhanced Wikipedia-Gutenberg Library",
            description: "A comprehensive library of books available in both Wikipedia and Project Gutenberg, enhanced with Shakespeare and Plato works",
            totalBooks: candidateLibrary.length,
            lastUpdated: new Date().toISOString(),
            sources: [
                "Wikipedia articles with Project Gutenberg links",
                "Project Gutenberg catalog",
                "Enhanced matching for Shakespeare and Plato works"
            ],
            books: candidateLibrary
        };
        
        // Save the candidate library
        fs.writeFileSync('candidate-library.json', JSON.stringify(libraryData, null, 2));
        console.log('\nCandidate library saved to: candidate-library.json');
        
        // Show statistics
        const categories = {};
        candidateLibrary.forEach(book => {
            categories[book.category] = (categories[book.category] || 0) + 1;
        });
        
        console.log('\n=== LIBRARY STATISTICS ===');
        console.log(`Total books: ${candidateLibrary.length}`);
        console.log('\nBy category:');
        Object.entries(categories).forEach(([category, count]) => {
            console.log(`  ${category}: ${count}`);
        });
        
        // Show some examples
        console.log('\n=== SAMPLE BOOKS ===');
        candidateLibrary.slice(0, 10).forEach(book => {
            console.log(`"${book.title}" by ${book.author} [ID: ${book.gutenbergId}] (${book.category})`);
        });
        
        console.log('\n=== SHAKESPEARE WORKS ===');
        const shakespeareWorks = candidateLibrary.filter(book => book.category === 'Shakespeare');
        console.log(`Found ${shakespeareWorks.length} Shakespeare works:`);
        shakespeareWorks.slice(0, 10).forEach(book => {
            console.log(`  "${book.title}" [ID: ${book.gutenbergId}]`);
        });
        
        console.log('\n=== PLATO WORKS ===');
        const platoWorks = candidateLibrary.filter(book => book.category === 'Philosophy' && book.author.toLowerCase().includes('plato'));
        console.log(`Found ${platoWorks.length} Plato works:`);
        platoWorks.slice(0, 10).forEach(book => {
            console.log(`  "${book.title}" [ID: ${book.gutenbergId}]`);
        });
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createCandidateLibrary, determineCategory, generateDescription };
