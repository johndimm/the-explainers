// Test the improved word-based title matching

function checkTitleMatch(expected, actual) {
  if (!expected || !actual) return false;
  
  // Normalize both titles - remove punctuation, normalize spaces, convert to lowercase
  const normalize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
      .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
      .trim();
  };
  
  const normExpected = normalize(expected);
  const normActual = normalize(actual);
  
  console.log(`    Title comparison:`);
  console.log(`      Expected: "${expected}" -> "${normExpected}"`);
  console.log(`      Actual:   "${actual}" -> "${normActual}"`);
  
  // Check for exact match or contains match
  let matches = normExpected === normActual ||
                normActual.includes(normExpected) ||
                normExpected.includes(normActual);
  
  // If no match yet, check if all words from expected are in actual
  if (!matches) {
    const expectedWords = normExpected.split(' ').filter(word => word.length > 2); // Only consider words longer than 2 chars
    const actualWords = normActual.split(' ').filter(word => word.length > 0);
    
    // Check if all expected words are found in actual words
    const allWordsFound = expectedWords.every(expectedWord => 
      actualWords.some(actualWord => actualWord === expectedWord || actualWord.includes(expectedWord))
    );
    
    // Also check that we have a reasonable number of words matched (at least 50% of expected words)
    const matchedWords = expectedWords.filter(expectedWord => 
      actualWords.some(actualWord => actualWord === expectedWord || actualWord.includes(expectedWord))
    );
    
    // Match if all significant words are found, regardless of length ratio
    // This handles cases where the actual title is a shortened version
    if (allWordsFound && matchedWords.length >= 2) {
      matches = true;
      console.log(`      All words match: ${expectedWords.join(', ')} found in actual title`);
    } else {
      console.log(`      Expected words: ${expectedWords.join(', ')}`);
      console.log(`      Actual words: ${actualWords.join(', ')}`);
      console.log(`      Matched words: ${matchedWords.join(', ')}`);
    }
  }
  
  console.log(`      Match: ${matches ? '✅' : '❌'}`);
  
  return matches;
}

// Test cases
const testCases = [
  {
    expected: "Thoughts of Marcus Aurelius",
    actual: "The Thoughts of the Emperor Marcus Aurelius Antoninus",
    shouldMatch: true
  },
  {
    expected: "Discourse on the Method of Rightly Conducting One's Reason and of Seeking Truth in the Sciences",
    actual: "A Discourse on Method",
    shouldMatch: true
  },
  {
    expected: "Pride and Prejudice",
    actual: "Pride and Prejudice",
    shouldMatch: true
  },
  {
    expected: "A Midsummer Night's Dream",
    actual: "A MIDSUMMER NIGHT'S DREAM",
    shouldMatch: true
  },
  {
    expected: "The Great Gatsby",
    actual: "Gatsby",
    shouldMatch: false
  },
  {
    expected: "Romeo and Juliet",
    actual: "Romeo and Juliet",
    shouldMatch: true
  }
];

console.log('🧪 Testing Improved Word-Based Title Matching\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}:`);
  const result = checkTitleMatch(testCase.expected, testCase.actual);
  const status = result === testCase.shouldMatch ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${status} - Expected: ${testCase.shouldMatch}, Got: ${result}\n`);
});
