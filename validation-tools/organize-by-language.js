#!/usr/bin/env node

const fs = require('fs');

function loadLibrary() {
    console.log('Loading current library...');
    
    const library = JSON.parse(fs.readFileSync('../src/data/library/english-literature.json', 'utf8'));
    console.log(`Loaded ${library.length} books`);
    
    return library;
}

function categorizeByLanguage(library) {
    console.log('\nCategorizing books by language...');
    
    const categories = {
        english: [],
        french: [],
        german: [],
        spanish: [],
        italian: [],
        russian: [],
        classical: [],
        other: []
    };
    
    library.forEach(book => {
        const title = book.title.toLowerCase();
        const author = book.author.toLowerCase();
        
        // French literature
        if (title.includes('le ') || title.includes('la ') || title.includes('les ') || 
            title.includes('du ') || title.includes('de ') || title.includes('des ') ||
            author.includes('french literature') || author.includes('littérature') ||
            title.includes('le grand meaulnes') || title.includes('eugénie grandet') ||
            title.includes('la comédie humaine') || author.includes('alain-fournier') ||
            author.includes('balzac') || author.includes('france')) {
            categories.french.push(book);
        }
        // German literature
        else if (title.includes('der ') || title.includes('die ') || title.includes('das ') ||
                 title.includes('und ') || title.includes('von ') || title.includes('zu ') ||
                 author.includes('german literature') || author.includes('deutsch')) {
            categories.german.push(book);
        }
        // Spanish literature
        else if (title.includes('el ') || title.includes('la ') || title.includes('los ') ||
                 title.includes('las ') || title.includes('del ') || title.includes('de ') ||
                 author.includes('spanish literature') || author.includes('español')) {
            categories.spanish.push(book);
        }
        // Italian literature
        else if (title.includes('il ') || title.includes('la ') || title.includes('lo ') ||
                 title.includes('gli ') || title.includes('le ') || title.includes('di ') ||
                 author.includes('italian literature') || author.includes('italiano')) {
            categories.italian.push(book);
        }
        // Russian literature
        else if (author.includes('russian literature') || author.includes('tolstoy') ||
                 author.includes('dostoyevsky') || author.includes('chekhov')) {
            categories.russian.push(book);
        }
        // Classical literature
        else if (author.includes('greek') || author.includes('latin') || author.includes('classical') ||
                 title.includes('odyssey') || title.includes('iliad') || title.includes('aeneid')) {
            categories.classical.push(book);
        }
        // English literature (default)
        else {
            categories.english.push(book);
        }
    });
    
    return categories;
}

function showCategories(categories) {
    console.log('\n=== BOOKS BY LANGUAGE CATEGORY ===');
    
    Object.entries(categories).forEach(([language, books]) => {
        if (books.length > 0) {
            console.log(`\n📚 ${language.toUpperCase()} Literature (${books.length} books):`);
            books.slice(0, 10).forEach(book => {
                console.log(`  • "${book.title}" by ${book.author}`);
            });
            if (books.length > 10) {
                console.log(`  ... and ${books.length - 10} more`);
            }
        }
    });
}

function saveLanguageLibraries(categories) {
    console.log('\nSaving language-specific libraries...');
    
    // Save English literature (keep as main library)
    if (categories.english.length > 0) {
        fs.writeFileSync('english-literature.json', JSON.stringify(categories.english, null, 2));
        fs.copyFileSync('english-literature.json', '../src/data/library/english-literature.json');
        console.log(`✅ English literature: ${categories.english.length} books`);
    }
    
    // Save French literature
    if (categories.french.length > 0) {
        fs.writeFileSync('french-literature.json', JSON.stringify(categories.french, null, 2));
        fs.copyFileSync('french-literature.json', '../src/data/library/french-literature.json');
        console.log(`✅ French literature: ${categories.french.length} books`);
    }
    
    // Save German literature
    if (categories.german.length > 0) {
        fs.writeFileSync('german-literature.json', JSON.stringify(categories.german, null, 2));
        fs.copyFileSync('german-literature.json', '../src/data/library/german-literature.json');
        console.log(`✅ German literature: ${categories.german.length} books`);
    }
    
    // Save Spanish literature
    if (categories.spanish.length > 0) {
        fs.writeFileSync('spanish-literature.json', JSON.stringify(categories.spanish, null, 2));
        fs.copyFileSync('spanish-literature.json', '../src/data/library/spanish-literature.json');
        console.log(`✅ Spanish literature: ${categories.spanish.length} books`);
    }
    
    // Save Italian literature
    if (categories.italian.length > 0) {
        fs.writeFileSync('italian-literature.json', JSON.stringify(categories.italian, null, 2));
        fs.copyFileSync('italian-literature.json', '../src/data/library/italian-literature.json');
        console.log(`✅ Italian literature: ${categories.italian.length} books`);
    }
    
    // Save Russian literature
    if (categories.russian.length > 0) {
        fs.writeFileSync('russian-literature.json', JSON.stringify(categories.russian, null, 2));
        fs.copyFileSync('russian-literature.json', '../src/data/library/russian-literature.json');
        console.log(`✅ Russian literature: ${categories.russian.length} books`);
    }
    
    // Save Classical literature
    if (categories.classical.length > 0) {
        fs.writeFileSync('classical-literature.json', JSON.stringify(categories.classical, null, 2));
        fs.copyFileSync('classical-literature.json', '../src/data/library/classical-literature.json');
        console.log(`✅ Classical literature: ${categories.classical.length} books`);
    }
    
    // Save Other literature
    if (categories.other.length > 0) {
        fs.writeFileSync('other-literature.json', JSON.stringify(categories.other, null, 2));
        fs.copyFileSync('other-literature.json', '../src/data/library/other-literature.json');
        console.log(`✅ Other literature: ${categories.other.length} books`);
    }
}

function main() {
    try {
        const library = loadLibrary();
        const categories = categorizeByLanguage(library);
        
        showCategories(categories);
        
        saveLanguageLibraries(categories);
        
        console.log('\n🎉 Books have been organized by language category!');
        console.log('\n📁 New library files created:');
        console.log('  • english-literature.json');
        console.log('  • french-literature.json');
        console.log('  • german-literature.json');
        console.log('  • spanish-literature.json');
        console.log('  • italian-literature.json');
        console.log('  • russian-literature.json');
        console.log('  • classical-literature.json');
        console.log('  • other-literature.json');
        
        // Verify Le Grand Meaulnes is in French literature
        const leGrandMeaulnes = categories.french.find(book => book.title.includes('Le Grand Meaulnes'));
        if (leGrandMeaulnes) {
            console.log(`\n✅ "Le Grand Meaulnes" is now in French literature!`);
        } else {
            console.log(`\n❌ "Le Grand Meaulnes" not found in French literature`);
        }
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { categorizeByLanguage, saveLanguageLibraries };
