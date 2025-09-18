'use client'

import React from 'react'
import PageLayout from '@/components/PageLayout'
import demoSteps from '../../data/demo-steps.json'

// Demo steps are now imported from JSON

export default function DemoPage() {
  return (
    <PageLayout 
      title="Tutorial" 
      subtitle="A quick walkthrough: select a passage and get an AI explanation"
    >
      <div className="demo-grid">
        {demoSteps.map((step, idx) => (
          <div key={idx} className="demo-step">
            <div className="demo-step-header">
              <div className="demo-step-number">
                {idx + 1}
              </div>
              <div>
                <h3 className="demo-step-title">{step.title}</h3>
                <p className="demo-step-description">{step.description}</p>
              </div>
            </div>
            <div className="demo-screenshot">
              <img 
                src={step.image} 
                alt={step.title}
                className="demo-screenshot-image"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-purple-light), var(--color-primary-light))' }}>
          <div className="card-body">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm mx-auto mb-4">
              📚
            </div>
            <h3 className="text-xl font-semibold mb-4">Ready to explore literature?</h3>
            <p className="text-gray-700 leading-relaxed mb-6 max-w-lg mx-auto">
              Try out The Explainers with your favorite books. Get instant AI explanations 
              in different voices and styles to deepen your understanding.
            </p>
            <a href="/library" className="btn btn-primary btn-lg">
              Start Reading
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
