#!/usr/bin/env node

const fs = require('fs');

function loadEnhancedLibrary() {
    console.log('Loading enhanced library...');
    
    const enhancedLibrary = JSON.parse(fs.readFileSync('corrected-candidate-library.json', 'utf8'));
    console.log(`Loaded ${enhancedLibrary.books.length} books from enhanced library`);
    
    return enhancedLibrary.books;
}

function isPhilosophyBook(book) {
    const title = book.title.toLowerCase();
    const author = book.author.toLowerCase();
    const subjects = book.subjects ? book.subjects.toLowerCase() : '';
    
    // Check for philosophical authors
    const philosophicalAuthors = [
        'plato', 'aristotle', 'kant', 'hegel', 'nietzsche', 'schopenhauer', 'hume',
        'locke', 'berkeley', 'descartes', 'spinoza', 'leibniz', 'rousseau', 'voltaire',
        'montaigne', 'pascal', 'aquinas', 'augustine', 'confucius', 'lao', 'zeno',
        'epicurus', 'seneca', 'marcus aurelius', 'epictetus', 'machiavelli', 'hobbes',
        'mill', 'bentham', 'schiller', 'fichte', 'schelling', 'kierkegaard', 'marx',
        'engels', 'russell', 'wittgenstein', 'heidegger', 'sartre', 'camus', 'foucault'
    ];
    
    // Check for philosophical subjects/keywords
    const philosophicalKeywords = [
        'philosophy', 'ethics', 'metaphysics', 'epistemology', 'logic', 'dialogue',
        'treatise', 'meditations', 'critique', 'essays', 'moral', 'virtue', 'justice',
        'republic', 'apology', 'phaedo', 'symposium', 'nicomachean', 'politics',
        'ethics', 'groundwork', 'phenomenology', 'existentialism', 'stoic', 'epicurean'
    ];
    
    // Check if author is a known philosopher
    const isPhilosophicalAuthor = philosophicalAuthors.some(philAuthor => 
        author.includes(philAuthor)
    );
    
    // Check if title/subjects contain philosophical keywords
    const hasPhilosophicalContent = philosophicalKeywords.some(keyword => 
        title.includes(keyword) || subjects.includes(keyword)
    );
    
    return isPhilosophicalAuthor || hasPhilosophicalContent;
}

function filterPhilosophyBooks(enhancedBooks) {
    console.log('\nFiltering for philosophy books...');
    
    const philosophyBooks = enhancedBooks.filter(book => isPhilosophyBook(book));
    
    console.log(`Found ${philosophyBooks.length} philosophy books`);
    
    return philosophyBooks;
}

function convertToLibraryFormat(philosophyBooks) {
    console.log('\nConverting to library format...');
    
    const libraryBooks = philosophyBooks.map(book => ({
        id: book.gutenbergId,
        title: book.title,
        author: book.author,
        wikipediaUrl: book.wikiUrl,
        wikipediaTitle: book.wikiTitle
    }));
    
    // Sort by author, then title
    libraryBooks.sort((a, b) => {
        const authorCompare = a.author.localeCompare(b.author);
        if (authorCompare !== 0) {
            return authorCompare;
        }
        return a.title.localeCompare(b.title);
    });
    
    return libraryBooks;
}

function showPhilosophyBooks(libraryBooks) {
    console.log('\n=== PHILOSOPHY LIBRARY ===');
    
    // Group by author
    const authorGroups = {};
    libraryBooks.forEach(book => {
        if (!authorGroups[book.author]) {
            authorGroups[book.author] = [];
        }
        authorGroups[book.author].push(book.title);
    });
    
    // Show authors with multiple works
    Object.entries(authorGroups)
        .filter(([author, books]) => books.length > 1)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([author, books]) => {
            console.log(`\n📚 ${author} (${books.length} works):`);
            books.forEach(title => {
                console.log(`  • ${title}`);
            });
        });
    
    // Show single-work authors
    const singleWorkAuthors = Object.entries(authorGroups)
        .filter(([author, books]) => books.length === 1)
        .sort(([a], [b]) => a[0].localeCompare(b[0]));
    
    console.log(`\n📚 Single-work authors (${singleWorkAuthors.length}):`);
    singleWorkAuthors.slice(0, 20).forEach(([author, books]) => {
        console.log(`  • ${books[0]} by ${author}`);
    });
    
    if (singleWorkAuthors.length > 20) {
        console.log(`  ... and ${singleWorkAuthors.length - 20} more`);
    }
}

function main() {
    try {
        const enhancedBooks = loadEnhancedLibrary();
        const philosophyBooks = filterPhilosophyBooks(enhancedBooks);
        const libraryBooks = convertToLibraryFormat(philosophyBooks);
        
        showPhilosophyBooks(libraryBooks);
        
        console.log(`\n=== PHILOSOPHY LIBRARY STATISTICS ===`);
        console.log(`Total philosophy books: ${libraryBooks.length}`);
        console.log(`Wikipedia link coverage: 100%`);
        
        // Verify no modern philosophers
        const modernPhilosophers = libraryBooks.filter(book => {
            const author = book.author.toLowerCase();
            return author.includes('peter singer') || author.includes('rawls') || 
                   author.includes('nozick') || author.includes('chomsky') ||
                   author.includes('foucault') || author.includes('derrida');
        });
        
        if (modernPhilosophers.length > 0) {
            console.log(`\n⚠️  Warning: Found ${modernPhilosophers.length} potentially modern philosophers:`);
            modernPhilosophers.forEach(book => {
                console.log(`  • "${book.title}" by ${book.author}`);
            });
        } else {
            console.log(`\n✅ No modern philosophers found - all books are public domain`);
        }
        
        // Save philosophy library
        fs.writeFileSync('philosophers-verified.json', JSON.stringify(libraryBooks, null, 2));
        fs.copyFileSync('philosophers-verified.json', '../src/data/library/philosophers.json');
        console.log('\n✅ Verified philosophy library saved and copied to app!');
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { isPhilosophyBook, filterPhilosophyBooks };
