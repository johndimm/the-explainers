'use client'
import { log } from '@/utils/log'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/PageLayout'

interface ExampleData {
  filename: string
  title: string
  subtitle: string
  source: string
  explainer: string
  provider: string
  quote: string
  comment: string
}

export default function ExamplesPage() {
  const router = useRouter()
  const [examples, setExamples] = useState<ExampleData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadExamples = async () => {
      try {
        // Load examples data from JSON file
        const response = await fetch('/api/examples-data')
        if (response.ok) {
          const examplesData = await response.json()
          setExamples(examplesData)
        } else {
          log('ui','Failed to load examples data:', response.status)
        }
      } catch (error) {
        log('ui','Error loading examples data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadExamples()
  }, [])

  return (
    <PageLayout 
      title="Example Quotes" 
      subtitle="Sample texts and quotes from various literary works with The Explainers"
    >
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center" style={{ padding: '40px', color: '#6c757d' }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
              <div style={{ fontSize: '16px' }}>Loading examples...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {examples.map((example, index) => (
                <div key={index} style={{ 
                  flex: '1 1 calc(50% - 10px)', 
                  minWidth: '300px',
                  marginBottom: '20px'
                }}>
                  <div className="card" style={{ height: '100%' }}>
                    <div className="card-body" style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      height: '100%'
                    }}>
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
                      
                      <div className="mb-3">
                        <div className="mb-2">
                          <strong>Explainer:</strong> {example.explainer}
                        </div>
                        <div className="mb-2">
                          <strong>Provider:</strong> {example.provider}
                        </div>
                        <div className="mb-2">
                          <strong>File:</strong> {example.filename}
                        </div>
                      </div>

                      {example.quote && (
                        <div 
                          className="bg-light p-3 rounded mb-3"
                          style={{
                            fontStyle: 'italic',
                            fontSize: '14px',
                            color: '#6c757d',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5',
                            borderLeft: '4px solid #007bff',
                            flexGrow: 1
                          }}
                        >
                          "{example.quote}"
                        </div>
                      )}

                      <div 
                        className="bg-info bg-opacity-10 p-3 rounded"
                        style={{
                          fontSize: '13px',
                          color: '#0c5460',
                          lineHeight: '1.4',
                          borderLeft: '4px solid #0dcaf0'
                        }}
                      >
                        <strong>What's interesting:</strong> {example.comment}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

