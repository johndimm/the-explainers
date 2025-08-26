'use client'

import React from 'react'

const UserGuide: React.FC = () => {
  return (
    <div style={{ marginTop: '60px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif', lineHeight: '1.6', color: '#333', maxWidth: '800px', margin: '60px auto 0', padding: '20px', backgroundColor: '#f9f9f9' }}>
      <div style={{ background: 'white', borderRadius: '8px', padding: '40px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#8b5cf6', borderBottom: '3px solid #8b5cf6', paddingBottom: '10px', marginBottom: '30px' }}>
          The Explainers - User Guide
        </h1>

        <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', padding: '15px', margin: '15px 0' }}>
          <strong>Welcome to The Explainers!</strong> This app helps you understand difficult texts by providing AI-powered explanations of selected passages. Whether you're tackling Shakespeare, philosophy, or classic literature, we make challenging texts accessible.
        </div>

        <h2 style={{ color: '#10b981', marginTop: '30px', marginBottom: '15px' }}>Getting Started</h2>

        <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>Quick Start</h3>
        <ol style={{ marginBottom: '15px' }}>
          <li style={{ marginBottom: '5px' }}>Open the application and select a book from the library</li>
          <li style={{ marginBottom: '5px' }}>Simply select any text passage you find confusing</li>
          <li style={{ marginBottom: '5px' }}>Get an instant AI explanation tailored to your needs</li>
          <li style={{ marginBottom: '5px' }}>Ask follow-up questions in the chat interface</li>
        </ol>

        <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>First-Time Setup</h3>
        <p>For the best experience, configure your profile and preferences:</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', margin: '20px 0' }}>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h4 style={{ color: '#666', marginTop: '0', marginBottom: '8px' }}>Profile Setup</h4>
            <p>Use the hamburger menu to open <strong>Profile</strong> and set:</p>
            <ul>
              <li style={{ marginBottom: '5px' }}>Your age (for age-appropriate vocabulary)</li>
              <li style={{ marginBottom: '5px' }}>Preferred language (12 languages supported)</li>
              <li style={{ marginBottom: '5px' }}>Education level (elementary to graduate school)</li>
            </ul>
          </div>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h4 style={{ color: '#666', marginTop: '0', marginBottom: '8px' }}>Settings Configuration</h4>
            <p>Open <strong>Settings</strong> to customize:</p>
            <ul>
              <li style={{ marginBottom: '5px' }}>AI model provider (GPT-4, Claude, DeepSeek, Gemini)</li>
              <li style={{ marginBottom: '5px' }}>Response length (brief, medium, long)</li>
              <li style={{ marginBottom: '5px' }}>Text and chat fonts</li>
              <li style={{ marginBottom: '5px' }}>Explanation style (50+ personalities!)</li>
            </ul>
          </div>
        </div>

        <h2 style={{ color: '#10b981', marginTop: '30px', marginBottom: '15px' }}>Core Features</h2>

        <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>Text Reader</h3>
        <ul>
          <li style={{ marginBottom: '5px' }}><strong>Clean Interface</strong>: Distraction-free reading environment</li>
          <li style={{ marginBottom: '5px' }}><strong>Text Selection</strong>: Highlight passages with mouse or touch</li>
          <li style={{ marginBottom: '5px' }}><strong>Auto-Bookmarks</strong>: Your reading position is automatically saved</li>
          <li style={{ marginBottom: '5px' }}><strong>Smart Context</strong>: AI understands which character is speaking and the scene context</li>
        </ul>

        <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>AI Chat Interface</h3>
        <ul>
          <li style={{ marginBottom: '5px' }}><strong>Instant Explanations</strong>: Get immediate help with difficult passages</li>
          <li style={{ marginBottom: '5px' }}><strong>Follow-up Questions</strong>: Ask for clarification or deeper analysis</li>
          <li style={{ marginBottom: '5px' }}><strong>Context Awareness</strong>: AI knows exactly where you are in the text</li>
          <li style={{ marginBottom: '5px' }}><strong>Multiple Personalities</strong>: Choose from 50+ explanation styles</li>
        </ul>

        <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>Library</h3>
        <ul>
          <li style={{ marginBottom: '5px' }}><strong>Curated Collection</strong>: Hundreds of classic texts organized by category</li>
          <li style={{ marginBottom: '5px' }}><strong>Custom URLs</strong>: Load any text from the web</li>
          <li style={{ marginBottom: '5px' }}><strong>File Upload</strong>: Upload your own .txt files</li>
          <li style={{ marginBottom: '5px' }}><strong>Quick Return</strong>: Easy navigation back to your current book</li>
        </ul>

        <h2 style={{ color: '#10b981', marginTop: '30px', marginBottom: '12px' }}>What’s New</h2>
        <ul>
          <li style={{ marginBottom: '6px' }}><strong>Reader resumes position</strong>: Your last scroll position is saved and restored across one‑panel and two‑panel layouts.</li>
          <li style={{ marginBottom: '6px' }}><strong>Smarter search</strong>: Finds phrases with or without punctuation and flexible spacing, and scrolls to results.</li>
          <li style={{ marginBottom: '6px' }}><strong>Playphrase link</strong>: After an explanation (and under any embedded video), tap “Is this quote in the movies?” to search film clips. It reuses the same browser tab.</li>
          <li style={{ marginBottom: '6px' }}><strong>Styles preview</strong>: The Styles page now shows a photo preview of the selected persona. Added <em>Stephen King</em>.</li>
          <li style={{ marginBottom: '6px' }}><strong>Chat uses your style</strong>: Chat automatically follows the currently selected explainer style unless you change it in Chat.</li>
          <li style={{ marginBottom: '6px' }}><strong>Library polish</strong>: URL + Upload buttons fit on one line on phones; the URL placeholder is shorter; English Literature is trimmed to the top 100 books for speed.</li>
          <li style={{ marginBottom: '6px' }}><strong>Credits page</strong>: Shows books you own with Open links, and a live countdown for <em>Unlimited</em> time remaining. The “1 Day” option grants 24‑hour unlimited access.</li>
        </ul>

        <h3 style={{ color: '#007bff', marginTop: '22px', marginBottom: '10px' }}>Tips</h3>
        <ul>
          <li style={{ marginBottom: '5px' }}><strong>Desktop selection</strong>: Drag to highlight, then choose Explain.</li>
          <li style={{ marginBottom: '5px' }}><strong>Mobile selection</strong>: Long‑press to enter selection, drag to refine; scrolling is locked while selecting for accuracy.</li>
          <li style={{ marginBottom: '5px' }}><strong>Search navigation</strong>: Use the up/down arrows next to the search to jump between hits.</li>
        </ul>

        <p style={{ marginTop: '30px', padding: '15px', background: '#e3f2fd', borderRadius: '6px', borderLeft: '4px solid #2196f3' }}>
          <strong>Tip:</strong> The hamburger menu (☰) in the top right provides access to all app features from any page.
        </p>
      </div>
    </div>
  )
}

export default UserGuide