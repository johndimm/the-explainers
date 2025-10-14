// Debug script for chat history functionality
// Run this in the browser console to debug the chat history issue

console.log('🔍 Debugging Chat History Functionality');

// Test the getDisplayedMessages logic
function testGetDisplayedMessages() {
  console.log('📋 Testing getDisplayedMessages Logic');
  
  // Create test messages
  const testMessages = [
    { id: '1', role: 'user', content: 'First question' },
    { id: '2', role: 'assistant', content: 'First answer' },
    { id: '3', role: 'user', content: 'Second question' },
    { id: '4', role: 'assistant', content: 'Second answer' },
    { id: '5', role: 'user', content: 'Third question' }
  ];
  
  // Simulate getDisplayedMessages function
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
  
  // Simulate getHiddenMessageCount function
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
  
  // Test with different scenarios
  console.log('🧪 Test 1: 5 messages (should show last 2)');
  const displayed1 = getDisplayedMessages(testMessages, false);
  const hidden1 = getHiddenMessageCount(testMessages);
  console.log('   - Displayed messages:', displayed1.length);
  console.log('   - Hidden messages:', hidden1);
  console.log('   - Should show button:', hidden1 > 0);
  
  console.log('🧪 Test 2: 2 messages (should show all)');
  const twoMessages = testMessages.slice(0, 2);
  const displayed2 = getDisplayedMessages(twoMessages, false);
  const hidden2 = getHiddenMessageCount(twoMessages);
  console.log('   - Displayed messages:', displayed2.length);
  console.log('   - Hidden messages:', hidden2);
  console.log('   - Should show button:', hidden2 > 0);
  
  console.log('🧪 Test 3: Full history mode');
  const displayed3 = getDisplayedMessages(testMessages, true);
  console.log('   - Displayed messages:', displayed3.length);
  console.log('   - Should show all messages:', displayed3.length === testMessages.length);
  
  return {
    test1: { displayed: displayed1.length, hidden: hidden1, showButton: hidden1 > 0 },
    test2: { displayed: displayed2.length, hidden: hidden2, showButton: hidden2 > 0 },
    test3: { displayed: displayed3.length, showAll: displayed3.length === testMessages.length }
  };
}

// Test the actual chat history in the app
function testActualChatHistory() {
  console.log('📋 Testing Actual Chat History in App');
  
  // Check if chat history exists
  const chatHistory = sessionStorage.getItem('chatHistory');
  if (chatHistory) {
    const messages = JSON.parse(chatHistory);
    console.log('✅ Chat history found:', messages.length, 'messages');
    
    // Check message structure
    messages.forEach((msg, index) => {
      console.log(`   Message ${index + 1}:`, {
        id: msg.id,
        role: msg.role,
        content: msg.content.substring(0, 50) + '...',
        timestamp: msg.timestamp
      });
    });
    
    // Test the logic with actual messages
    const showFullHistory = false;
    const shouldShowButton = messages.length > 2;
    
    console.log('📊 Analysis:');
    console.log('   - Total messages:', messages.length);
    console.log('   - Should show button:', shouldShowButton);
    console.log('   - showFullHistory state:', showFullHistory);
    
    return {
      messageCount: messages.length,
      shouldShowButton,
      messages: messages
    };
  } else {
    console.log('ℹ️ No chat history found in sessionStorage');
    return null;
  }
}

// Check the current state of the chat interface
function checkChatInterfaceState() {
  console.log('📋 Checking Chat Interface State');
  
  // Check if we're on the chat page
  const isChatPage = window.location.pathname.includes('/chat');
  console.log('   - On chat page:', isChatPage);
  
  // Check for chat interface elements
  const messagesContainer = document.querySelector('[class*="messagesContainer"]');
  const historyButton = document.querySelector('[class*="historyToggle"]');
  
  console.log('   - Messages container found:', !!messagesContainer);
  console.log('   - History button found:', !!historyButton);
  
  if (messagesContainer) {
    const messages = messagesContainer.querySelectorAll('[class*="message"]');
    console.log('   - Visible messages:', messages.length);
  }
  
  return {
    isChatPage,
    messagesContainer: !!messagesContainer,
    historyButton: !!historyButton
  };
}

// Run all debug tests
function runDebugTests() {
  console.log('🚀 Running Chat History Debug Tests');
  console.log('===================================');
  
  const results = {
    logicTest: testGetDisplayedMessages(),
    actualHistory: testActualChatHistory(),
    interfaceState: checkChatInterfaceState()
  };
  
  console.log('===================================');
  console.log('📊 Debug Results Summary:');
  console.log('✅ Logic test completed');
  console.log('✅ Actual history test completed');
  console.log('✅ Interface state test completed');
  
  return results;
}

// Export functions
window.debugChatHistory = {
  runDebugTests,
  testGetDisplayedMessages,
  testActualChatHistory,
  checkChatInterfaceState
};

console.log('🎯 Chat History Debug Tools Ready!');
console.log('💡 Run: debugChatHistory.runDebugTests() to debug the issue');
