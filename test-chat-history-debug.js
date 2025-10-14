// Chat History Debug Test Script
// Run this in your browser's developer console on localhost:3000/chat

console.log('🔍 Chat History Debug Test');
console.log('==========================');

// Test 1: Check current chat history state
function checkChatHistoryState() {
  console.log('📋 Test 1: Checking Chat History State');
  
  // Check sessionStorage
  const chatHistory = sessionStorage.getItem('chatHistory');
  const chatContext = sessionStorage.getItem('chatContext');
  
  console.log('✅ SessionStorage check:');
  console.log('   - Chat history exists:', !!chatHistory);
  console.log('   - Chat context exists:', !!chatContext);
  
  if (chatHistory) {
    try {
      const messages = JSON.parse(chatHistory);
      console.log('   - Message count:', messages.length);
      console.log('   - Messages:', messages.map((msg, i) => ({
        index: i,
        role: msg.role,
        content: msg.content.substring(0, 50) + '...',
        timestamp: msg.timestamp
      })));
    } catch (error) {
      console.log('   - Error parsing chat history:', error);
    }
  }
  
  return { chatHistory, chatContext };
}

// Test 2: Check DOM elements
function checkDOMElements() {
  console.log('📋 Test 2: Checking DOM Elements');
  
  // Check if we're on the chat page
  const isChatPage = window.location.pathname.includes('/chat');
  console.log('   - On chat page:', isChatPage);
  
  // Look for chat interface elements
  const messagesContainer = document.querySelector('[class*="messagesContainer"]');
  const historyButton = document.querySelector('[class*="historyToggle"]');
  const debugInfo = document.querySelector('div[style*="Debug:"]');
  
  console.log('   - Messages container found:', !!messagesContainer);
  console.log('   - History button found:', !!historyButton);
  console.log('   - Debug info found:', !!debugInfo);
  
  if (debugInfo) {
    console.log('   - Debug info text:', debugInfo.textContent);
  }
  
  if (messagesContainer) {
    const messages = messagesContainer.querySelectorAll('[class*="message"]');
    console.log('   - Visible messages in DOM:', messages.length);
  }
  
  return {
    isChatPage,
    messagesContainer: !!messagesContainer,
    historyButton: !!historyButton,
    debugInfo: !!debugInfo,
    visibleMessages: messagesContainer ? messagesContainer.querySelectorAll('[class*="message"]').length : 0
  };
}

// Test 3: Simulate the getDisplayedMessages logic
function testDisplayLogic() {
  console.log('📋 Test 3: Testing Display Logic');
  
  const chatHistory = sessionStorage.getItem('chatHistory');
  if (!chatHistory) {
    console.log('   - No chat history found, cannot test display logic');
    return null;
  }
  
  try {
    const messages = JSON.parse(chatHistory);
    
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
    
    // Test the logic
    const showFullHistory = false; // Simulate the default state
    const displayedMessages = getDisplayedMessages(messages, showFullHistory);
    const hiddenCount = getHiddenMessageCount(messages);
    const shouldShowButton = !showFullHistory && hiddenCount > 0;
    
    console.log('   - Total messages:', messages.length);
    console.log('   - Displayed messages:', displayedMessages.length);
    console.log('   - Hidden messages:', hiddenCount);
    console.log('   - Should show button:', shouldShowButton);
    console.log('   - showFullHistory state:', showFullHistory);
    
    return {
      totalMessages: messages.length,
      displayedMessages: displayedMessages.length,
      hiddenCount,
      shouldShowButton,
      showFullHistory
    };
    
  } catch (error) {
    console.log('   - Error testing display logic:', error);
    return null;
  }
}

// Test 4: Check React component state
function checkReactState() {
  console.log('📋 Test 4: Checking React Component State');
  
  // Try to find React component instances
  const reactRoot = document.querySelector('#__next') || document.querySelector('#root');
  if (reactRoot) {
    console.log('   - React root found:', !!reactRoot);
    
    // Look for any React DevTools data
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('   - React DevTools available:', true);
    }
  }
  
  // Check for any global state
  if (window.React) {
    console.log('   - React available:', true);
  }
  
  return {
    reactRoot: !!reactRoot,
    devTools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  };
}

// Test 5: Create test data to verify the logic
function createTestData() {
  console.log('📋 Test 5: Creating Test Data');
  
  const testMessages = [
    {
      id: 'test-1',
      content: 'First question about the text',
      role: 'user',
      timestamp: new Date().toISOString(),
      provider: 'openai'
    },
    {
      id: 'test-2',
      content: 'First answer from AI',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      provider: 'openai',
      model: 'gpt-3.5-turbo'
    },
    {
      id: 'test-3',
      content: 'Second question about the text',
      role: 'user',
      timestamp: new Date().toISOString(),
      provider: 'openai'
    },
    {
      id: 'test-4',
      content: 'Second answer from AI',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      provider: 'openai',
      model: 'gpt-3.5-turbo'
    },
    {
      id: 'test-5',
      content: 'Third question about the text',
      role: 'user',
      timestamp: new Date().toISOString(),
      provider: 'openai'
    }
  ];
  
  // Save test data
  sessionStorage.setItem('chatHistory', JSON.stringify(testMessages));
  console.log('   - Test data created with', testMessages.length, 'messages');
  
  // Test the logic with test data
  const testResult = testDisplayLogic();
  console.log('   - Test result with new data:', testResult);
  
  return testMessages;
}

// Test 6: Check CSS and styling
function checkCSSAndStyling() {
  console.log('📋 Test 6: Checking CSS and Styling');
  
  const historyButton = document.querySelector('[class*="historyToggle"]');
  if (historyButton) {
    const styles = window.getComputedStyle(historyButton);
    console.log('   - History button styles:');
    console.log('     - Display:', styles.display);
    console.log('     - Visibility:', styles.visibility);
    console.log('     - Opacity:', styles.opacity);
    console.log('     - Position:', styles.position);
    console.log('     - Z-index:', styles.zIndex);
  }
  
  return {
    buttonFound: !!historyButton,
    buttonVisible: historyButton ? window.getComputedStyle(historyButton).display !== 'none' : false
  };
}

// Run all tests
function runAllDebugTests() {
  console.log('🚀 Running All Debug Tests');
  console.log('==========================');
  
  const results = {
    chatHistoryState: checkChatHistoryState(),
    domElements: checkDOMElements(),
    displayLogic: testDisplayLogic(),
    reactState: checkReactState(),
    testData: createTestData(),
    cssStyling: checkCSSAndStyling()
  };
  
  console.log('==========================');
  console.log('📊 Debug Results Summary:');
  console.log('==========================');
  
  // Summary
  console.log('✅ Chat History State:', results.chatHistoryState.chatHistory ? 'Found' : 'Not Found');
  console.log('✅ DOM Elements:', results.domElements.historyButton ? 'Button Found' : 'Button Not Found');
  console.log('✅ Display Logic:', results.displayLogic ? 'Working' : 'Not Working');
  console.log('✅ React State:', results.reactState.reactRoot ? 'Available' : 'Not Available');
  console.log('✅ CSS Styling:', results.cssStyling.buttonVisible ? 'Button Visible' : 'Button Hidden');
  
  // Recommendations
  console.log('');
  console.log('💡 Recommendations:');
  if (!results.chatHistoryState.chatHistory) {
    console.log('   - Create some chat history first by having a conversation');
  }
  if (!results.domElements.historyButton) {
    console.log('   - Check if the button should be visible based on message count');
  }
  if (results.displayLogic && !results.displayLogic.shouldShowButton) {
    console.log('   - The logic suggests no button should be shown (message count <= 2)');
  }
  
  return results;
}

// Export functions
window.debugChatHistory = {
  runAllDebugTests,
  checkChatHistoryState,
  checkDOMElements,
  testDisplayLogic,
  checkReactState,
  createTestData,
  checkCSSAndStyling
};

console.log('🎯 Chat History Debug Tools Ready!');
console.log('💡 Run: debugChatHistory.runAllDebugTests() to debug the issue');
console.log('💡 Or run individual tests like: debugChatHistory.checkDOMElements()');
