'use client'

import React from 'react'
import PageLayout from '@/components/PageLayout'

export default function AboutPage() {
  return (
    <PageLayout 
      title="About The Explainers"
      subtitle="Learn more about this AI-powered literary analysis platform"
    >
      <div className="space-y-8">
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-purple-light))' }}>
          <div className="card-body">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm">
                🤖
              </div>
              <h3 className="text-xl font-semibold text-gray-900 m-0">AI-Generated Code</h3>
            </div>
            <p className="text-gray-700 leading-relaxed m-0">
              <strong>This entire application was written by AI.</strong> The code is completely untouched by human hands, 
              demonstrating the remarkable capabilities of modern AI development tools.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">👨‍💻</span>
                <h3 className="text-lg font-semibold m-0">Author</h3>
              </div>
              <p className="font-semibold text-gray-900 mb-4">John Dimm</p>
              <a 
                href="https://www.linkedin.com/in/johndimm/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                📱 View on LinkedIn
              </a>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📅</span>
                <h3 className="text-lg font-semibold m-0">Development Period</h3>
              </div>
              <p className="m-0">
                Written in <strong>July and August 2025</strong>
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💻</span>
                <h3 className="text-lg font-semibold m-0">Development Process</h3>
              </div>
              <p className="m-0">
                Built through <strong>vibe programming</strong> with Claude, then refined with Cursor
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔗</span>
                <h3 className="text-lg font-semibold m-0">Open Source</h3>
              </div>
              <p className="mb-4">
                The complete source code is available on GitHub
              </p>
              <a 
                href="https://github.com/johndimm/the-explainers" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                📂 View on GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-warning-light), var(--color-success-light))' }}>
          <div className="card-body text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm mx-auto mb-4">
              🚀
            </div>
            <h3 className="text-xl font-semibold mb-4">Innovation in AI Development</h3>
            <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto m-0">
              This project demonstrates the power of AI-assisted development, where human creativity and 
              AI capabilities combine to create sophisticated applications that push the boundaries of what's possible.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
