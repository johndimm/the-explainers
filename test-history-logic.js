// Test the chat history logic
// Run this in the browser console to test the logic

console.log('🧪 Testing Chat History Logic');

function testHistoryLogic() {
  // Test case 1: 5 messages with alternating user/assistant
  const messages1 = [
    { id: '1', role: 'user', content: 'First question' },
    { id: '2', role: 'assistant', content: 'First answer' },
    { id: '3', role: 'user', content: 'Second question' },
    { id: '4', role: 'assistant', content: 'Second answer' },
    { id: '5', role: 'user', content: 'Third question' }
  ];
  
  // Test case 2: 3 messages
  const messages2 = [
    { id: '1', role: 'user', content: 'First question' },
    { id: '2', role: 'assistant', content: 'First answer' },
    { id: '3', role: 'user', content: 'Second question' }
  ];
  
  // Test case 3: 2 messages
  const messages3 = [
    { id: '1', role: 'user', content: 'First question' },
    { id: '2', role: 'assistant', content: 'First answer' }
  ];
  
  // Test case 4: Only assistant messages
  const messages4 = [
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
  
  console.log('🧪 Test Case 1: 5 messages (should show last 2)');
  const displayed1 = getDisplayedMessages(messages1, false);
  const hidden1 = getHiddenMessageCount(messages1);
  console.log('   - Total messages:', messages1.length);
  console.log('   - Displayed messages:', displayed1.length);
  console.log('   - Hidden messages:', hidden1);
  console.log('   - Should show button:', hidden1 > 0);
  console.log('   - Displayed messages:', displayed1.map(m => `${m.role}: ${m.content.substring(0, 20)}...`));
  
  console.log('🧪 Test Case 2: 3 messages (should show all)');
  const displayed2 = getDisplayedMessages(messages2, false);
  const hidden2 = getHiddenMessageCount(messages2);
  console.log('   - Total messages:', messages2.length);
  console.log('   - Displayed messages:', displayed2.length);
  console.log('   - Hidden messages:', hidden2);
  console.log('   - Should show button:', hidden2 > 0);
  
  console.log('🧪 Test Case 3: 2 messages (should show all)');
  const displayed3 = getDisplayedMessages(messages3, false);
  const hidden3 = getHiddenMessageCount(messages3);
  console.log('   - Total messages:', messages3.length);
  console.log('   - Displayed messages:', displayed3.length);
  console.log('   - Hidden messages:', hidden3);
  console.log('   - Should show button:', hidden3 > 0);
  
  console.log('🧪 Test Case 4: Only assistant messages (should show all)');
  const displayed4 = getDisplayedMessages(messages4, false);
  const hidden4 = getHiddenMessageCount(messages4);
  console.log('   - Total messages:', messages4.length);
  console.log('   - Displayed messages:', displayed4.length);
  console.log('   - Hidden messages:', hidden4);
  console.log('   - Should show button:', hidden4 > 0);
  
  return {
    test1: { total: messages1.length, displayed: displayed1.length, hidden: hidden1, showButton: hidden1 > 0 },
    test2: { total: messages2.length, displayed: displayed2.length, hidden: hidden2, showButton: hidden2 > 0 },
    test3: { total: messages3.length, displayed: displayed3.length, hidden: hidden3, showButton: hidden3 > 0 },
    test4: { total: messages4.length, displayed: displayed4.length, hidden: hidden4, showButton: hidden4 > 0 }
  };
}

// Run the test
const results = testHistoryLogic();

console.log('📊 Test Results Summary:');
console.log('========================');
Object.entries(results).forEach(([key, result]) => {
  console.log(`${key}: Total=${result.total}, Displayed=${result.displayed}, Hidden=${result.hidden}, ShowButton=${result.showButton}`);
});

console.log('🎯 History Logic Test Complete!');
