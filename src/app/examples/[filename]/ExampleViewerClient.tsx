'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageLayout from '@/components/PageLayout'

export default function ExampleViewerClient() {
  // Params may be null before hydration; type defensively
  const params = useParams() as { filename?: string } | null
  const router = useRouter()
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadExample = async () => {
      try {
        const raw = params?.filename
        const filename = Array.isArray(raw) ? raw[0] : raw
        if (!filename) {
          setError('No filename provided')
          setLoading(false)
          return
        }

        // Ensure the filename has .html extension
        const filenameWithExtension = filename.endsWith('.html') ? filename : `${filename}.html`

        const response = await fetch(`/examples/${filenameWithExtension}`)
        if (!response.ok) {
          setError(`Failed to load example: ${response.status}`)
          setLoading(false)
          return
        }

        const content = await response.text()
        setHtmlContent(content)
      } catch (err) {
        setError('Error loading example')
        console.error('Error loading example:', err)
      } finally {
        setLoading(false)
      }
    }

    loadExample()
  }, [params?.filename])

  if (loading) {
    return (
      <PageLayout title="Loading Example" subtitle="Please wait while we load the chat history">
        <div className="card">
          <div className="card-body text-center" style={{ padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontSize: '18px' }}>Loading example...</div>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout title="Error" subtitle="Unable to load the example">
        <div className="card">
          <div className="card-body text-center" style={{ padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <div style={{ fontSize: '18px', marginBottom: '16px' }}>{error}</div>
            <button
              onClick={() => router.push('/examples')}
              className="btn btn-primary"
            >
              ← Back to Examples
            </button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <div 
      style={{ 
        maxHeight: '100vh',
        overflow: 'auto'
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
