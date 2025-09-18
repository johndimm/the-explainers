'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/PageLayout'
import { ExampleInfo, staticExamples, parseExampleHTML } from '@/utils/exampleParser'

export default function ExamplesPage() {
  const router = useRouter()
  const [examples, setExamples] = useState<ExampleInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadExamples = async () => {
      try {
        // Try to dynamically load and parse the example files
        const exampleFiles = [
          'bible-trump.html',
          'wittgenstein-quine.html',
          'finnigans-wake-david-foster-wallace.html',
          'merchant-of-venice-ship-worries.html',
          'merchant-of-venice-happy-sad.html',
          'devil-and-his-dam.html'
        ]

        const parsedExamples: ExampleInfo[] = []
        
        for (const filename of exampleFiles) {
          try {
            const response = await fetch(`/examples/${filename}`)
            if (response.ok) {
              const htmlContent = await response.text()
              const parsedExample = parseExampleHTML(htmlContent, filename)
              parsedExamples.push(parsedExample)
            } else {
              console.warn(`Failed to load ${filename}:`, response.status)
              // Fallback to static data for this file
              const staticExample = staticExamples.find(ex => ex.filename === filename)
              if (staticExample) {
                parsedExamples.push(staticExample)
              }
            }
          } catch (error) {
            console.warn(`Error loading ${filename}:`, error)
            // Fallback to static data for this file
            const staticExample = staticExamples.find(ex => ex.filename === filename)
            if (staticExample) {
              parsedExamples.push(staticExample)
            }
          }
        }

        // If we couldn't load any files dynamically, use static data
        if (parsedExamples.length === 0) {
          setExamples(staticExamples)
        } else {
          setExamples(parsedExamples)
        }
      } catch (error) {
        console.error('Error loading examples:', error)
        // Fallback to static data
        setExamples(staticExamples)
      } finally {
        setLoading(false)
      }
    }

    loadExamples()
  }, [])

  return (
    <PageLayout 
      title="Example Quotes" 
      subtitle="Sample texts and quotes from various literary works"
    >
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center" style={{ padding: '40px', color: '#6c757d' }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
              <div style={{ fontSize: '16px' }}>Loading examples...</div>
            </div>
          ) : (
            examples.map((example, index) => (
              <div key={index} className="card" style={{ marginBottom: '20px' }}>
                <div className="card-body">
                  <h5 className="card-title">
                    <button
                      onClick={() => router.push(`/examples/${example.filename.replace('.html', '')}`)}
                      className="btn btn-link p-0 text-start"
                      style={{ 
                        color: '#007bff',
                        textDecoration: 'none',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {example.source}
                    </button>
                  </h5>
                  <div className="mb-2">
                    <strong>Explainer:</strong> {example.explainer}
                  </div>
                  <div className="mb-3">
                    <strong>Provider:</strong> {example.provider}
                  </div>
                  <div 
                    className="bg-light p-3 rounded"
                    style={{
                      fontStyle: 'italic',
                      fontSize: '16px',
                      color: '#6c757d',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.6'
                    }}
                  >
                    {example.quote}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  )
}

