'use client'

import React from 'react'
import PageLayout from './PageLayout'

const UserGuide: React.FC = () => {
  return (
    <PageLayout 
      title="User Guide" 
      subtitle="Learn how to use The Explainers to understand difficult texts"
    >
      <div style={{ background: 'white', borderRadius: '8px', padding: '40px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>

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

        <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>Tips</h3>
        <ul>
          <li style={{ marginBottom: '5px' }}><strong>Navigation</strong>: The hamburger menu (☰) in the top right provides access to all app features from any page.</li>
          <li style={{ marginBottom: '5px' }}><strong>Desktop selection</strong>: Click the start of your quote, hold down the mouse button, drag to the end of your quote, and lift up the mouse button.</li>
          <li style={{ marginBottom: '5px' }}><strong>Mobile selection</strong>: Long‑press (with a short vibration) to enter selection, drag to the end of your quote and lift your finger.</li>
          <li style={{ marginBottom: '5px' }}><strong>Search navigation</strong>: Use the up/down arrows next to the search to jump between hits.</li>
        </ul>

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
          <li style={{ marginBottom: '5px' }}><strong>Context Awareness</strong>: AI knows where you are in the text</li>
          <li style={{ marginBottom: '5px' }}><strong>Multiple Personalities</strong>: Choose from 50+ explainer styles</li>
        </ul>

        <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>Smart Context Detection</h3>
        <ul>
          <li style={{ marginBottom: '5px' }}><strong>Shakespeare Plays</strong>: Automatically detects act, scene, speaker, and characters on stage for rich dramatic context</li>
          <li style={{ marginBottom: '5px' }}><strong>Chapter & Section Detection</strong>: Identifies chapters, sections, parts, and books to provide precise location context</li>
          <li style={{ marginBottom: '5px' }}><strong>Multiple Formats</strong>: Recognizes various chapter formats including "Chapter 1", "Ch. 1", "I.", and Roman numerals</li>
          <li style={{ marginBottom: '5px' }}><strong>Rich Context</strong>: Provides explanations that consider the book's structure, location, and surrounding context</li>
          <li style={{ marginBottom: '5px' }}><strong>Performance Insights</strong>: For plays, understands how lines would be delivered on stage and their dramatic impact</li>
        </ul>

        <h3 style={{ color: '#007bff', marginTop: '25px', marginBottom: '10px' }}>Library</h3>
        <ul>
          <li style={{ marginBottom: '5px' }}><strong>Curated Collection</strong>: Hundreds of classic texts organized by category</li>
          <li style={{ marginBottom: '5px' }}><strong>Custom URLs</strong>: Load any text from the web</li>
          <li style={{ marginBottom: '5px' }}><strong>File Upload</strong>: Upload your own .txt files</li>

        </ul>
        
        <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '6px', padding: '12px', marginTop: '12px', fontSize: '14px' }}>
          <strong>💡 Project Gutenberg Tip:</strong> When you find a book on <a href="https://www.gutenberg.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>Project Gutenberg</a>, select the <strong>"Plain Text UTF-8"</strong> version.
        </div>


      </div>
    </PageLayout>
  )
}

export default UserGuide