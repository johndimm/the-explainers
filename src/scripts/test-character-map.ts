import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateCharacterMapFromText, formatCharacterMapAsText, exportCharacterMapAsJSON } from '../utils/characterMapGenerator';

async function testCharacterMapGenerator() {
  try {
    console.log('Testing Character Map Generator...\n');

    // Read the Twelfth Night text
    const textPath = join(process.cwd(), 'src/data/map/twelfth-night.txt');
    const text = readFileSync(textPath, 'utf-8');
    
    console.log(`Loaded text: ${text.length} characters`);
    console.log(`Text preview: ${text.substring(0, 200)}...\n`);

    // Generate character map
    console.log('Generating character map...');
    
    // Debug: Let's see what structure elements we're finding
    const { extractStructureElements, extractSpeakerExits, parseCharacters } = await import('../utils/characterMapGenerator');
    const structureElements = extractStructureElements(text);
    const speakerExits = extractSpeakerExits(text);
    
    console.log('\n=== DEBUG: STRUCTURE ELEMENTS ===');
    console.log(`Found ${structureElements.length} structure elements:`);
    
    // Look for all Maria exits
    const mariaExits = structureElements.filter(e => e.content.includes('[_Exit Maria._]'));
    console.log(`\n=== MARIA EXITS DEBUG ===`);
    console.log(`Found ${mariaExits.length} Maria exits:`);
    mariaExits.forEach((exit, index) => {
      const exitIndex = structureElements.indexOf(exit);
      console.log(`${index + 1}. Index ${exitIndex}, Offset ${exit.offset}: "${exit.content}"`);
    });
    
    // Look for the SCENE V sequence specifically
    const sceneVEntries = structureElements.filter(e => e.content.includes('SCENE V') || 
      (e.offset >= 15000 && e.offset <= 18000));
    console.log(`\n=== SCENE V ENTRIES ===`);
    sceneVEntries.forEach((entry, index) => {
      const chars = entry.type === 'ENTER' || entry.type === 'EXIT' ? parseCharacters(entry.content) : [];
      console.log(`${index}. ${entry.offset} ${entry.type}: "${entry.content}" → [${chars.join(', ')}]`);
    });
    
    // Check all entries around the Maria exit
    const allEntries = [...structureElements, ...speakerExits].sort((a, b) => a.offset - b.offset);
    const mariaAreaEntries = allEntries.filter(e => e.offset >= 15000 && e.offset <= 18000);
    console.log(`\n=== MARIA AREA ENTRIES (COMBINED) ===`);
    mariaAreaEntries.forEach((entry, index) => {
      const chars = entry.type === 'ENTER' || entry.type === 'EXIT' ? parseCharacters(entry.content) : [];
      console.log(`${index}. ${entry.offset} ${entry.type}: "${entry.content}" → [${chars.join(', ')}]`);
    });
    
    console.log(`\nFound ${speakerExits.length} speaker exits:`);
    speakerExits.slice(0, 5).forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.offset} ${entry.type}: "${entry.content}"`);
    });
    
    // Debug: Check if we're finding the Maria exit specifically
    const mariaSpeakerExit = speakerExits.find(e => e.content.toLowerCase().includes('maria'));
    if (mariaSpeakerExit) {
      console.log(`\n=== MARIA SPEAKER EXIT FOUND ===`);
      console.log(`Maria speaker exit: ${mariaSpeakerExit.offset} ${mariaSpeakerExit.type}: "${mariaSpeakerExit.content}"`);
    } else {
      console.log(`\n=== NO MARIA SPEAKER EXIT FOUND ===`);
    }
    
    // Test the generateCharacterMapFromText function
    console.log(`\n=== TESTING generateCharacterMapFromText ===`);
    const result = generateCharacterMapFromText(text);
    
    // Also test the individual functions
    console.log(`\n=== TESTING INDIVIDUAL FUNCTIONS ===`);
    const structureElements2 = extractStructureElements(text);
    const speakerExits2 = extractSpeakerExits(text);
    const allEntries2 = [...structureElements2, ...speakerExits2].sort((a, b) => a.offset - b.offset);
    
    console.log(`Structure elements: ${structureElements2.length}`);
    console.log(`Speaker exits: ${speakerExits2.length}`);
    console.log(`Combined entries: ${allEntries2.length}`);
    
    // Show entries around Maria exit
    const mariaArea2 = allEntries2.filter(e => e.offset >= 15000 && e.offset <= 18000);
    console.log(`\n=== MARIA AREA IN COMBINED ENTRIES ===`);
    mariaArea2.forEach((entry, index) => {
      const chars = entry.type === 'ENTER' || entry.type === 'EXIT' ? parseCharacters(entry.content) : [];
      console.log(`${index}. ${entry.offset} ${entry.type}: "${entry.content}" → [${chars.join(', ')}]`);
    });

    // Display results
    console.log('\n=== CHARACTER MAP RESULTS ===');
    console.log(`Total entries: ${result.entries.length}`);
    console.log(`Total unique characters: ${result.totalCharacters.length}`);
    console.log(`Acts: ${result.acts.join(', ')}`);
    console.log(`Scenes: ${result.scenes.join(', ')}`);
    console.log(`All characters: ${result.totalCharacters.join(', ')}`);

    // Show first 10 entries
    console.log('\n=== FIRST 10 ENTRIES ===');
    result.entries.slice(0, 10).forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.offset} ${entry.act} ${entry.scene} [${entry.characters.join(', ')}]`);
    });

    // Export to files for comparison
    const outputDir = join(process.cwd(), 'src/data/map');
    
    // Export as text format (similar to original Python output)
    const textOutput = formatCharacterMapAsText(result);
    const textOutputPath = join(outputDir, 'character_map_typescript.txt');
    writeFileSync(textOutputPath, textOutput);
    console.log(`\nText output saved to: ${textOutputPath}`);

    // Export as JSON
    const jsonOutput = exportCharacterMapAsJSON(result);
    const jsonOutputPath = join(outputDir, 'character_map_typescript.json');
    writeFileSync(jsonOutputPath, jsonOutput);
    console.log(`JSON output saved to: ${jsonOutputPath}`);

    // Compare with original Python output
    try {
      const originalPath = join(outputDir, 'character_map.txt');
      const originalOutput = readFileSync(originalPath, 'utf-8');
      const originalLines = originalOutput.split('\n').filter(line => line.trim());
      const newLines = textOutput.split('\n').filter(line => line.trim());
      
      console.log('\n=== COMPARISON WITH ORIGINAL ===');
      console.log(`Original entries: ${originalLines.length}`);
      console.log(`New entries: ${newLines.length}`);
      
      // Show differences
      const maxCompare = Math.min(10, originalLines.length, newLines.length);
      console.log('\nFirst few comparisons:');
      for (let i = 0; i < maxCompare; i++) {
        const original = originalLines[i] || 'N/A';
        const newLine = newLines[i] || 'N/A';
        const match = original === newLine;
        console.log(`${i + 1}. ${match ? '✓' : '✗'} Original: ${original}`);
        console.log(`   ${match ? '✓' : '✗'} New:      ${newLine}`);
      }
    } catch (error) {
      console.log('\nCould not compare with original file:', error);
    }

    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Error testing character map generator:', error);
    process.exit(1);
  }
}

// Run the test
testCharacterMapGenerator();
