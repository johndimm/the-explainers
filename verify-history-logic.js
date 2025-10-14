// Verify Chat History Logic
// This script verifies that the chat history logic works correctly

console.log('🧪 Verifying Chat History Logic');

// Test the exact logic from the ChatInterface component
function verifyHistoryLogic() {
  console.log('📋 Verifying History Logic');
  
  // Test case 1: 5 messages (should show button)
  const messages1 = [
    { id: '1', role: 'user', content: 'First question' },
    { id: '2', role: 'assistant', content: 'First answer' },
    { id: '3', role: 'user', content: 'Second question' },
    { id: '4', role: 'assistant', content: 'Second answer' },
    { id: '5', role: 'user', content: 'Third question' }
  ];
  
  // Test case 2: 3 messages (should show button)
  const messages2 = [
    { id: '1', role: 'user', content: 'First question' },
    { id: '2', role: 'assistant', content: 'First answer' },
    { id: '3', role: 'user', content: 'Second question' }
  ];
  
  // Test case 3: 2 messages (should NOT show button)
  const messages3 = [
    { id: '1', role: 'user', content: 'First question' },
    { id: '2', role: 'assistant', content: 'First answer' }
  ];
  
  // Test case 4: 1 message (should NOT show button)
  const messages4 = [
    { id: '1', role: 'user', content: 'First question' }
  ];
  
  // Test case 5: No user messages (should show all)
  const messages5 = [
    { id: '1', role: 'assistant', content: 'First answer' },
    { id: '2', role: 'assistant', content: 'Second answer' },
    { id: '3', role: 'assistant', content: 'Third answer' }
  ];
  
  function getDisplayedMessages(messages, showFullHistory = false) {
    if (showFullHistory) {
      return messages;
    }
    
    if (messages.length <= 2) {
      return messages;
    }
    
    // Find the index of the last user message (most recent quote)
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    // If we found a user message, show only the last complete exchange
    if (lastUserMessageIndex >= 0) {
      // Find the last assistant message after the last user message
      let lastAssistantMessageIndex = -1;
      for (let i = lastUserMessageIndex + 1; i < messages.length; i++) {
        if (messages[i].role === 'assistant') {
          lastAssistantMessageIndex = i;
        }
      }
      
      // If we found an assistant message after the user message, show the complete exchange
      if (lastAssistantMessageIndex >= 0) {
        return messages.slice(lastUserMessageIndex, lastAssistantMessageIndex + 1);
      } else {
        // If no assistant message found after user message, just show the user message
        return messages.slice(lastUserMessageIndex, lastUserMessageIndex + 1);
      }
    }
    
    // Fallback to showing all messages if no user message found
    return messages;
  }
  
  function getHiddenMessageCount(messages) {
    if (messages.length <= 2) {
      return 0;
    }
    
    // Find the index of the last user message (most recent quote)
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    // If we found a user message, calculate how many messages are hidden before the last exchange
    if (lastUserMessageIndex >= 0) {
      // Find the last assistant message after the last user message
      let lastAssistantMessageIndex = -1;
      for (let i = lastUserMessageIndex + 1; i < messages.length; i++) {
        if (messages[i].role === 'assistant') {
          lastAssistantMessageIndex = i;
        }
      }
      
      // Return the number of messages before the last complete exchange
      if (lastAssistantMessageIndex >= 0) {
        return lastUserMessageIndex;
      } else {
        return lastUserMessageIndex;
      }
    }
    
    return 0;
  }
  
  function testCase(messages, caseName) {
    console.log(`\n🧪 ${caseName}:`);
    console.log(`   Messages: ${messages.length}`);
    
    const showFullHistory = false;
    const displayedMessages = getDisplayedMessages(messages, showFullHistory);
    const hiddenCount = getHiddenMessageCount(messages);
    const shouldShowButton = !showFullHistory && hiddenCount > 0;
    
    console.log(`   - Displayed: ${displayedMessages.length}`);
    console.log(`   - Hidden: ${hiddenCount}`);
    console.log(`   - Should show button: ${shouldShowButton}`);
    console.log(`   - Displayed messages: ${displayedMessages.map(m => `${m.role}: ${m.content.substring(0, 20)}...`).join(', ')}`);
    
    return {
      total: messages.length,
      displayed: displayedMessages.length,
      hidden: hiddenCount,
      showButton: shouldShowButton
    };
  }
  
  const results = {
    case1: testCase(messages1, 'Case 1: 5 messages (should show button)'),
    case2: testCase(messages2, 'Case 2: 3 messages (should show button)'),
    case3: testCase(messages3, 'Case 3: 2 messages (should NOT show button)'),
    case4: testCase(messages4, 'Case 4: 1 message (should NOT show button)'),
    case5: testCase(messages5, 'Case 5: No user messages (should show all)')
  };
  
  console.log('\n📊 Results Summary:');
  console.log('==================');
  Object.entries(results).forEach(([key, result]) => {
    const status = result.showButton ? '✅ SHOW BUTTON' : '❌ NO BUTTON';
    console.log(`${key}: ${status} (${result.total} total, ${result.displayed} displayed, ${result.hidden} hidden)`);
  });
  
  return results;
}

// Run the verification
const results = verifyHistoryLogic();

console.log('\n🎯 Logic Verification Complete!');
console.log('💡 If the logic is working correctly, you should see:');
console.log('   - Case 1: ✅ SHOW BUTTON (5 messages)');
console.log('   - Case 2: ✅ SHOW BUTTON (3 messages)');
console.log('   - Case 3: ❌ NO BUTTON (2 messages)');
console.log('   - Case 4: ❌ NO BUTTON (1 message)');
console.log('   - Case 5: ❌ NO BUTTON (no user messages)');
