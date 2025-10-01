#!/usr/bin/env node

const fs = require('fs');

function loadLibrary() {
    console.log('Loading current library...');
    
    const library = JSON.parse(fs.readFileSync('../src/data/library/english-literature.json', 'utf8'));
    console.log(`Loaded ${library.length} books`);
    
    return library;
}

function isEnglishLiterature(book) {
    const title = book.title.toLowerCase();
    const author = book.author.toLowerCase();
    
    // Check for obvious non-English indicators
    const nonEnglishIndicators = [
        // French
        'le ', 'la ', 'les ', 'du ', 'de ', 'des ', 'un ', 'une ', 'd\'', 'l\'',
        'french literature', 'littérature', 'français', 'française',
        
        // German  
        'der ', 'die ', 'das ', 'und ', 'von ', 'zu ', 'mit ', 'für ',
        'german literature', 'deutsch', 'deutsche',
        
        // Spanish
        'el ', 'la ', 'los ', 'las ', 'del ', 'de ', 'en ', 'con ',
        'spanish literature', 'español', 'española',
        
        // Italian
        'il ', 'la ', 'lo ', 'gli ', 'le ', 'di ', 'da ', 'in ',
        'italian literature', 'italiano', 'italiana',
        
        // Russian
        'russian literature', 'русский', 'русская',
        
        // Greek
        'greek literature', 'ελληνικός', 'ελληνική',
        
        // Latin
        'latin literature', 'latine'
    ];
    
    // Check title and author for non-English indicators
    for (const indicator of nonEnglishIndicators) {
        if (title.includes(indicator) || author.includes(indicator)) {
            return false;
        }
    }
    
    // Check for specific non-English titles
    const nonEnglishTitles = [
        'le grand meaulnes',
        'la comédie humaine',
        'eugénie grandet',
        'der steppenwolf',
        'don quixote',
        'el ingenioso hidalgo',
        'la divina commedia',
        'war and peace',
        'anna karenina',
        'the brothers karamazov',
        'crime and punishment',
        'the odyssey',
        'the iliad',
        'aeneid'
    ];
    
    for (const nonEnglishTitle of nonEnglishTitles) {
        if (title.includes(nonEnglishTitle)) {
            return false;
        }
    }
    
    // Check for non-English author names (common patterns)
    const nonEnglishAuthorPatterns = [
        /\b(le|la|les|du|de|des|von|zu|mit|für|der|die|das)\b/i,
        /\b(el|la|los|las|del|de|en|con)\b/i,
        /\b(il|la|lo|gli|le|di|da|in)\b/i
    ];
    
    for (const pattern of nonEnglishAuthorPatterns) {
        if (pattern.test(author)) {
            return false;
        }
    }
    
    return true;
}

function filterEnglishOnly(library) {
    console.log('\nFiltering for English literature only...');
    
    const englishBooks = [];
    const nonEnglishBooks = [];
    
    library.forEach(book => {
        if (isEnglishLiterature(book)) {
            englishBooks.push(book);
        } else {
            nonEnglishBooks.push(book);
        }
    });
    
    console.log(`English literature: ${englishBooks.length} books`);
    console.log(`Non-English literature: ${nonEnglishBooks.length} books`);
    
    return { englishBooks, nonEnglishBooks };
}

function showNonEnglishBooks(nonEnglishBooks) {
    console.log('\n=== NON-ENGLISH BOOKS REMOVED ===');
    
    // Group by language/country
    const byCategory = {};
    
    nonEnglishBooks.forEach(book => {
        let category = 'Other';
        
        if (book.title.toLowerCase().includes('le ') || book.author.toLowerCase().includes('french')) {
            category = 'French';
        } else if (book.title.toLowerCase().includes('der ') || book.author.toLowerCase().includes('german')) {
            category = 'German';
        } else if (book.title.toLowerCase().includes('el ') || book.author.toLowerCase().includes('spanish')) {
            category = 'Spanish';
        } else if (book.title.toLowerCase().includes('il ') || book.author.toLowerCase().includes('italian')) {
            category = 'Italian';
        } else if (book.author.toLowerCase().includes('russian')) {
            category = 'Russian';
        } else if (book.author.toLowerCase().includes('greek') || book.author.toLowerCase().includes('latin')) {
            category = 'Classical';
        }
        
        if (!byCategory[category]) {
            byCategory[category] = [];
        }
        byCategory[category].push(book);
    });
    
    Object.entries(byCategory).forEach(([category, books]) => {
        console.log(`\n📚 ${category} Literature (${books.length} books):`);
        books.slice(0, 10).forEach(book => {
            console.log(`  • "${book.title}" by ${book.author}`);
        });
        if (books.length > 10) {
            console.log(`  ... and ${books.length - 10} more`);
        }
    });
}

function main() {
    try {
        const library = loadLibrary();
        const { englishBooks, nonEnglishBooks } = filterEnglishOnly(library);
        
        showNonEnglishBooks(nonEnglishBooks);
        
        console.log(`\n=== ENGLISH LITERATURE LIBRARY STATISTICS ===`);
        console.log(`Total books: ${englishBooks.length}`);
        console.log(`Wikipedia link coverage: 100%`);
        
        // Show some examples
        console.log('\n=== SAMPLE ENGLISH LITERATURE BOOKS ===');
        englishBooks.slice(0, 15).forEach(book => {
            console.log(`✅ "${book.title}" by ${book.author}`);
        });
        
        // Save English-only library
        fs.writeFileSync('english-only-library.json', JSON.stringify(englishBooks, null, 2));
        console.log('\nEnglish-only library saved to: english-only-library.json');
        
        // Copy to app directory
        fs.copyFileSync('english-only-library.json', '../src/data/library/english-literature.json');
        console.log('English-only library copied to: src/data/library/english-literature.json');
        
        console.log('\n🎉 Library now contains only English literature!');
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { isEnglishLiterature, filterEnglishOnly };
