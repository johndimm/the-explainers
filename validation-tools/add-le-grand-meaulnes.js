const fs = require('fs');

// Load current French literature
const frenchLit = JSON.parse(fs.readFileSync('../src/data/library/french-literature.json', 'utf8'));

// Add Le Grand Meaulnes
const leGrandMeaulnes = {
    "id": "5781",
    "title": "Le Grand Meaulnes",
    "author": "Alain-Fournier, 1886-1914",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Le%20Grand%20Meaulnes",
    "wikipediaTitle": "Le Grand Meaulnes"
};

frenchLit.push(leGrandMeaulnes);

// Sort by author, then title
frenchLit.sort((a, b) => {
    const authorCompare = a.author.localeCompare(b.author);
    if (authorCompare !== 0) {
        return authorCompare;
    }
    return a.title.localeCompare(b.title);
});

// Save updated French literature
fs.writeFileSync('../src/data/library/french-literature.json', JSON.stringify(frenchLit, null, 2));

console.log('✅ Le Grand Meaulnes added to French literature!');
console.log(`French literature now has ${frenchLit.length} books:`);
frenchLit.forEach(book => {
    console.log(`  • "${book.title}" by ${book.author}`);
});
