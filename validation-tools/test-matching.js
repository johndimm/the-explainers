// Test the title and author matching functions

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
  
  console.log(`Title comparison:`);
  console.log(`  Expected: "${expected}" -> "${normExpected}"`);
  console.log(`  Actual:   "${actual}" -> "${normActual}"`);
  
  // Check for exact match or contains match
  const matches = normExpected === normActual || 
                  normActual.includes(normExpected) || 
                  normExpected.includes(normActual);
  
  console.log(`  Match: ${matches ? '✅' : '❌'}`);
  console.log('');
  
  return matches;
}

function checkAuthorMatch(expected, actual) {
  if (!expected || !actual) return false;
  
  // Normalize both authors - remove punctuation, normalize spaces, convert to lowercase
  const normalize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
      .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
      .trim();
  };
  
  const normExpected = normalize(expected);
  const normActual = normalize(actual);
  
  console.log(`Author comparison:`);
  console.log(`  Expected: "${expected}" -> "${normExpected}"`);
  console.log(`  Actual:   "${actual}" -> "${normActual}"`);
  
  // Check for exact match or contains match
  const matches = normExpected === normActual || 
                  normActual.includes(normExpected) || 
                  normExpected.includes(normActual);
  
  console.log(`  Match: ${matches ? '✅' : '❌'}`);
  console.log('');
  
  return matches;
}

// Test cases
console.log('🧪 Testing Title and Author Matching\n');

const testCases = [
  {
    expectedTitle: "A Midsummer Night's Dream",
    actualTitle: "A MIDSUMMER NIGHT'S DREAM",
    expectedAuthor: "William Shakespeare",
    actualAuthor: "William Shakespeare"
  },
  {
    expectedTitle: "Love's Labour's Lost",
    actualTitle: "LOVE'S LABOUR'S LOST",
    expectedAuthor: "William Shakespeare", 
    actualAuthor: "William Shakespeare"
  },
  {
    expectedTitle: "Romeo and Juliet",
    actualTitle: "ROMEO AND JULIET",
    expectedAuthor: "William Shakespeare",
    actualAuthor: "William Shakespeare"
  }
];

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}:`);
  const titleMatch = checkTitleMatch(test.expectedTitle, test.actualTitle);
  const authorMatch = checkAuthorMatch(test.expectedAuthor, test.actualAuthor);
  console.log(`Overall: ${titleMatch && authorMatch ? '✅ VALID' : '❌ INVALID'}`);
  console.log('='.repeat(50));
});
