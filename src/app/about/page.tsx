'use client'

import React from 'react'
import PageLayout from '@/components/PageLayout'

export default function AboutPage() {
  return (
    <PageLayout 
      title="About The Explainers" 
      maxWidth="1200px"
      backgroundColor="#f9f9f9"
    >
      <div style={{ background: 'white', borderRadius: '8px', padding: '40px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>

        <div style={{ background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
          <h2 style={{ color: '#0369a1', marginTop: '0', marginBottom: '15px' }}>🤖 AI-Generated Code</h2>
          <p style={{ margin: '0', fontSize: '16px', color: '#0369a1' }}>
            <strong>This entire application was written by AI.</strong> The code is completely untouched by human hands.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '12px', border: '1px solid #e9ecef' }}>
            <h3 style={{ color: '#495057', marginTop: '0', marginBottom: '12px' }}>👨‍💻 Author</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
              <strong>John Dimm</strong>
            </p>
            <a 
              href="https://www.linkedin.com/in/johndimm/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#007bff', 
                textDecoration: 'none',
                padding: '8px 16px',
                background: '#e3f2fd',
                borderRadius: '6px',
                display: 'inline-block',
                fontSize: '14px'
              }}
            >
              📱 View on LinkedIn
            </a>
          </div>

          <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '12px', border: '1px solid #e9ecef' }}>
            <h3 style={{ color: '#495057', marginTop: '0', marginBottom: '12px' }}>📅 Development Period</h3>
            <p style={{ margin: '0', fontSize: '16px' }}>
              Written in <strong>July and August 2025</strong>
            </p>
          </div>

          <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '12px', border: '1px solid #e9ecef' }}>
            <h3 style={{ color: '#495057', marginTop: '0', marginBottom: '12px' }}>💻 Development Process</h3>
            <p style={{ margin: '0', fontSize: '16px' }}>
              Built through <strong>vibe programming</strong> with Claude, then refined with Cursor
            </p>
          </div>

          <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '12px', border: '1px solid #e9ecef' }}>
            <h3 style={{ color: '#495057', marginTop: '0', marginBottom: '12px' }}>🔗 Open Source</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
              The complete source code is available on GitHub
            </p>
            <a 
              href="https://github.com/johndimm/the-explainers" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#007bff', 
                textDecoration: 'none',
                padding: '8px 16px',
                background: '#e3f2fd',
                borderRadius: '6px',
                display: 'inline-block',
                fontSize: '14px'
              }}
            >
              📂 View on GitHub
            </a>
          </div>
        </div>

        <div style={{ 
          marginTop: '32px', 
          padding: '20px', 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0', fontSize: '16px', color: '#856404' }}>
            <strong>🚀 Innovation:</strong> This project demonstrates the power of AI-assisted development, 
            where human creativity and AI capabilities combine to create sophisticated applications.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
