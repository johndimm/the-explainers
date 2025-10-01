#!/usr/bin/env node

const fs = require('fs');

function loadData() {
    console.log('Loading data for Shakespeare analysis...');
    
    // Load Wikipedia articles
    const wikiData = JSON.parse(fs.readFileSync('wiki-gutenberg-raw-list.json', 'utf8'));
    console.log(`Loaded ${wikiData.articles.length} Wikipedia articles`);
    
    // Load matches
    const matchesData = JSON.parse(fs.readFileSync('fixed-exact-title-matches.json', 'utf8'));
    console.log(`Loaded ${matchesData.matches.length} matches`);
    
    return { wikiData, matchesData };
}

function getShakespearePlays() {
    // Complete list of Shakespeare plays
    return [
        // Tragedies
        'Antony and Cleopatra',
        'Coriolanus',
        'Hamlet',
        'Julius Caesar',
        'King Lear',
        'Macbeth',
        'Othello',
        'Romeo and Juliet',
        'Timon of Athens',
        'Titus Andronicus',
        'Troilus and Cressida',
        
        // Comedies
        'All\'s Well That Ends Well',
        'As You Like It',
        'The Comedy of Errors',
        'Cymbeline',
        'Love\'s Labour\'s Lost',
        'Measure for Measure',
        'The Merchant of Venice',
        'The Merry Wives of Windsor',
        'A Midsummer Night\'s Dream',
        'Much Ado About Nothing',
        'Pericles',
        'The Taming of the Shrew',
        'The Tempest',
        'Twelfth Night',
        'The Two Gentlemen of Verona',
        'The Two Noble Kinsmen',
        'The Winter\'s Tale',
        
        // Histories
        'King John',
        'King Richard II',
        'King Henry IV, Part 1',
        'King Henry IV, Part 2',
        'King Henry V',
        'King Henry VI, Part 1',
        'King Henry VI, Part 2',
        'King Henry VI, Part 3',
        'King Richard III',
        'King Henry VIII',
        
        // Poems
        'Sonnets',
        'Venus and Adonis',
        'The Rape of Lucrece',
        'A Lover\'s Complaint',
        'The Phoenix and the Turtle',
        'The Passionate Pilgrim'
    ];
}

function analyzeShakespeare(wikiData, matchesData) {
    console.log('\n=== SHAKESPEARE ANALYSIS ===');
    
    const shakespearePlays = getShakespearePlays();
    console.log(`Analyzing ${shakespearePlays.length} Shakespeare works`);
    
    const foundInWiki = [];
    const foundInGutenberg = [];
    const notFoundInWiki = [];
    const notFoundInGutenberg = [];
    
    // Check which Shakespeare plays are in Wikipedia
    shakespearePlays.forEach(play => {
        const wikiMatch = wikiData.articles.find(article => 
            normalizeTitle(article.title) === normalizeTitle(play)
        );
        
        if (wikiMatch) {
            foundInWiki.push({
                title: play,
                wikiTitle: wikiMatch.title,
                wikiUrl: wikiMatch.wikipediaUrl
            });
        } else {
            notFoundInWiki.push(play);
        }
    });
    
    // Check which Shakespeare plays are in Gutenberg (via matches)
    const shakespeareMatches = matchesData.matches.filter(match => 
        match.gutenbergAuthors && match.gutenbergAuthors.includes('Shakespeare, William, 1564-1616')
    );
    
    shakespearePlays.forEach(play => {
        const gutenbergMatch = shakespeareMatches.find(match => 
            normalizeTitle(match.wikipediaTitle) === normalizeTitle(play) ||
            normalizeTitle(match.gutenbergTitle) === normalizeTitle(play)
        );
        
        if (gutenbergMatch) {
            foundInGutenberg.push({
                title: play,
                wikiTitle: gutenbergMatch.wikipediaTitle,
                gutenbergTitle: gutenbergMatch.gutenbergTitle,
                gutenbergId: gutenbergMatch.gutenbergId,
                versions: shakespeareMatches.filter(m => 
                    normalizeTitle(m.wikipediaTitle) === normalizeTitle(play) ||
                    normalizeTitle(m.gutenbergTitle) === normalizeTitle(play)
                ).length
            });
        } else {
            notFoundInGutenberg.push(play);
        }
    });
    
    // Generate report
    console.log(`\nShakespeare works found in Wikipedia: ${foundInWiki.length}/${shakespearePlays.length}`);
    console.log(`Shakespeare works found in Gutenberg: ${foundInGutenberg.length}/${shakespearePlays.length}`);
    console.log(`Shakespeare works NOT in Wikipedia: ${notFoundInWiki.length}`);
    console.log(`Shakespeare works NOT in Gutenberg: ${notFoundInGutenberg.length}`);
    
    console.log('\n=== SHAKESPEARE WORKS FOUND IN GUTENBERG ===');
    foundInGutenberg.forEach(work => {
        console.log(`✓ "${work.title}" - ${work.versions} version(s) [ID: ${work.gutenbergId}]`);
    });
    
    console.log('\n=== SHAKESPEARE WORKS NOT FOUND IN GUTENBERG ===');
    notFoundInGutenberg.forEach(work => {
        console.log(`✗ "${work}"`);
    });
    
    console.log('\n=== SHAKESPEARE WORKS NOT FOUND IN WIKIPEDIA ===');
    notFoundInWiki.forEach(work => {
        console.log(`✗ "${work}"`);
    });
    
    // Show works with multiple versions
    const multiVersionWorks = foundInGutenberg.filter(work => work.versions > 1);
    if (multiVersionWorks.length > 0) {
        console.log('\n=== SHAKESPEARE WORKS WITH MULTIPLE GUTENBERG VERSIONS ===');
        multiVersionWorks.forEach(work => {
            console.log(`"${work.title}": ${work.versions} versions`);
        });
    }
    
    return {
        foundInWiki,
        foundInGutenberg,
        notFoundInWiki,
        notFoundInGutenberg,
        multiVersionWorks
    };
}

function normalizeTitle(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ');   // Normalize whitespace
}

function main() {
    try {
        const { wikiData, matchesData } = loadData();
        const results = analyzeShakespeare(wikiData, matchesData);
        
        // Save results
        const analysisResults = {
            analysisDate: new Date().toISOString(),
            statistics: {
                totalShakespeareWorks: getShakespearePlays().length,
                foundInWikipedia: results.foundInWiki.length,
                foundInGutenberg: results.foundInGutenberg.length,
                notInWikipedia: results.notFoundInWiki.length,
                notInGutenberg: results.notFoundInGutenberg.length
            },
            results
        };
        
        fs.writeFileSync('shakespeare-analysis.json', JSON.stringify(analysisResults, null, 2));
        console.log('\nAnalysis saved to: shakespeare-analysis.json');
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getShakespearePlays, analyzeShakespeare, normalizeTitle };
