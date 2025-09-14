import { generateCharacterMapFromText, formatCharacterMapAsText, exportCharacterMapAsJSON } from '../utils/characterMapGenerator';

async function demoCharacterMapGenerator() {
  console.log('🎭 Character Map Generator Demo\n');

  // Sample dramatic text (simplified version of a play)
  const sampleText = `
ACT I.

SCENE I. A Room in the Palace.

Enter King Duncan, Malcolm, and Donalbain.

KING.
What bloody man is that?

MALCOLM.
This is the sergeant who fought against my captivity.

Enter Sergeant.

SERGEANT.
Doubtful it stood; as two spent swimmers, that do cling together.

KING.
O valiant cousin! worthy gentleman!

[_Exit Sergeant._]

MALCOLM.
This is the sergeant who fought against my captivity.

[_Exit Malcolm._]

Enter Macbeth and Banquo.

KING.
So well thy words become thee as thy wounds.

MACBETH.
The service and the loyalty I owe.

[_Exit King._]

SCENE II. A Camp near Forres.

Enter Macbeth and Banquo.

MACBETH.
So foul and fair a day I have not seen.

[_Exit Banquo._]

Enter three Witches.

FIRST WITCH.
When shall we three meet again?

[_Exit all._]
`;

  console.log('📖 Sample Text:');
  console.log(sampleText);
  console.log('\n' + '='.repeat(50) + '\n');

  // Generate character map
  console.log('🔍 Generating character map...');
  const result = generateCharacterMapFromText(sampleText);

  // Display results
  console.log('\n📊 RESULTS:');
  console.log(`Total entries: ${result.entries.length}`);
  console.log(`Total unique characters: ${result.totalCharacters.length}`);
  console.log(`Acts: ${result.acts.join(', ')}`);
  console.log(`Scenes: ${result.scenes.join(', ')}`);
  console.log(`All characters: ${result.totalCharacters.join(', ')}`);

  console.log('\n🎬 CHARACTER MAP ENTRIES:');
  result.entries.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.offset} ${entry.act} ${entry.scene} [${entry.characters.join(', ')}]`);
  });

  // Export formats
  console.log('\n📝 TEXT FORMAT:');
  const textOutput = formatCharacterMapAsText(result);
  console.log(textOutput);

  console.log('\n📄 JSON FORMAT:');
  const jsonOutput = exportCharacterMapAsJSON(result);
  console.log(JSON.stringify(JSON.parse(jsonOutput), null, 2));

  console.log('\n✅ Demo completed successfully!');
  console.log('\n💡 Usage in your app:');
  console.log('1. Import the functions from @/utils/characterMapGenerator');
  console.log('2. Call generateCharacterMapFromText(text) with your dramatic text');
  console.log('3. Use the API endpoint at /api/character-map for web requests');
}

// Run the demo
demoCharacterMapGenerator().catch(console.error);
